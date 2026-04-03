import { db } from './firebase';
import { 
  collection, query, where, getDocs, addDoc, updateDoc, 
  doc, Timestamp, onSnapshot, getDoc, writeBatch, orderBy, limit 
} from 'firebase/firestore';

class CompleteAutomation {
  static intervals = {};
  static isRunning = false;

  // ============ MAIN AUTOMATION ENGINE ============
  static async start() {
    if (this.isRunning) {
      console.log('⚠️ Automation already running');
      return;
    }
    
    console.log('🚀 ========================================');
    console.log('🤖 FULL AI AUTOMATION SYSTEM STARTED');
    console.log('🚀 ========================================');
    
    this.isRunning = true;
    
    // Start all automation modules
    this.autoCrowdMonitoring();      // Every 30 seconds
    this.autoRoutingMessages();       // Every 2 minutes
    this.autoWaitTimeUpdates();       // Every 5 minutes
    this.autoSlotOptimization();      // Every 15 minutes
    this.autoUserNotifications();     // Real-time
    this.autoPeakHourAdjustment();    // Every 30 minutes
    this.autoFestivalPrepration();    // Daily
    this.autoDataCleanup();           // Daily at midnight
    this.autoPerformanceReports();    // Every hour
    
    console.log('✅ All automation modules activated');
  }

  // ============ 1. AUTO CROWD MONITORING (Every 30 seconds) ============
  static autoCrowdMonitoring() {
    const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
    
    this.intervals.crowdMonitor = setInterval(async () => {
      for (const templeId of temples) {
        try {
          const crowdRef = doc(db, 'crowdData', templeId);
          const crowdDoc = await getDoc(crowdRef);
          
          if (crowdDoc.exists()) {
            const currentData = crowdDoc.data();
            const previousLevel = currentData.previousLevel || 0;
            const currentLevel = currentData.entranceLevel || 0;
            const change = Math.abs(currentLevel - previousLevel);
            
            // Significant change detected (>10%)
            if (change > 10) {
              console.log(`📊 [AUTO] Crowd changed at ${templeId}: ${previousLevel}% → ${currentLevel}%`);
              
              // Auto-save to history
              await addDoc(collection(db, 'crowdHistory'), {
                temple: templeId,
                entranceLevel: currentLevel,
                templeAreaLevel: currentData.templeAreaLevel || 0,
                parkingLevel: currentData.parkingLevel || 0,
                timestamp: Timestamp.now(),
                changeAmount: change,
                autoCaptured: true
              });
              
              // Update previous level
              await updateDoc(crowdRef, {
                previousLevel: currentLevel,
                lastAutoUpdate: Timestamp.now()
              });
              
              // Auto-trigger routing messages if needed
              if (currentLevel > 70) {
                await this.autoCreateAlert(templeId, currentLevel, 'high');
              } else if (currentLevel < 30) {
                await this.autoCreateAlert(templeId, currentLevel, 'low');
              }
            }
          }
        } catch (error) {
          console.error(`[AUTO] Crowd monitor error for ${templeId}:`, error);
        }
      }
    }, 30000); // Every 30 seconds
  }

  // ============ 2. AUTO ROUTING MESSAGES (Every 2 minutes) ============
  static autoRoutingMessages() {
    this.intervals.routingMessages = setInterval(async () => {
      const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
      
      for (const templeId of temples) {
        try {
          const crowdRef = doc(db, 'crowdData', templeId);
          const crowdDoc = await getDoc(crowdRef);
          
          if (crowdDoc.exists()) {
            const data = crowdDoc.data();
            const entrance = data.entranceLevel || 0;
            const templeArea = data.templeAreaLevel || 0;
            const parking = data.parkingLevel || 0;
            
            // Check if we already sent a message recently
            const recentMsgQuery = query(
              collection(db, 'routingMessages'),
              where('temple', '==', templeId),
              where('type', '==', 'auto-generated'),
              where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000)))
            );
            const recentMsg = await getDocs(recentMsgQuery);
            
            // Only send if no recent message (avoid spam)
            if (recentMsg.empty) {
              let autoMessage = null;
              
              if (entrance > 75) {
                autoMessage = `🚨 [AUTO] Main entrance at ${entrance}% capacity! Use East Gate for faster entry.`;
              } else if (entrance > 60) {
                autoMessage = `⚠️ [AUTO] Main entrance crowded (${entrance}%). Use North Gate for faster entry.`;
              } else if (entrance < 30 && templeArea < 40) {
                autoMessage = `🌟 [AUTO] Low crowd detected! Best time for darshan. Expected wait: 10-15 min.`;
              } else if (parking > 80) {
                autoMessage = `🅿️ [AUTO] Parking at ${parking}% capacity! Use overflow parking.`;
              }
              
              if (autoMessage) {
                await addDoc(collection(db, 'routingMessages'), {
                  temple: templeId,
                  message: autoMessage,
                  priorityGroup: 'all',
                  createdAt: Timestamp.now(),
                  isActive: true,
                  type: 'auto-generated',
                  autoTriggered: true,
                  triggerReason: `entrance_${entrance}_parking_${parking}`
                });
                console.log(`📢 [AUTO] Routing message created for ${templeId}`);
              }
            }
          }
        } catch (error) {
          console.error(`[AUTO] Routing error for ${templeId}:`, error);
        }
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  }

