import AIAutomationService from './aiAutomationService';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, onSnapshot, query, where, Timestamp, addDoc } from 'firebase/firestore';

class AutomationScheduler {
  static intervals = {};
  
  static startAutomation() {
    console.log('🤖 AI Automation Started...');
    this.startCrowdMonitoring();
    this.startWaitTimeOptimization();
    this.scheduleDailyReports();
    this.scheduleFestivalAlerts();
  }
  
  static startCrowdMonitoring() {
    const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
    
    temples.forEach(templeId => {
      const unsubscribe = onSnapshot(doc(db, 'crowdData', templeId), async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const crowdData = docSnapshot.data();
          const lastLevel = crowdData.lastEntranceLevel || 0;
          const currentLevel = crowdData.entranceLevel || 0;
          
          if (Math.abs(currentLevel - lastLevel) > 15) {
            await AIAutomationService.autoGenerateRoutingMessages(templeId, crowdData);
            await AIAutomationService.checkAndSendAlerts(templeId, crowdData);
            
            await updateDoc(doc(db, 'crowdData', templeId), {
              lastEntranceLevel: currentLevel
            });
          }
        }
      });
      
      this.intervals[`crowd_${templeId}`] = unsubscribe;
    });
  }
  
  static startWaitTimeOptimization() {
    this.intervals.waitTime = setInterval(async () => {
      const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
      
      for (const templeId of temples) {
        await AIAutomationService.autoAdjustWaitTimes(templeId);
      }
      console.log('⏰ Auto wait times updated');
    }, 5 * 60 * 1000);
  }
  
  static scheduleDailyReports() {
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 0
    );
    const msToMidnight = night.getTime() - now.getTime();
    
    setTimeout(() => {
      this.generateDailyReports();
      setInterval(() => this.generateDailyReports(), 24 * 60 * 60 * 1000);
    }, msToMidnight);
  }
  
  static async generateDailyReports() {
    const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
    for (const templeId of temples) {
      await AIAutomationService.generateDailyReport(templeId);
    }
  }
  
  static scheduleFestivalAlerts() {
    this.intervals.festival = setInterval(async () => {
      const festivals = this.getUpcomingFestivals();
      for (const festival of festivals) {
        if (festival.daysUntil <= 3 && festival.daysUntil > 0 && !festival.alerted) {
          await this.sendFestivalAlert(festival);
        }
      }
    }, 24 * 60 * 60 * 1000);
  }
  
  static getUpcomingFestivals() {
    const festivals = [
      { name: 'Maha Shivaratri', date: '2024-03-08', temple: 'somnath' },
      { name: 'Janmashtami', date: '2024-08-26', temple: 'dwarka' },
      { name: 'Navratri', date: '2024-10-03', temple: 'ambaji' }
    ];
    
    const today = new Date();
    return festivals.map(festival => {
      const festDate = new Date(festival.date);
      const daysUntil = Math.ceil((festDate - today) / (1000 * 60 * 60 * 24));
      return { ...festival, daysUntil, alerted: false };
    });
  }
  
  static async sendFestivalAlert(festival) {
    await addDoc(collection(db, 'notifications'), {
      userId: 'admin',
      title: `🎉 ${festival.name} approaching!`,
      message: `Prepare for increased crowd at ${festival.temple} temple in ${festival.daysUntil} days.`,
      type: 'festival_alert',
      createdAt: Timestamp.now(),
      read: false
    });
    console.log(`📅 Festival alert sent for ${festival.name}`);
  }
  
  static stopAutomation() {
    Object.values(this.intervals).forEach(interval => {
      if (typeof interval === 'function') {
        interval();
      } else {
        clearInterval(interval);
      }
    });
    console.log('🛑 AI Automation Stopped');
  }
}

export default AutomationScheduler;