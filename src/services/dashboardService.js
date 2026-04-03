import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, orderBy, limit } from 'firebase/firestore';

class DashboardService {
  
  // Get complete dashboard data with AI insights
  static async getCompleteDashboardData(templeId) {
    try {
      const currentCrowd = await this.getCurrentCrowd(templeId);
      const historicalTrend = await this.getHistoricalTrend(templeId);
      const aiPrediction = await this.getAIPrediction(templeId);
      const bookingInsights = await this.getBookingInsights(templeId);
      const festivalImpact = await this.getFestivalImpact();
      const timeBasedInsight = this.getTimeBasedInsight();
      
      // Generate smart recommendations
      const recommendations = this.generateSmartRecommendations(
        currentCrowd, 
        historicalTrend, 
        aiPrediction, 
        bookingInsights,
        festivalImpact,
        timeBasedInsight
      );
      
      return {
        currentCrowd,
        historicalTrend,
        aiPrediction,
        bookingInsights,
        festivalImpact,
        timeBasedInsight,
        recommendations,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Dashboard data error:', error);
      return null;
    }
  }
  
  static async getCurrentCrowd(templeId) {
    const crowdRef = doc(db, 'crowdData', templeId);
    const crowdDoc = await getDoc(crowdRef);
    return crowdDoc.exists() ? crowdDoc.data() : { entranceLevel: 50, templeAreaLevel: 45, parkingLevel: 40 };
  }
  
  static async getHistoricalTrend(templeId) {
    const historyRef = collection(db, 'crowdHistory');
    const q = query(historyRef, where('temple', '==', templeId), orderBy('timestamp', 'desc'), limit(24));
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => doc.data());
    
    if (history.length === 0) return { trend: 'stable', average: 50, peak: 70, offPeak: 30 };
    
    const avg = history.reduce((sum, h) => sum + (h.entranceLevel || 0), 0) / history.length;
    const peak = Math.max(...history.map(h => h.entranceLevel || 0));
    const offPeak = Math.min(...history.map(h => h.entranceLevel || 0));
    
    // Determine trend
    const recent = history.slice(0, 6);
    const older = history.slice(6, 12);
    const recentAvg = recent.reduce((sum, h) => sum + (h.entranceLevel || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, h) => sum + (h.entranceLevel || 0), 0) / older.length;
    
    let trend = 'stable';
    if (recentAvg > olderAvg + 5) trend = 'increasing';
    if (recentAvg < olderAvg - 5) trend = 'decreasing';
    
    return { trend, average: Math.round(avg), peak: Math.round(peak), offPeak: Math.round(offPeak) };
  }
  
  static async getAIPrediction(templeId) {
    const predictionsRef = collection(db, 'aiPredictions');
    const q = query(predictionsRef, where('temple', '==', templeId), orderBy('timestamp', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { predictedCrowd: 50, recommendation: 'Normal crowd expected', waitTime: 30, confidence: 70 };
    }
    
    return snapshot.docs[0].data();
  }
  
  static async getBookingInsights(templeId) {
    const today = new Date().toISOString().split('T')[0];
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('temple', '==', templeId), where('date', '==', today));
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(doc => doc.data());
    
    // Analyze slot distribution
    const slotDistribution = {};
    bookings.forEach(b => {
      slotDistribution[b.timeSlot] = (slotDistribution[b.timeSlot] || 0) + 1;
    });
    
    // Find most and least booked slots
    let mostBooked = null;
    let leastBooked = null;
    let maxCount = 0;
    let minCount = Infinity;
    
    for (const [slot, count] of Object.entries(slotDistribution)) {
      if (count > maxCount) { maxCount = count; mostBooked = slot; }
      if (count < minCount) { minCount = count; leastBooked = slot; }
    }
    
    return {
      totalBookings: bookings.length,
      mostBookedSlot: mostBooked,
      leastBookedSlot: leastBooked,
      peakBookingHour: mostBooked ? parseInt(mostBooked.split(':')[0]) : null,
      slotDistribution
    };
  }
  
  static async getFestivalImpact() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const festivals = {
      'Bhadarvi Poonam Mahamela': { start: '2025-09-12', end: '2025-09-18', multiplier: 8.5 },
      'Navratri': { start: '2025-09-22', end: '2025-10-01', multiplier: 3.5 },
      'Diwali': { start: '2025-10-20', end: '2025-10-20', multiplier: 2.8 },
      'Maha Shivaratri': { start: '2025-02-26', end: '2025-02-26', multiplier: 2.5 }
    };
    