  // ============ 3. AUTO WAIT TIME UPDATES (Every 5 minutes) ============
  static autoWaitTimeUpdates() {
    this.intervals.waitTime = setInterval(async () => {
      const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
      
      for (const templeId of temples) {
        try {
          const crowdRef = doc(db, 'crowdData', templeId);
          const crowdDoc = await getDoc(crowdRef);
          
          if (crowdDoc.exists()) {
            const crowdLevel = crowdDoc.data().entranceLevel || 50;
            let waitTime = 30;
            
            // Calculate wait time based on crowd
            if (crowdLevel > 80) waitTime = 90;
            else if (crowdLevel > 60) waitTime = 60;
            else if (crowdLevel > 40) waitTime = 45;
            else if (crowdLevel > 20) waitTime = 30;
            else waitTime = 15;
            
            // Update all upcoming bookings for today
            const today = new Date().toISOString().split('T')[0];
            const bookingsQuery = query(
              collection(db, 'bookings'),
              where('temple', '==', templeId),
              where('date', '==', today),
              where('status', '==', 'upcoming')
            );
            const snapshot = await getDocs(bookingsQuery);
            
            const batch = writeBatch(db);
            snapshot.docs.forEach(bookingDoc => {
              batch.update(bookingDoc.ref, { 
                estimatedWaitTime: waitTime,
                waitTimeAutoUpdated: true,
                lastAutoUpdate: Timestamp.now()
              });
            });
            await batch.commit();
            
            if (snapshot.size > 0) {
              console.log(`⏰ [AUTO] Wait time updated to ${waitTime}min for ${snapshot.size} bookings at ${templeId}`);
            }
          }
        } catch (error) {
          console.error(`[AUTO] Wait time error for ${templeId}:`, error);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // ============ 4. AUTO SLOT OPTIMIZATION (Every 15 minutes) ============
  static autoSlotOptimization() {
    this.intervals.slotOptimization = setInterval(async () => {
      const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
      const today = new Date().toISOString().split('T')[0];
      
      for (const templeId of temples) {
        try {
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('temple', '==', templeId),
            where('date', '==', today)
          );
          const snapshot = await getDocs(bookingsQuery);
          
          // Analyze slot distribution
          const slotCounts = {};
          snapshot.docs.forEach(doc => {
            const slot = doc.data().timeSlot;
            slotCounts[slot] = (slotCounts[slot] || 0) + 1;
          });
          
          // Find congested and free slots
          const congestedSlots = Object.entries(slotCounts).filter(([_, count]) => count > 50);
          const freeSlots = Object.entries(slotCounts).filter(([_, count]) => count < 20);
          
          if (congestedSlots.length > 0) {
            // Auto-create alert for congested slots
            await addDoc(collection(db, 'notifications'), {
              userId: 'admin',
              title: '📊 Slot Congestion Alert',
              message: `${templeId}: ${congestedSlots.map(s => s[0]).join(', ')} slots are heavily booked (${congestedSlots[0][1]}+ bookings)`,
              type: 'auto-alert',
              createdAt: Timestamp.now(),
              read: false
            });
            console.log(`📊 [AUTO] Slot congestion detected at ${templeId}`);
          }
          
          if (freeSlots.length > 0) {
            // Create promotional message for free slots
            await addDoc(collection(db, 'routingMessages'), {
              temple: templeId,
              message: `✨ Good news! ${freeSlots.map(s => s[0]).join(', ')} slots have availability. Book now for faster darshan!`,
              priorityGroup: 'all',
              createdAt: Timestamp.now(),
              isActive: true,
              type: 'auto-promotional',
              autoTriggered: true
            });
            console.log(`✨ [AUTO] Free slot promotion created for ${templeId}`);
          }
        } catch (error) {
          console.error(`[AUTO] Slot optimization error for ${templeId}:`, error);
        }
      }
    }, 15 * 60 * 1000); // Every 15 minutes
  }

  // ============ 5. AUTO USER NOTIFICATIONS (Real-time) ============
  static autoUserNotifications() {
    const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
    
    temples.forEach(templeId => {
      const unsubscribe = onSnapshot(doc(db, 'crowdData', templeId), async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const entranceLevel = data.entranceLevel || 0;
          
          // Get users with upcoming bookings
          const today = new Date().toISOString().split('T')[0];
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('temple', '==', templeId),
            where('date', '==', today),
            where('status', '==', 'upcoming')
          );
          const snapshot = await getDocs(bookingsQuery);
          
          const userIds = [...new Set(snapshot.docs.map(doc => doc.data().userId))];
          
          // Send notifications based on crowd level
          if (entranceLevel > 75 && userIds.length > 0) {
            for (const userId of userIds) {
              await addDoc(collection(db, 'notifications'), {
                userId: userId,
                title: '🔴 Crowd Alert',
                message: `${templeId} temple is heavily crowded (${entranceLevel}%). Consider visiting later or using alternate gate.`,
                type: 'auto-crowd-alert',
                createdAt: Timestamp.now(),
                read: false
              });
            }
            console.log(`📱 [AUTO] Crowd alerts sent to ${userIds.length} users for ${templeId}`);
          } else if (entranceLevel < 30 && userIds.length > 0) {
            for (const userId of userIds) {
              await addDoc(collection(db, 'notifications'), {
                userId: userId,
                title: '🟢 Low Crowd Alert',
                message: `Great time for darshan at ${templeId}! Current crowd is low (${entranceLevel}%).`,
                type: 'auto-crowd-alert',
                createdAt: Timestamp.now(),
                read: false
              });
            }
            console.log(`📱 [AUTO] Low crowd alerts sent to ${userIds.length} users for ${templeId}`);
          }
        }
      });
      
      this.intervals[`notifications_${templeId}`] = unsubscribe;
    });
  }

  // ============ 6. AUTO PEAK HOUR ADJUSTMENT (Every 30 minutes) ============
  static autoPeakHourAdjustment() {
    this.intervals.peakHour = setInterval(async () => {
      const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
      const currentHour = new Date().getHours();
      const isPeakHour = (currentHour >= 10 && currentHour <= 13) || (currentHour >= 17 && currentHour <= 20);
      
      for (const templeId of temples) {
        try {
          const crowdRef = doc(db, 'crowdData', templeId);
          const crowdDoc = await getDoc(crowdRef);
          
          if (crowdDoc.exists()) {
            const currentLevel = crowdDoc.data().entranceLevel || 0;
            
            if (isPeakHour && currentLevel < 50) {
              // Peak hour but low crowd - create awareness message
              await addDoc(collection(db, 'routingMessages'), {
                temple: templeId,
                message: `📢 Peak hour but crowd is manageable (${currentLevel}%). Good time for darshan!`,
                priorityGroup: 'all',
                createdAt: Timestamp.now(),
                isActive: true,
                type: 'auto-peak-alert'
              });
              console.log(`📢 [AUTO] Peak hour message created for ${templeId}`);
            }
          }
        } catch (error) {
          console.error(`[AUTO] Peak hour error for ${templeId}:`, error);
        }
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  // ============ 7. AUTO FESTIVAL PREPARATION (Daily) ============
  static autoFestivalPrepration() {
    this.intervals.festival = setInterval(async () => {
      const festivals = [
        { name: 'Maha Shivaratri', date: '2024-03-08', temple: 'somnath', preparationDays: 7 },
        { name: 'Janmashtami', date: '2024-08-26', temple: 'dwarka', preparationDays: 7 },
        { name: 'Navratri', date: '2024-10-03', temple: 'ambaji', preparationDays: 10 },
        { name: 'Diwali', date: '2024-11-12', temple: 'all', preparationDays: 14 }
      ];
      
      const today = new Date();
      
      for (const festival of festivals) {
        const festDate = new Date(festival.date);
        const daysUntil = Math.ceil((festDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil === festival.preparationDays) {
          // Send preparation alert
          await addDoc(collection(db, 'notifications'), {
            userId: 'admin',
            title: `🎉 ${festival.name} Preparation`,
            message: `${festival.name} is ${daysUntil} days away. Prepare for increased crowd at ${festival.temple}.`,
            type: 'festival-preparation',
            createdAt: Timestamp.now(),
            read: false
          });
          console.log(`🎉 [AUTO] Festival preparation alert for ${festival.name}`);
        }
        
        if (daysUntil === 1) {
          // Create special routing messages for festival
          await addDoc(collection(db, 'routingMessages'), {
            temple: festival.temple === 'all' ? 'somnath' : festival.temple,
            message: `🎊 ${festival.name} tomorrow! Expect heavy crowds. Arrive early for best experience.`,
            priorityGroup: 'all',
            createdAt: Timestamp.now(),
            isActive: true,
            type: 'festival-alert'
          });
          console.log(`🎊 [AUTO] Festival routing message created for ${festival.name}`);
        }
      }
    }, 24 * 60 * 60 * 1000); // Once per day
  }

  // ============ 8. AUTO DATA CLEANUP (Daily at midnight) ============
  static autoDataCleanup() {
    // Schedule for midnight
    const scheduleCleanup = () => {
      const now = new Date();
      const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const msToMidnight = night.getTime() - now.getTime();
      
      setTimeout(async () => {
        await this.performCleanup();
        setInterval(() => this.performCleanup(), 24 * 60 * 60 * 1000);
      }, msToMidnight);
    };
    
    scheduleCleanup();
  }
  
  static async performCleanup() {
    console.log('🧹 [AUTO] Starting daily data cleanup...');
    
    try {
      // Clean old notifications (older than 30 days)
      const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const oldNotifications = query(
        collection(db, 'notifications'),
        where('createdAt', '<=', thirtyDaysAgo),
        where('read', '==', true)
      );
      const notifSnapshot = await getDocs(oldNotifications);
      
      const batch = writeBatch(db);
      notifSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      
      console.log(`🧹 [AUTO] Cleaned ${notifSnapshot.size} old notifications`);
      
      // Archive completed bookings older than 90 days
      const ninetyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
      const oldBookings = query(
        collection(db, 'bookings'),
        where('status', '==', 'completed'),
        where('bookedAt', '<=', ninetyDaysAgo)
      );
      const bookingSnapshot = await getDocs(oldBookings);
      
      const archiveBatch = writeBatch(db);
      bookingSnapshot.docs.forEach(doc => archiveBatch.delete(doc.ref));
      await archiveBatch.commit();
      
      console.log(`🧹 [AUTO] Archived ${bookingSnapshot.size} old bookings`);
      
    } catch (error) {
      console.error('[AUTO] Cleanup error:', error);
    }
  }

  // ============ 9. AUTO PERFORMANCE REPORTS (Every hour) ============
  static autoPerformanceReports() {
    this.intervals.reports = setInterval(async () => {
      const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
      const currentHour = new Date().getHours();
      
      for (const templeId of temples) {
        try {
          // Get last hour's crowd data
          const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
          const historyQuery = query(
            collection(db, 'crowdHistory'),
            where('temple', '==', templeId),
            where('timestamp', '>=', oneHourAgo),
            orderBy('timestamp', 'desc')
          );
          const snapshot = await getDocs(historyQuery);
          const data = snapshot.docs.map(doc => doc.data());
          
          if (data.length > 0) {
            const avgCrowd = data.reduce((sum, d) => sum + (d.entranceLevel || 0), 0) / data.length;
            const maxCrowd = Math.max(...data.map(d => d.entranceLevel || 0));
            const minCrowd = Math.min(...data.map(d => d.entranceLevel || 0));
            
            // Save hourly report
            await addDoc(collection(db, 'hourlyReports'), {
              temple: templeId,
              hour: currentHour,
              averageCrowd: Math.round(avgCrowd),
              maxCrowd: maxCrowd,
              minCrowd: minCrowd,
              dataPoints: data.length,
              timestamp: Timestamp.now()
            });
            
            console.log(`📊 [AUTO] Hourly report generated for ${templeId} (Avg: ${Math.round(avgCrowd)}%)`);
          }
        } catch (error) {
          console.error(`[AUTO] Report error for ${templeId}:`, error);
        }
      }
    }, 60 * 60 * 1000); // Every hour
  }

  // ============ HELPER: Auto create alerts ============
  static async autoCreateAlert(templeId, crowdLevel, type) {
    try {
      const message = type === 'high' 
        ? `⚠️ Automated Alert: ${templeId} temple has ${crowdLevel}% crowd. Staff advised to prepare for rush.`
        : `✅ Automated Update: ${templeId} temple crowd reduced to ${crowdLevel}%. Normal operations.`;
      
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        title: type === 'high' ? '🔴 High Crowd Alert' : '🟢 Crowd Update',
        message: message,
        type: 'auto-alert',
        createdAt: Timestamp.now(),
        read: false
      });
    } catch (error) {
      console.error('Auto alert error:', error);
    }
  }

  // ============ STOP ALL AUTOMATION ============
  static stop() {
    console.log('🛑 Stopping all automation...');
    
    Object.values(this.intervals).forEach(interval => {
      if (typeof interval === 'function') {
        interval();
      } else {
        clearInterval(interval);
      }
    });
    
    this.isRunning = false;
    console.log('✅ All automation stopped');
  }

  // ============ GET AUTOMATION STATUS ============
  static getStatus() {
    return {
      isRunning: this.isRunning,
      activeModules: Object.keys(this.intervals).length,
      lastRun: new Date().toISOString()
    };
  }
}

export default CompleteAutomation;