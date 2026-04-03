import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

// ============ BOOKINGS SERVICE ============
export const bookingsService = {
  // Create new booking with unique QR code
  async createBooking(bookingData) {
    try {
      // Generate unique QR data for each booking
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const uniqueQRData = `${bookingData.userId}|${bookingData.temple}|${bookingData.date}|${bookingData.timeSlot}|${bookingData.tokenNumber}|${timestamp}|${randomString}`;
      
      const bookingRef = collection(db, 'bookings');
      const newBooking = {
        ...bookingData,
        bookedAt: Timestamp.now(),
        status: 'upcoming',
        qrCodeData: uniqueQRData,
        qrGeneratedAt: Timestamp.now(),
        qrVersion: '1.0'
      };
      
      const docRef = await addDoc(bookingRef, newBooking);
      return { id: docRef.id, ...newBooking };
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Get user bookings with real-time listener
  subscribeToUserBookings(userId, callback) {
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', userId),
      orderBy('bookedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(bookings);
    });
  },

  // Get single booking by ID
  async getBookingById(bookingId) {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingDoc = await getDoc(bookingRef);
      if (bookingDoc.exists()) {
        return { id: bookingDoc.id, ...bookingDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting booking:', error);
      throw error;
    }
  },

  // Get booking by token number
  async getBookingByToken(tokenNumber) {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('tokenNumber', '==', tokenNumber)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting booking by token:', error);
      throw error;
    }
  },

  // Update booking status
  async updateBookingStatus(bookingId, status) {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: status,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  // Mark booking as scanned/entry granted
  async markAsScanned(bookingId, scannerInfo = {}) {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'active',
        scannedAt: Timestamp.now(),
        scannedBy: scannerInfo.scannedBy || 'admin',
        entryTime: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error marking as scanned:', error);
      throw error;
    }
  },

  // Complete booking (after darshan)
  async completeBooking(bookingId) {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'completed',
        completedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error completing booking:', error);
      throw error;
    }
  },

  // Get all bookings (admin)
  subscribeToAllBookings(callback) {
    const q = query(
      collection(db, 'bookings'),
      orderBy('bookedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(bookings);
    });
  },

  // Get bookings by date
  async getBookingsByDate(date) {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('date', '==', date),
        orderBy('timeSlot', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting bookings by date:', error);
      throw error;
    }
  },

  // Get bookings by temple
  async getBookingsByTemple(templeId, date = null) {
    try {
      let q = query(
        collection(db, 'bookings'),
        where('temple', '==', templeId)
      );
      
      if (date) {
        q = query(q, where('date', '==', date));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting bookings by temple:', error);
      throw error;
    }
  },

  // Check for duplicate bookings
  async checkDuplicateBooking(userId, temple, date, timeSlot) {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        where('temple', '==', temple),
        where('date', '==', date),
        where('timeSlot', '==', timeSlot),
        where('status', 'in', ['upcoming', 'active'])
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  },

  // Cancel booking
  async cancelBooking(bookingId, reason = 'User requested cancellation') {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        cancellationReason: reason
      });
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Get booking statistics for a temple
  async getBookingStats(templeId, date) {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('temple', '==', templeId),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map(doc => doc.data());
      
      const stats = {
        total: bookings.length,
        upcoming: bookings.filter(b => b.status === 'upcoming').length,
        active: bookings.filter(b => b.status === 'active').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        priority: bookings.filter(b => b.priority === true).length
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
};

// ============ CROWD DATA SERVICE ============
export const crowdService = {
  // Real-time crowd data subscription
  subscribeToCrowdData(templeId, callback) {
    const crowdRef = doc(db, 'crowdData', templeId);
    return onSnapshot(crowdRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  },

  // Update crowd levels (admin)
  async updateCrowdLevels(templeId, levels) {
    try {
      const crowdRef = doc(db, 'crowdData', templeId);
      await setDoc(crowdRef, {
        ...levels,
        temple: templeId,
        lastUpdated: Timestamp.now()
      }, { merge: true });
      
      // Add to history
      const historyRef = collection(db, 'crowdHistory');
      await addDoc(historyRef, {
        temple: templeId,
        ...levels,
        timestamp: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating crowd levels:', error);
      throw error;
    }
  },

  // Get historical crowd data
  async getHistoricalData(templeId, hours = 24) {
    try {
      const cutoffTime = Timestamp.fromDate(new Date(Date.now() - hours * 60 * 60 * 1000));
      const q = query(
        collection(db, 'crowdHistory'),
        where('temple', '==', templeId),
        where('timestamp', '>=', cutoffTime),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting historical data:', error);
      throw error;
    }
  },

  // Get all temples crowd data
  subscribeToAllCrowdData(callback) {
    const q = collection(db, 'crowdData');
    return onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = { id: doc.id, ...doc.data() };
      });
      callback(data);
    });
  },

  // Get single temple crowd data
  async getTempleCrowdData(templeId) {
    try {
      const crowdRef = doc(db, 'crowdData', templeId);
      const crowdDoc = await getDoc(crowdRef);
      if (crowdDoc.exists()) {
        return { id: crowdDoc.id, ...crowdDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting temple crowd data:', error);
      throw error;
    }
  }
};

// ============ ROUTING MESSAGES SERVICE ============
export const routingService = {
  // Subscribe to routing messages for a temple
  subscribeToRoutingMessages(templeId, callback) {
    const q = query(
      collection(db, 'routingMessages'),
      where('temple', '==', templeId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  },

  // Add new routing message (admin)
  async addRoutingMessage(templeId, message, priorityGroup = 'all') {
    try {
      const messagesRef = collection(db, 'routingMessages');
      const docRef = await addDoc(messagesRef, {
        temple: templeId,
        message: message,
        priorityGroup: priorityGroup,
        createdAt: Timestamp.now(),
        isActive: true,
        type: 'manual'
      });
      return { id: docRef.id, message, priorityGroup };
    } catch (error) {
      console.error('Error adding routing message:', error);
      throw error;
    }
  },

  // Deactivate routing message
  async deactivateMessage(messageId) {
    try {
      const messageRef = doc(db, 'routingMessages', messageId);
      await updateDoc(messageRef, {
        isActive: false,
        deactivatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error deactivating message:', error);
      throw error;
    }
  },

  // Get all active messages (admin view)
  subscribeToAllMessages(callback) {
    const q = query(
      collection(db, 'routingMessages'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  },

  // Delete message
  async deleteMessage(messageId) {
    try {
      await deleteDoc(doc(db, 'routingMessages', messageId));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
};

// ============ NOTIFICATION SERVICE ============
export const notificationService = {
  // Add notification for user
  async addNotification(userId, title, message, type = 'info') {
    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId: userId,
        title: title,
        message: message,
        type: type,
        read: false,
        createdAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  },

  // Subscribe to user notifications
  subscribeToUserNotifications(userId, callback) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    });
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true, readAt: Timestamp.now() });
      });
      await batch.commit();
      
      return snapshot.size;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }
};

// ============ STATISTICS SERVICE ============
export const statsService = {
  // Get dashboard statistics for admin
  async getDashboardStats() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayStart = Timestamp.fromDate(today);
      const todayEnd = Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));
      
      // Get today's bookings
      const bookingsRef = collection(db, 'bookings');
      const todayQuery = query(
        bookingsRef,
        where('bookedAt', '>=', todayStart),
        where('bookedAt', '<', todayEnd)
      );
      const todaySnapshot = await getDocs(todayQuery);
      
      // Get active bookings
      const activeQuery = query(
        bookingsRef,
        where('status', '==', 'upcoming')
      );
      const activeSnapshot = await getDocs(activeQuery);
      
      // Get total bookings
      const totalSnapshot = await getDocs(bookingsRef);
      
      // Get crowd data summary
      const crowdSnapshot = await getDocs(collection(db, 'crowdData'));
      let avgCrowd = 0;
      crowdSnapshot.docs.forEach(doc => {
        avgCrowd += doc.data().entranceLevel || 0;
      });
      avgCrowd = crowdSnapshot.size ? avgCrowd / crowdSnapshot.size : 0;
      
      return {
        todayBookings: todaySnapshot.size,
        activeBookings: activeSnapshot.size,
        totalBookings: totalSnapshot.size,
        averageCrowdLevel: Math.round(avgCrowd),
        totalTemples: crowdSnapshot.size
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  },

  // Get slot-wise statistics
  async getSlotStats(templeId, date) {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('temple', '==', templeId),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map(doc => doc.data());
      
      const slotStats = {};
      const timeSlots = [
        '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
        '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
        '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
      ];
      
      timeSlots.forEach(slot => {
        const slotBookings = bookings.filter(b => b.timeSlot === slot);
        slotStats[slot] = {
          total: slotBookings.length,
          upcoming: slotBookings.filter(b => b.status === 'upcoming').length,
          active: slotBookings.filter(b => b.status === 'active').length,
          completed: slotBookings.filter(b => b.status === 'completed').length
        };
      });
      
      return slotStats;
    } catch (error) {
      console.error('Error getting slot stats:', error);
      throw error;
    }
  }
};

// ============ BATCH OPERATIONS ============
export const batchService = {
  // Clean up old bookings (can be scheduled)
  async cleanupOldBookings(daysToKeep = 30) {
    try {
      const cutoffDate = Timestamp.fromDate(new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000));
      const q = query(
        collection(db, 'bookings'),
        where('status', '==', 'completed'),
        where('bookedAt', '<=', cutoffDate)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return snapshot.size;
    } catch (error) {
      console.error('Error cleaning up old bookings:', error);
      throw error;
    }
  },

  // Update multiple booking statuses
  async bulkUpdateStatus(bookingIds, newStatus) {
    try {
      const batch = writeBatch(db);
      
      bookingIds.forEach(bookingId => {
        const bookingRef = doc(db, 'bookings', bookingId);
        batch.update(bookingRef, {
          status: newStatus,
          bulkUpdatedAt: Timestamp.now()
        });
      });
      
      await batch.commit();
      return bookingIds.length;
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }
};

// Export all services as default
export default {
  bookingsService,
  crowdService,
  routingService,
  notificationService,
  statsService,
  batchService
};