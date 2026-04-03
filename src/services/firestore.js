// src/services/firestore.js
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
  // Create new booking
  async createBooking(bookingData) {
    try {
      const bookingRef = collection(db, 'bookings');
      const newBooking = {
        ...bookingData,
        bookedAt: Timestamp.now(),
        status: 'upcoming',
        qrCodeData: `${bookingData.userId}|${bookingData.temple}|${bookingData.date}|${bookingData.timeSlot}|${Date.now()}`
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

  // Update booking status
  async updateBookingStatus(bookingId, status) {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: status,
      updatedAt: Timestamp.now()
    });
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

  // Check for duplicate bookings
  async checkDuplicateBooking(userId, temple, date, timeSlot) {
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
  },

  // Get historical crowd data
  async getHistoricalData(templeId, hours = 24) {
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
    const messagesRef = collection(db, 'routingMessages');
    await addDoc(messagesRef, {
      temple: templeId,
      message: message,
      priorityGroup: priorityGroup,
      createdAt: Timestamp.now(),
      isActive: true
    });
  },

  // Deactivate routing message
  async deactivateMessage(messageId) {
    const messageRef = doc(db, 'routingMessages', messageId);
    await updateDoc(messageRef, {
      isActive: false,
      deactivatedAt: Timestamp.now()
    });
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
  }
};

// ============ NOTIFICATION SERVICE ============
export const notificationService = {
  // Add notification for user
  async addNotification(userId, title, message, type = 'info') {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: userId,
      title: title,
      message: message,
      type: type,
      read: false,
      createdAt: Timestamp.now()
    });
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
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: Timestamp.now()
    });
  }
};

// ============ STATISTICS SERVICE ============
export const statsService = {
  // Get dashboard statistics for admin
  async getDashboardStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get today's bookings
    const bookingsRef = collection(db, 'bookings');
    const todayStart = Timestamp.fromDate(today);
    const todayEnd = Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));
    
    const q = query(
      bookingsRef,
      where('bookedAt', '>=', todayStart),
      where('bookedAt', '<', todayEnd)
    );
    
    const snapshot = await getDocs(q);
    const todayBookings = snapshot.size;
    
    // Get active bookings
    const activeQ = query(
      bookingsRef,
      where('status', '==', 'upcoming')
    );
    const activeSnapshot = await getDocs(activeQ);
    
    return {
      todayBookings,
      activeBookings: activeSnapshot.size,
      totalBookings: (await getDocs(bookingsRef)).size
    };
  }
};

// ============ BATCH OPERATIONS ============
export const batchService = {
  // Clean up old bookings (can be scheduled)
  async cleanupOldBookings(daysToKeep = 30) {
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
  }
};

// ============ NAMED EXPORTS FOR BACKWARD COMPATIBILITY ============
export const createBooking = (bookingData) => bookingsService.createBooking(bookingData);
export const getUserBookings = (userId) => {
  return new Promise((resolve) => {
    const unsubscribe = bookingsService.subscribeToUserBookings(userId, (bookings) => {
      resolve(bookings);
      unsubscribe();
    });
  });
};
export const updateBookingStatus = (bookingId, status) => bookingsService.updateBookingStatus(bookingId, status);
export const subscribeToCrowdData = (templeId, callback) => crowdService.subscribeToCrowdData(templeId, callback);
export const subscribeToRoutingMessages = (templeId, callback) => routingService.subscribeToRoutingMessages(templeId, callback);