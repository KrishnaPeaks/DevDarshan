import GeminiAIService from './geminiAIService';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, addDoc, Timestamp, onSnapshot, query, where } from 'firebase/firestore';

class RealTimeAIAutomation {
  static intervals = {};
  
  // Start all real-time AI services
  static async start() {
    console.log('🤖 Real-Time AI Automation Started with Gemini');
    
    // 1. Monitor crowd changes in real-time
    this.monitorCrowdRealTime();
    
    // 2. Auto-update predictions every 2 minutes
    this.startPredictionEngine();
    
    // 3. Smart routing every 5 minutes
    this.startSmartRouting();
    
    // 4. Real-time alert system
    this.startAlertSystem();
    
    // 5. Slot optimization every hour
    this.startSlotOptimization();
  }
  
  // Real-time crowd monitoring using Firestore listeners
  static monitorCrowdRealTime() {
    const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
    
    temples.forEach(templeId => {
      const unsubscribe = onSnapshot(doc(db, 'crowdData', templeId), async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const crowdData = docSnapshot.data();
          
          // Get previous crowd level
          const previousLevel = crowdData.previousEntranceLevel || 0;
          const currentLevel = crowdData.entranceLevel || 0;
          const change = Math.abs(currentLevel - previousLevel);
          
          // Significant change detected (>15%)
          if (change > 15) {
            console.log(`🔄 Significant crowd change at ${templeId}: ${previousLevel}% → ${currentLevel}%`);
            
            // Get AI recommendation
            const aiRecommendation = await GeminiAIService.getRealTimePrediction(
              templeId, 
              new Date().toISOString().split('T')[0],
              new Date().getHours() + ':00',
              currentLevel
            );
            
            // Auto-generate routing message
            const message = await GeminiAIService.generateSmartRoutingMessage(templeId, crowdData);
            
            // Add to routing messages
            await addDoc(collection(db, 'routingMessages'), {
              temple: templeId,
              message: message,
              priorityGroup: 'all',
              createdAt: Timestamp.now(),
              isActive: true,
              type: 'ai-generated',
              aiConfidence: aiRecommendation.alertLevel,
              crowdChange: change
            });
            
            // Update previous level
            await updateDoc(doc(db, 'crowdData', templeId), {
              previousEntranceLevel: currentLevel,
              lastAIAnalysis: Timestamp.now()
            });
          }
        }
      });
      
      this.intervals[`monitor_${templeId}`] = unsubscribe;
    });
  }
  
  // AI Prediction Engine (runs every 2 minutes)
  static startPredictionEngine() {
    this.intervals.predictions = setInterval(async () => {
      const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
      const now = new Date();
      const currentHour = now.getHours();
      
      for (const templeId of temples) {
        // Get current crowd data
        const crowdRef = doc(db, 'crowdData', templeId);
        const crowdDoc = await getDoc(crowdRef);
        const crowdData = crowdDoc.data();
        
        if (crowdData) {
          // Get AI prediction for next hour
          const prediction = await GeminiAIService.getRealTimePrediction(
            templeId,
            now.toISOString().split('T')[0],
            `${currentHour + 1}:00`,
            crowdData.entranceLevel || 50
          );
          
          // Save prediction
          await addDoc(collection(db, 'predictions'), {
            temple: templeId,
            predictedCrowd: prediction.predictedCrowd,
            recommendation: prediction.recommendation,
            waitTime: prediction.waitTime,
            alertLevel: prediction.alertLevel,
            timestamp: Timestamp.now(),
            validFor: '1 hour',
            generatedBy: 'gemini-ai'
          });
          
          console.log(`📊 AI Prediction for ${templeId}: ${prediction.predictedCrowd}% crowd expected`);
        }
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  }
  
  // Smart Routing (every 5 minutes)
  static startSmartRouting() {
    this.intervals.routing = setInterval(async () => {
      const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
      
      for (const templeId of temples) {
        const crowdRef = doc(db, 'crowdData', templeId);
        const crowdDoc = await getDoc(crowdRef);
        const crowdData = crowdDoc.data();
        
        if (crowdData) {
          // Generate AI routing message
          const aiMessage = await GeminiAIService.generateSmartRoutingMessage(templeId, crowdData);
          
          // Only add if crowd is significant
          if (crowdData.entranceLevel > 50 || crowdData.templeAreaLevel > 60) {
            await addDoc(collection(db, 'routingMessages'), {
              temple: templeId,
              message: aiMessage,
              priorityGroup: 'all',
              createdAt: Timestamp.now(),
              isActive: true,
              type: 'ai-routing',
              triggeredBy: 'auto-scheduler'
            });
          }
        }
      }
      
      console.log('🔄 AI Smart routing messages updated');
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  
  // Real-time Alert System (every 3 minutes)
  static startAlertSystem() {
    this.intervals.alerts = setInterval(async () => {
      const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
      
      for (const templeId of temples) {
        const crowdRef = doc(db, 'crowdData', templeId);
        const crowdDoc = await getDoc(crowdRef);
        const crowdData = crowdDoc.data();
        
        if (crowdData && crowdData.entranceLevel > 60) {
          // Get users with upcoming bookings
          const today = new Date().toISOString().split('T')[0];
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('temple', '==', templeId),
            where('date', '==', today),
            where('status', '==', 'upcoming')
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);
          
          const userIds = [...new Set(bookingsSnapshot.docs.map(doc => doc.data().userId))];
          
          if (userIds.length > 0) {
            // Generate AI alert message
            const alertMessage = await GeminiAIService.generateSmartAlert(templeId, crowdData, userIds.length);
            
            // Send to all users
            for (const userId of userIds) {
              await addDoc(collection(db, 'notifications'), {
                userId: userId,
                title: crowdData.entranceLevel > 70 ? '🔴 Crowd Alert' : '🟡 Crowd Update',
                message: alertMessage,
                temple: templeId,
                createdAt: Timestamp.now(),
                read: false,
                type: 'ai-crowd-alert',
                crowdLevel: crowdData.entranceLevel
              });
            }
            
            if (userIds.length > 0) {
              console.log(`📱 AI Alerts sent to ${userIds.length} users for ${templeId}`);
            }
          }
        }
      }
    }, 3 * 60 * 1000); // Every 3 minutes
  }
  
  // Slot Optimization (every hour)
  static startSlotOptimization() {
    this.intervals.slots = setInterval(async () => {
      const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
      const today = new Date().toISOString().split('T')[0];
      
      for (const templeId of temples) {
        // Get all bookings for today
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('temple', '==', templeId),
          where('date', '==', today)
        );
        const snapshot = await getDocs(bookingsQuery);
        
        // Analyze slot distribution
        const slotDistribution = {};
        snapshot.docs.forEach(doc => {
          const slot = doc.data().timeSlot;
          slotDistribution[slot] = (slotDistribution[slot] || 0) + 1;
        });
        
        // Get AI optimization
        const optimization = await GeminiAIService.optimizeTimeSlots(templeId, today, slotDistribution);
        
        // Save optimization results
        await addDoc(collection(db, 'slotOptimizations'), {
          temple: templeId,
          date: today,
          bestSlots: optimization.bestSlots,
          reason: optimization.reason,
          timestamp: Timestamp.now(),
          generatedBy: 'gemini-ai'
        });
        
        console.log(`⏰ AI Slot optimization for ${templeId}: ${optimization.bestSlots.join(', ')}`);
      }
    }, 60 * 60 * 1000); // Every hour
  }
  
  // Stop all automation
  static stop() {
    Object.values(this.intervals).forEach(interval => {
      if (typeof interval === 'function') {
        interval();
      } else {
        clearInterval(interval);
      }
    });
    console.log('🛑 Real-Time AI Automation Stopped');
  }
}

export default RealTimeAIAutomation;