    for (const [name, data] of Object.entries(festivals)) {
      if (todayStr >= data.start && todayStr <= data.end) {
        return { active: true, name, multiplier: data.multiplier, message: `🎉 ${name} celebrations! ${data.multiplier}x crowd expected` };
      }
    }
    
    return { active: false, message: null };
  }
  
  static getTimeBasedInsight() {
    const hour = new Date().getHours();
    
    if (hour >= 22 || hour <= 5) {
      return { period: 'Late Night', crowdExpectation: 'Very Low (5-10%)', recommendation: 'Best time for peaceful darshan', icon: '🌙' };
    } else if (hour >= 6 && hour <= 8) {
      return { period: 'Early Morning', crowdExpectation: 'Low (15-25%)', recommendation: 'Second best time for darshan', icon: '🌅' };
    } else if (hour >= 9 && hour <= 11) {
      return { period: 'Morning Peak', crowdExpectation: 'High (60-75%)', recommendation: 'Expect crowds, book special entry', icon: '☀️' };
    } else if (hour >= 12 && hour <= 14) {
      return { period: 'Lunch Time', crowdExpectation: 'Moderate (40-55%)', recommendation: 'Good time, shorter queues', icon: '🍽️' };
    } else if (hour >= 15 && hour <= 17) {
      return { period: 'Afternoon', crowdExpectation: 'Moderate-High (50-65%)', recommendation: 'Moderate crowd expected', icon: '📊' };
    } else if (hour >= 18 && hour <= 20) {
      return { period: 'Evening Aarti', crowdExpectation: 'Very High (70-85%)', recommendation: 'Peak hour, divine experience', icon: '🌆' };
    } else {
      return { period: 'Late Evening', crowdExpectation: 'Low (20-30%)', recommendation: 'Good time for darshan', icon: '🌃' };
    }
  }
  
  static generateSmartRecommendations(currentCrowd, historicalTrend, aiPrediction, bookingInsights, festivalImpact, timeInsight) {
    const recommendations = [];
    
    // 1. Immediate action based on current crowd
    const currentLevel = currentCrowd.entranceLevel;
    if (currentLevel <= 25) {
      recommendations.push({ priority: 1, type: 'immediate', text: `✅ GO NOW! Current crowd is very low (${currentLevel}%)`, action: 'Go Now', waitTime: '10-15 min' });
    } else if (currentLevel <= 50) {
      recommendations.push({ priority: 2, type: 'immediate', text: `🟡 Manageable crowd (${currentLevel}%). Good time to go`, action: 'Go Now', waitTime: '30-40 min' });
    } else if (currentLevel <= 70) {
      recommendations.push({ priority: 3, type: 'wait', text: `🟠 High crowd (${currentLevel}%). Consider waiting`, action: 'Wait', waitTime: '45-60 min' });
    } else {
      recommendations.push({ priority: 4, type: 'avoid', text: `🔴 Very high crowd (${currentLevel}%). Avoid now`, action: 'Visit Later', waitTime: '90+ min' });
    }
    
    // 2. Based on AI prediction
    if (aiPrediction.predictedCrowd && aiPrediction.predictedCrowd < currentLevel) {
      const drop = currentLevel - aiPrediction.predictedCrowd;
      recommendations.push({ priority: 2, type: 'prediction', text: `⏰ Crowd will drop by ${drop}% in next hour`, action: 'Wait', waitTime: '30-45 min' });
    }
    
    // 3. Best time of day recommendation
    recommendations.push({ priority: 5, type: 'best', text: `${timeInsight.icon} ${timeInsight.period}: ${timeInsight.recommendation}`, action: 'Plan', waitTime: 'Varies' });
    
    // 4. Festival alert
    if (festivalImpact.active) {
      recommendations.unshift({ priority: 0, type: 'festival', text: festivalImpact.message, action: 'Book Special Entry', waitTime: '90-120 min' });
    }
    
    // 5. Booking insight
    if (bookingInsights.leastBookedSlot) {
      recommendations.push({ priority: 4, type: 'booking', text: `📅 Least booked slot: ${bookingInsights.leastBookedSlot} - Book now!`, action: 'Book Slot', waitTime: '20-30 min' });
    }
    
    // Sort by priority
    return recommendations.sort((a, b) => a.priority - b.priority);
  }
}

export default DashboardService;