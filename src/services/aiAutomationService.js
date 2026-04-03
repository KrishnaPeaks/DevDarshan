import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, Timestamp, writeBatch, orderBy, limit } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'dummy-key');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

class AIAutomationService {
  
  // Get active festival (based on real Ambaji Temple data)
  static getActiveFestival() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const festivals = {
      'bhadarviPoonam': { name: 'Bhadarvi Poonam Mahamela', startDate: '2025-09-12', endDate: '2025-09-18', multiplier: 8.5, crowdForecast: 92 },
      'navratri': { name: 'Navratri', startDate: '2025-09-22', endDate: '2025-10-01', multiplier: 3.5, crowdForecast: 85 },
      'diwali': { name: 'Diwali', startDate: '2025-10-20', endDate: '2025-10-20', multiplier: 2.8, crowdForecast: 80 },
      'mahaShivaratri': { name: 'Maha Shivaratri', startDate: '2025-02-26', endDate: '2025-02-26', multiplier: 2.5, crowdForecast: 78 },
      'janmashtami': { name: 'Janmashtami', startDate: '2025-08-16', endDate: '2025-08-16', multiplier: 2.2, crowdForecast: 75 }
    };
    
    for (const [key, festival] of Object.entries(festivals)) {
      if (todayStr >= festival.startDate && todayStr <= (festival.endDate || festival.startDate)) {
        return festival;
      }
    }
    return null;
  }

  // Get dynamic recommendations based on current crowd
  static getDynamicRecommendations(currentCrowd, predictedCrowd, currentHour, activeFestival) {
    const recommendations = [];
    
    // Immediate action recommendation
    if (currentCrowd <= 25) {
      recommendations.push({
        type: "immediate",
        icon: "✅",
        text: `GO NOW! Current crowd is very low (${currentCrowd}%). Perfect time for peaceful darshan.`,
        waitTime: "10-15 minutes",
        priority: "high",
        action: "go_now"
      });
    } else if (currentCrowd <= 45) {
      recommendations.push({
        type: "immediate",
        icon: "🟡",
        text: `Go now - ${currentCrowd}% crowd is manageable. Expected wait: 30-40 minutes.`,
        waitTime: "30-40 minutes",
        priority: "medium",
        action: "go_now"
      });
    } else if (currentCrowd <= 65) {
      recommendations.push({
        type: "immediate",
        icon: "🟠",
        text: `High crowd (${currentCrowd}%). Consider waiting for crowd to decrease.`,
        waitTime: "60-75 minutes",
        priority: "low",
        action: "wait"
      });
    } else {
      recommendations.push({
        type: "immediate",
        icon: "🔴",
        text: `Very high crowd (${currentCrowd}%). Avoid now. Visit after 2 hours or use special entry.`,
        waitTime: "90-120 minutes",
        priority: "very_low",
        action: "avoid"
      });
    }
    
    // Wait for better time based on AI prediction
    if (predictedCrowd && predictedCrowd < currentCrowd) {
      const crowdDrop = currentCrowd - predictedCrowd;
      const waitMinutes = Math.max(15, Math.min(120, Math.floor(crowdDrop * 1.5)));
      recommendations.push({
        type: "wait",
        icon: "⏰",
        text: `Wait ${waitMinutes} minutes - Crowd will drop to ${predictedCrowd}% (${crowdDrop}% decrease)`,
        waitTime: `${waitMinutes} minutes`,
        priority: "high",
        action: "wait"
      });
    }
    
    // Best time of day recommendations
    if (currentHour >= 22 || currentHour <= 5) {
      recommendations.push({
        type: "best",
        icon: "🌙",
        text: `Late night darshan (after 10 PM) - Lowest crowd (5-10%). Best for peaceful experience.`,
        waitTime: "5-10 minutes",
        priority: "high",
        action: "plan"
      });
    } else if (currentHour >= 6 && currentHour <= 8) {
      recommendations.push({
        type: "best",
        icon: "🌅",
        text: `Early morning (6-8 AM) - Low crowd (15-25%). Second best time for darshan.`,
        waitTime: "15-20 minutes",
        priority: "high",
        action: "plan"
      });
    } else if (currentHour >= 18 && currentHour <= 20) {
      recommendations.push({
        type: "best",
        icon: "🌆",
        text: `Evening Aarti time (6-8 PM) - High crowd but divine spiritual experience.`,
        waitTime: "60-90 minutes",
        priority: "medium",
        action: "plan"
      });
    }
    
    // Festival special recommendation
    if (activeFestival) {
      recommendations.unshift({
        type: "festival",
        icon: "🎉",
        text: `${activeFestival.name}! ${activeFestival.multiplier}x crowd expected. Book special entry tickets online.`,
        waitTime: "90-120 minutes",
        priority: "info",
        action: "plan"
      });
    }
    
    return recommendations;
  }

  // Enhanced prediction with Gemini AI
  static async predictCrowdLevel(templeId, date, timeSlot) {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const currentHour = new Date().getHours();
      const activeFestival = this.getActiveFestival();
      
      // Get historical data
      const historyRef = collection(db, 'crowdHistory');
      const q = query(
        historyRef,
        where('temple', '==', templeId),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => doc.data());
      
      let basePrediction = 50;
      let confidence = 70;
      
      if (history.length > 0) {
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
        if (hour >= 22 || hour <= 5) timeMultiplier = 0.3;
        
        basePrediction = avgCrowd * timeMultiplier;
        confidence = Math.min(95, Math.round((history.length / 50) * 100));
      }
      
      // Apply festival multiplier
      if (activeFestival) {
        basePrediction = activeFestival.crowdForecast;
        confidence = 90;
      }
      
      // Get Gemini AI prediction
      let aiPrediction = null;
      if (import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== 'dummy-key') {
        try {
          const prompt = `As an AI crowd prediction expert for Ambaji Temple (One of the 51 Shakti Peethas), analyze:
          
Current time: ${currentHour}:00
Day: ${isWeekend ? 'Weekend' : 'Weekday'}
${activeFestival ? `Active Festival: ${activeFestival.name} (${activeFestival.multiplier}x crowd expected)` : 'No active festival'}
Historical prediction: ${Math.round(basePrediction)}% crowd

Return ONLY a JSON object:
{
  "predictedCrowd": number (0-100),
  "recommendation": "string (short advice for devotees)",
  "waitTime": number (minutes),
  "confidence": number (0-100)
}`;

          const result = await model.generateContent(prompt);
          const response = result.response.text();
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiPrediction = JSON.parse(jsonMatch[0]);
          }
        } catch (aiError) {
          console.log('Gemini AI fallback, using historical data');
        }
      }
      
      const finalPrediction = aiPrediction || {
        predictedCrowd: Math.min(100, Math.max(0, Math.round(basePrediction))),
        recommendation: basePrediction > 70 ? '🔴 Very crowded. Consider visiting later.' : 
                        basePrediction > 40 ? '🟡 Moderate crowd. Good time for darshan.' : 
                        '🟢 Low crowd. Best time for peaceful darshan!',
        waitTime: this.calculateWaitTime(basePrediction),
        confidence: confidence
      };
      
      // Get dynamic recommendations
      const recommendations = this.getDynamicRecommendations(
        await this.getCurrentCrowd(templeId),
        finalPrediction.predictedCrowd,
        currentHour,
        activeFestival
      );
      
      // Save prediction
      await addDoc(collection(db, 'aiPredictions'), {
        temple: templeId,
        date: date,
        timeSlot: timeSlot,
        predictedCrowd: finalPrediction.predictedCrowd,
        recommendation: finalPrediction.recommendation,
        waitTime: finalPrediction.waitTime,
        recommendations: recommendations,
        festival: activeFestival?.name || null,
        confidence: finalPrediction.confidence,
        timestamp: Timestamp.now(),
        source: aiPrediction ? 'gemini-ai' : 'historical'
      });
      
      return {
        ...finalPrediction,
        recommendations: recommendations,
        festivalImpact: activeFestival?.name || null
      };
      
    } catch (error) {
      console.error('Prediction error:', error);
      return this.getFallbackPrediction();
    }
  }
  
  static async getCurrentCrowd(templeId) {
    try {
      const crowdRef = doc(db, 'crowdData', templeId);
      const crowdDoc = await getDoc(crowdRef);
      if (crowdDoc.exists()) {
        return crowdDoc.data().entranceLevel || 50;
      }
      return 50;
    } catch {
      return 50;
    }
  }
  
  static calculateWaitTime(crowdLevel) {
    if (crowdLevel > 80) return 90;
    if (crowdLevel > 65) return 75;
    if (crowdLevel > 50) return 60;
    if (crowdLevel > 35) return 45;
    if (crowdLevel > 20) return 30;
    return 15;
  }
  
  static getFallbackPrediction() {
    return {
      predictedCrowd: 50,
      recommendation: "Normal crowd expected. Plan your visit accordingly.",
      waitTime: 30,
      confidence: 70,
      recommendations: [
        { type: "default", icon: "🕉️", text: "Visit early morning (6-8 AM) for best experience", waitTime: "15-20 min", action: "plan" }
      ],
      festivalImpact: null
    };
  }
  
  static async autoGenerateRoutingMessages(templeId, crowdData) {
    try {
      const messages = [];
      const { entranceLevel, templeAreaLevel, parkingLevel } = crowdData;
      const activeFestival = this.getActiveFestival();
      const currentHour = new Date().getHours();
      
      // Festival messages first
      if (activeFestival) {
        messages.push({
          temple: templeId,
          message: `🎉 ${activeFestival.name}! ${activeFestival.multiplier}x crowd expected. Book special entry tickets online.`,
          priorityGroup: 'all',
          createdAt: Timestamp.now(),
          isActive: true,
          type: 'auto-generated',
          severity: 'high',
          festival: activeFestival.name
        });
      }
      
      // Night time messages
      if (currentHour >= 22 || currentHour <= 5) {
        messages.push({
          temple: templeId,
          message: `🌙 Late night darshan available! Lowest crowd (${entranceLevel}%). Best time for peaceful darshan.`,
          priorityGroup: 'all',
          createdAt: Timestamp.now(),
          isActive: true,
          type: 'auto-generated',
          severity: 'low'
        });
      }
      
      // Crowd-based messages
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
      } else if (entranceLevel < 30) {
        messages.push({
          temple: templeId,
          message: `🌟 GREAT NEWS! Current crowd is LOW (${entranceLevel}%). Best time for peaceful darshan!`,
          priorityGroup: 'all',
          createdAt: Timestamp.now(),
          isActive: true,
          type: 'auto-generated',
          severity: 'low'
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
      let waitTime = this.calculateWaitTime(crowdLevel);
      
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
      const activeFestival = this.getActiveFestival();
      
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('temple', '==', templeId),
        where('status', '==', 'upcoming'),
        where('date', '==', new Date().toISOString().split('T')[0])
      );
      const snapshot = await getDocs(q);
      const userIds = [...new Set(snapshot.docs.map(doc => doc.data().userId))];
      
      // Festival alert
      if (activeFestival && userIds.length > 0) {
        for (const userId of userIds) {
          await addDoc(collection(db, 'notifications'), {
            userId: userId,
            title: `🎉 ${activeFestival.name} Special`,
            message: `${activeFestival.name} celebrations! ${activeFestival.multiplier}x crowd expected. Plan accordingly.`,
            temple: templeId,
            createdAt: Timestamp.now(),
            read: false,
            type: 'festival_alert'
          });
        }
        alerts.push({ type: 'festival_alert', recipients: userIds.length });
      }
      
      // Crowd alerts
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
            message: `Great time for darshan! Current crowd is low (${entranceLevel}%). Expected wait: 15-20 minutes.`,
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
      const peakCrowd = Math.max(...data.map(d => d.entranceLevel || 0));
      const lowCrowd = Math.min(...data.map(d => d.entranceLevel || 0));
      const activeFestival = this.getActiveFestival();
      
      const report = {
        templeId,
        date: today,
        averageCrowd: Math.round(avgEntrance),
        peakCrowd: peakCrowd,
        lowCrowd: lowCrowd,
        festival: activeFestival?.name || null,
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