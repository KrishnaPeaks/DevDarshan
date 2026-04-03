import { db } from './firebase';
import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';

class AutomatedCrowdSimulator {
  static intervals = {};
  static isRunning = false;

  // Start realistic crowd simulation
  static start() {
    if (this.isRunning) return;
    
    console.log('🎯 REALISTIC CROWD SIMULATION STARTED');
    
    const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
    
    temples.forEach(templeId => {
      this.simulateTempleCrowd(templeId);
    });
    
    this.isRunning = true;
  }

  static simulateTempleCrowd(templeId) {
    // Update crowd every 2 minutes with realistic patterns
    this.intervals[templeId] = setInterval(async () => {
      try {
        const currentCrowd = await this.getCurrentCrowd(templeId);
        const newCrowd = this.calculateRealisticCrowd(templeId, currentCrowd);
        
        // Auto-update without admin intervention
        await updateDoc(doc(db, 'crowdData', templeId), {
          entranceLevel: newCrowd,
          templeAreaLevel: this.calculateTempleAreaCrowd(newCrowd),
          parkingLevel: this.calculateParkingCrowd(newCrowd),
          lastAutomatedUpdate: Timestamp.now(),
          updatedBy: 'automation-system',
          crowdTrend: this.getCrowdTrend(currentCrowd, newCrowd)
        });
        
        console.log(`🔄 AUTO: ${templeId} crowd updated to ${newCrowd}% (automated)`);
        
        // Auto-generate routing message if needed
        await this.autoGenerateMessage(templeId, newCrowd);
        
      } catch (error) {
        console.error(`Auto crowd error for ${templeId}:`, error);
      }
    }, 120000); // Every 2 minutes
  }

  static calculateRealisticCrowd(templeId, currentCrowd) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Base crowd by time of day (realistic patterns)
    let baseCrowd = 30; // Default
    
    if (hour >= 6 && hour <= 8) baseCrowd = 25; // Early morning - low
    else if (hour >= 9 && hour <= 11) baseCrowd = 65; // Morning peak
    else if (hour >= 12 && hour <= 14) baseCrowd = 45; // Lunch time - moderate
    else if (hour >= 15 && hour <= 17) baseCrowd = 55; // Afternoon
    else if (hour >= 18 && hour <= 20) baseCrowd = 75; // Evening peak
    else if (hour >= 21) baseCrowd = 20; // Night - low
    
    // Weekend boost
    if (day === 0 || day === 6) {
      baseCrowd = Math.min(95, baseCrowd + 25);
    }
    
    // Add random fluctuation (-15% to +15%)
    const fluctuation = Math.floor(Math.random() * 30) - 15;
    let newCrowd = baseCrowd + fluctuation;
    
    // Ensure within bounds
    newCrowd = Math.min(98, Math.max(2, newCrowd));
    
    // Smooth transition (don't jump too much)
    if (Math.abs(newCrowd - currentCrowd) > 20) {
      newCrowd = currentCrowd + (newCrowd > currentCrowd ? 15 : -15);
    }
    
    return Math.round(newCrowd);
  }

  static calculateTempleAreaCrowd(entranceCrowd) {
    // Temple area is usually slightly less than entrance
    let areaCrowd = entranceCrowd * 0.85;
    areaCrowd = Math.min(95, Math.max(5, areaCrowd));
    return Math.round(areaCrowd);
  }

  static calculateParkingCrowd(entranceCrowd) {
    // Parking correlates with entrance crowd
    let parkingCrowd = entranceCrowd * 0.9;
    parkingCrowd = Math.min(98, Math.max(5, parkingCrowd));
    return Math.round(parkingCrowd);
  }

  static getCrowdTrend(oldCrowd, newCrowd) {
    if (newCrowd > oldCrowd + 5) return 'increasing';
    if (newCrowd < oldCrowd - 5) return 'decreasing';
    return 'stable';
  }

  static async getCurrentCrowd(templeId) {
    try {
      const docRef = doc(db, 'crowdData', templeId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().entranceLevel || 30;
      }
      return 30;
    } catch {
      return 30;
    }
  }

  static async autoGenerateMessage(templeId, crowdLevel) {
    try {
      let message = null;
      
      if (crowdLevel > 75) {
        message = `🚨 AUTO-ALERT: ${templeId} temple is heavily crowded (${crowdLevel}%). Use East Gate for faster entry.`;
      } else if (crowdLevel > 60) {
        message = `⚠️ ${templeId} temple: Moderate crowd (${crowdLevel}%). Expected wait: 30-40 minutes.`;
      } else if (crowdLevel < 30) {
        message = `🌟 ${templeId} temple: Low crowd (${crowdLevel}%). Best time for peaceful darshan!`;
      }
      
      if (message) {
        const messagesRef = collection(db, 'routingMessages');
        await addDoc(messagesRef, {
          temple: templeId,
          message: message,
          priorityGroup: 'all',
          createdAt: Timestamp.now(),
          isActive: true,
          type: 'auto-generated',
          source: 'crowd-simulator'
        });
        console.log(`📢 AUTO-MESSAGE generated for ${templeId}`);
      }
    } catch (error) {
      console.error('Auto message error:', error);
    }
  }

  static stop() {
    Object.values(this.intervals).forEach(interval => clearInterval(interval));
    this.isRunning = false;
    console.log('🛑 Crowd simulation stopped');
  }
}

export default AutomatedCrowdSimulator;