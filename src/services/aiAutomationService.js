import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, Timestamp, writeBatch, orderBy, limit } from 'firebase/firestore';

class AIAutomationService {
  
  static async predictCrowdLevel(templeId, date, timeSlot) {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const historyRef = collection(db, 'crowdHistory');
      const q = query(
        historyRef,
        where('temple', '==', templeId),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => doc.data());
      
      if (history.length === 0) return { predictedLevel: 30, confidence: 50, recommendation: 'Normal crowd expected' };
      
      const relevantData = history.filter(h => {
        const hDate = h.timestamp?.toDate();
        return hDate && (isWeekend ? (hDate.getDay() === 0 || hDate.getDay() === 6) : (hDate.getDay() !== 0 && hDate.getDay() !== 6));
      });
      
      const avgCrowd = relevantData.reduce((sum, h) => sum + (h.entranceLevel || 0), 0) / (relevantData.length || 1);
      
      const hour = parseInt(timeSlot.split(':')[0]);
      let timeMultiplier = 1;
      if (hour >= 10 && hour <= 13) timeMultiplier = 1.4;
      if (hour >= 17 && hour <= 20) timeMultiplier = 1.3;
      if (hour >= 6 && hour <= 8) timeMultiplier = 0.8;
      
      let predicted = avgCrowd * timeMultiplier;
      predicted = Math.min(100, Math.max(0, predicted));
      
      return {
        predictedLevel: Math.round(predicted),
        confidence: Math.min(95, Math.round((history.length / 50) * 100)),
        recommendation: predicted > 70 ? 'High crowd expected' : predicted > 40 ? 'Moderate crowd' : 'Low crowd expected'
      };
    } catch (error) {
      console.error('Prediction error:', error);
      return { predictedLevel: 50, confidence: 50, recommendation: 'Normal crowd expected' };
    }
  }
  
  static async autoGenerateRoutingMessages(templeId, crowdData) {
    try {
      const messages = [];
      const { entranceLevel, templeAreaLevel, parkingLevel } = crowdData;
      
      if (entranceLevel > 75) {
        messages.push({
          temple: templeId,
          message: `🚨 EMERGENCY: Main entrance at ${entranceLevel}% capacity! Use East Gate for immediate entry.`,
          priorityGroup: 'all',
          createdAt: Timestamp.now(),
          isActive: true,
          type: 'auto-generated',
          severity: 'high'
        });
      } else if (entranceLevel > 60) {
        messages.push({
          temple: templeId,
          message: `⚠️ Main entrance crowded (${entranceLevel}%). Alternative: Use North Gate for faster entry.`,
          priorityGroup: 'all',
          createdAt: Timestamp.now(),
          isActive: true,
          type: 'auto-generated',
          severity: 'medium'
        });
      }
      
      if (templeAreaLevel > 80) {
        messages.push({
          temple: templeId,
          message: `🛕 Temple area heavily crowded! Expected wait time: 60+ minutes.`,
          priorityGroup: 'all',
          createdAt: Timestamp.now(),
          isActive: true,
          type: 'auto-generated',
          severity: 'high'
        });
      }
      
      if (parkingLevel > 85) {
        messages.push({
          temple: templeId,
          message: `🅿️ PARKING FULL! Use overflow parking at Location B (500m ahead).`,
          priorityGroup: 'all',
          createdAt: Timestamp.now(),
          isActive: true,
          type: 'auto-generated',
          severity: 'high'
        });
      }
      
      if (entranceLevel < 30 && templeAreaLevel < 40) {
        messages.push({
          temple: templeId,
          message: `🌟 GREAT NEWS! Current crowd is LOW. Best time for peaceful darshan!`,
          priorityGroup: 'all',
          createdAt: Timestamp.now(),
          isActive: true,
          type: 'auto-generated',
          severity: 'low'
        });
      }
      
      for (const message of messages) {
        await addDoc(collection(db, 'routingMessages'), message);
      }
      
      return messages.length;
    } catch (error) {
      console.error('Auto message generation error:', error);
      return 0;
    }
  }
  
  static async autoAdjustWaitTimes(templeId) {
    try {
      const crowdRef = doc(db, 'crowdData', templeId);
      const crowdDoc = await getDoc(crowdRef);
      const crowdData = crowdDoc.data();
      
      const crowdLevel = crowdData?.entranceLevel || 50;
      let waitTime = 30;
      
      if (crowdLevel > 80) waitTime = 90;
      else if (crowdLevel > 60) waitTime = 60;
      else if (crowdLevel > 40) waitTime = 45;
      else if (crowdLevel > 20) waitTime = 30;
      else waitTime = 15;
      
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('temple', '==', templeId),
        where('status', '==', 'upcoming'),
        where('date', '==', new Date().toISOString().split('T')[0])
      );
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          estimatedWaitTime: waitTime,
          waitTimeUpdatedAt: Timestamp.now()
        });
      });
      await batch.commit();
      
      return { waitTime, bookingsUpdated: snapshot.size };
    } catch (error) {
      console.error('Auto wait time adjustment error:', error);
      return null;
    }
  }
  
  static async checkAndSendAlerts(templeId, crowdData) {
    try {
      const alerts = [];
      const { entranceLevel, templeAreaLevel } = crowdData;
      
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('temple', '==', templeId),
        where('status', '==', 'upcoming'),
        where('date', '==', new Date().toISOString().split('T')[0])
      );
      const snapshot = await getDocs(q);
      const userIds = [...new Set(snapshot.docs.map(doc => doc.data().userId))];
      
      if (entranceLevel > 80) {
        for (const userId of userIds) {
          await addDoc(collection(db, 'notifications'), {
            userId: userId,
            title: '🔴 High Crowd Alert',
            message: `Temple is extremely crowded (${entranceLevel}%). Expected wait: 60-90 minutes.`,
            temple: templeId,
            createdAt: Timestamp.now(),
            read: false,
            type: 'crowd_alert'
          });
        }
        alerts.push({ type: 'high_crowd', recipients: userIds.length });
      } else if (entranceLevel < 30 && templeAreaLevel < 40) {
        for (const userId of userIds) {
          await addDoc(collection(db, 'notifications'), {
            userId: userId,
            title: '🟢 Low Crowd Alert',
            message: `Great time for darshan! Current crowd is low. Expected wait: 15-20 minutes.`,
            temple: templeId,
            createdAt: Timestamp.now(),
            read: false,
            type: 'crowd_alert'
          });
        }
        alerts.push({ type: 'low_crowd', recipients: userIds.length });
      }
      
      return alerts;
    } catch (error) {
      console.error('Alert sending error:', error);
      return [];
    }
  }
  
  static async generateDailyReport(templeId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const crowdHistoryRef = collection(db, 'crowdHistory');
      const startOfDay = new Date(today);
      const endOfDay = new Date(today);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      const q = query(
        crowdHistoryRef,
        where('temple', '==', templeId),
        where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
        where('timestamp', '<', Timestamp.fromDate(endOfDay)),
        orderBy('timestamp', 'asc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data());
      
      if (data.length === 0) return null;
      
      const avgEntrance = data.reduce((sum, d) => sum + (d.entranceLevel || 0), 0) / data.length;
      
      const report = {
        templeId,
        date: today,
        averageCrowd: Math.round(avgEntrance),
        totalDataPoints: data.length,
        generatedAt: Timestamp.now()
      };
      
      await addDoc(collection(db, 'dailyReports'), report);
      return report;
    } catch (error) {
      console.error('Report generation error:', error);
      return null;
    }
  }
}

export default AIAutomationService;