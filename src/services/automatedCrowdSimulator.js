import { db } from './firebase';
import { doc, updateDoc, Timestamp, getDoc, collection, addDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'dummy-key');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

class AutomatedCrowdSimulator {
  static intervals = {};
  static isRunning = false;

  // Festival calendar for Ambaji Temple (based on real government data)
  static festivals = {
    'bhadarviPoonam': {
      name: 'Bhadarvi Poonam Mahamela',
      startDate: '2025-09-12',
      endDate: '2025-09-18',
      multiplier: 8.5,
      crowdForecast: 92,
      description: '170+ year old tradition - 32.54 lakh devotees (2024)',
      donations: '₹2.66 Cr',
      facilities: '3 domes, 72,000 users, 20+ lakh prasad'
    },
    'navratri': {
      name: 'Navratri',
      startDate: '2025-09-22',
      endDate: '2025-10-01',
      multiplier: 3.5,
      crowdForecast: 85,
      description: 'Nine nights of devotion - Special darshan arrangements'
    },
    'diwali': {
      name: 'Diwali',
      startDate: '2025-10-20',
      endDate: '2025-10-20',
      multiplier: 2.8,
      crowdForecast: 80,
      description: 'Festival of Lights - Grand celebrations'
    },
    'mahaShivaratri': {
      name: 'Maha Shivaratri',
      startDate: '2025-02-26',
      endDate: '2025-02-26',
      multiplier: 2.5,
      crowdForecast: 78,
      description: 'Night of Shiva - All night prayers'
    },
    'janmashtami': {
      name: 'Janmashtami',
      startDate: '2025-08-16',
      endDate: '2025-08-16',
      multiplier: 2.2,
      crowdForecast: 75,
      description: 'Lord Krishna birthday - Festive celebrations'
    },
    'newYear': {
      name: 'New Year',
      startDate: '2025-01-01',
      endDate: '2025-01-01',
      multiplier: 2.0,
      crowdForecast: 72,
      description: 'New Year special darshan'
    }
  };

  // Start realistic crowd simulation with AI
  static start() {
    if (this.isRunning) return;
    
    console.log('🎯 REALISTIC CROWD SIMULATION STARTED');
    console.log('🤖 GEMINI AI INTEGRATION ACTIVE');
    console.log('📅 FESTIVAL DETECTION ACTIVE');
    
    const temples = ['ambaji'];
    
    temples.forEach(templeId => {
      this.simulateTempleCrowd(templeId);
    });
    
    this.startFestivalChecking();
    this.startAIPredictionCycle();
    
    this.isRunning = true;
  }

  static startAIPredictionCycle() {
    this.intervals.aiPrediction = setInterval(async () => {
      const activeFestival = this.getActiveFestival();
      const now = new Date();
      const hour = now.getHours();
      
      // Only run AI prediction during active hours
      if (hour >= 6 && hour <= 22) {
        await this.generateAIPrediction(activeFestival);
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  static async generateAIPrediction(activeFestival) {
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'dummy-key') {
        return;
      }
      
      const currentCrowd = await this.getCurrentCrowd('ambaji');
      const now = new Date();
      const hour = now.getHours();
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
      
      const prompt = `As an AI crowd prediction expert for Ambaji Temple (One of the 51 Shakti Peethas), analyze:
      
Current time: ${hour}:00 (${dayName})
Current crowd: ${currentCrowd}%
${activeFestival ? `Active Festival: ${activeFestival.name} (${activeFestival.multiplier}x crowd expected)` : 'No active festival'}

Predict the crowd level for the next 2 hours. Return ONLY a JSON object:
{
  "predictedCrowd1Hour": number (0-100),
  "predictedCrowd2Hour": number (0-100),
  "recommendation": "string (advice for devotees)",
  "peakTime": "string (when crowd will be highest)",
  "confidence": number (0-100)
}`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const prediction = JSON.parse(jsonMatch[0]);
        
        // Save prediction to Firestore
        await addDoc(collection(db, 'aiPredictions'), {
          temple: 'ambaji',
          timestamp: Timestamp.now(),
          currentCrowd: currentCrowd,
          ...prediction,
          festival: activeFestival?.name || null,
          generatedBy: 'gemini-ai'
        });
        
        console.log(`🤖 AI Prediction: ${prediction.predictedCrowd1Hour}% in 1 hour | Confidence: ${prediction.confidence}%`);
        
        // Auto-create routing message based on prediction
        if (prediction.predictedCrowd1Hour > 75) {
          await addDoc(collection(db, 'routingMessages'), {
            temple: 'ambaji',
            message: `🤖 AI PREDICTION: Crowd expected to reach ${prediction.predictedCrowd1Hour}% in next hour. ${prediction.recommendation}`,
            priorityGroup: 'all',
            createdAt: Timestamp.now(),
            isActive: true,
            type: 'ai-prediction',
            source: 'gemini-ai'
          });
        }
      }
    } catch (error) {
      console.error('AI Prediction error:', error);
    }
  }

  static startFestivalChecking() {
    this.intervals.festivalCheck = setInterval(() => {
      const activeFestival = this.getActiveFestival();
      if (activeFestival) {
        console.log(`🎉 FESTIVAL ACTIVE: ${activeFestival.name} - ${activeFestival.multiplier}x crowd expected`);
      }
    }, 60 * 60 * 1000);
  }

  static getActiveFestival() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    for (const [key, festival] of Object.entries(this.festivals)) {
      if (festival.startDate) {
        if (todayStr >= festival.startDate && todayStr <= (festival.endDate || festival.startDate)) {
          return festival;
        }
      }
    }
    return null;
  }

  static simulateTempleCrowd(templeId) {
    this.intervals[templeId] = setInterval(async () => {
      try {
        const currentCrowd = await this.getCurrentCrowd(templeId);
        const newCrowd = this.calculateRealisticCrowd(templeId, currentCrowd);
        
        await updateDoc(doc(db, 'crowdData', templeId), {
          entranceLevel: newCrowd,
          templeAreaLevel: this.calculateTempleAreaCrowd(newCrowd),
          parkingLevel: this.calculateParkingCrowd(newCrowd),
          lastAutomatedUpdate: Timestamp.now(),
          updatedBy: 'automation-system',
          crowdTrend: this.getCrowdTrend(currentCrowd, newCrowd)
        });
        
        console.log(`🔄 AUTO: ${templeId} crowd updated to ${newCrowd}% at ${new Date().toLocaleTimeString()}`);
        
        await this.autoGenerateMessage(templeId, newCrowd);
        
      } catch (error) {
        console.error(`Auto crowd error for ${templeId}:`, error);
      }
    }, 120000);
  }

  static calculateRealisticCrowd(templeId, currentCrowd) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isWeekend = (day === 0 || day === 6);
    const activeFestival = this.getActiveFestival();
    
    let baseCrowd = 30;
    
    // Time-based crowd logic
    if (hour >= 22 || hour <= 5) {
      baseCrowd = 8;
      console.log(`🌙 NIGHT TIME (${hour}:00) - Crowd: 8%`);
    }
    else if (hour >= 5 && hour < 6) baseCrowd = 12;
    else if (hour >= 6 && hour < 8) baseCrowd = 25;
    else if (hour >= 8 && hour < 9) baseCrowd = 40;
    else if (hour >= 9 && hour < 11) baseCrowd = 65;
    else if (hour >= 11 && hour < 12) baseCrowd = 70;
    else if (hour >= 12 && hour < 14) baseCrowd = 45;
    else if (hour >= 14 && hour < 16) baseCrowd = 50;
    else if (hour >= 16 && hour < 17) baseCrowd = 55;
    else if (hour >= 17 && hour < 18) baseCrowd = 65;
    else if (hour >= 18 && hour < 20) baseCrowd = 80;
    else if (hour >= 20 && hour < 21) baseCrowd = 55;
    else if (hour >= 21 && hour < 22) baseCrowd = 25;
    
    // Festival impact (HIGHEST PRIORITY)
    if (activeFestival) {
      baseCrowd = activeFestival.crowdForecast;
      console.log(`🎉 FESTIVAL: ${activeFestival.name} - Crowd: ${baseCrowd}%`);
    }
    
    // Weekend boost (only during day, less during festivals)
    if (isWeekend && hour >= 6 && hour <= 20 && !activeFestival) {
      baseCrowd = Math.min(95, baseCrowd + 20);
    }
    
    // Random fluctuation
    const fluctuation = Math.floor(Math.random() * 20) - 10;
    let newCrowd = baseCrowd + fluctuation;
    newCrowd = Math.min(98, Math.max(2, newCrowd));
    
    // Smooth transition
    if (Math.abs(newCrowd - currentCrowd) > 15) {
      newCrowd = currentCrowd + (newCrowd > currentCrowd ? 12 : -12);
    }
    
    return Math.round(newCrowd);
  }

  static async autoGenerateMessage(templeId, crowdLevel) {
    try {
      let message = null;
      const now = new Date();
      const hour = now.getHours();
      const activeFestival = this.getActiveFestival();
      
      // Festival messages
      if (activeFestival) {
        if (activeFestival.name === 'Bhadarvi Poonam Mahamela') {
          message = `🎉 ${activeFestival.name}! ${activeFestival.description}. Crowd: ${crowdLevel}%. Book special entry tickets. Facilities: ${activeFestival.facilities}`;
        } else {
          message = `🎊 ${activeFestival.name}! ${activeFestival.description}. Crowd level: ${crowdLevel}%. Plan your visit accordingly.`;
        }
      }
      else if (hour >= 22 || hour <= 5) {
        if (crowdLevel < 15) {
          message = `🌙 Late Night Darshan: Very low crowd (${crowdLevel}%). Perfect time for peaceful darshan!`;
        }
      }
      else if (crowdLevel > 80) {
        message = `🔴 CRITICAL: Ambaji Temple at ${crowdLevel}%! Use East Gate. Expected wait: 90+ min.`;
      } 
      else if (crowdLevel > 70) {
        message = `⚠️ HIGH CROWD: ${crowdLevel}%. Expected wait: 60-75 min. Consider special entry.`;
      } 
      else if (crowdLevel > 60) {
        message = `🟡 MODERATE: ${crowdLevel}%. Expected wait: 30-45 min.`;
      } 
      else if (crowdLevel < 20 && hour >= 6 && hour <= 20) {
        message = `🟢 LOW CROWD: ${crowdLevel}%. Best time for peaceful darshan!`;
      }
      
      if (message) {
        await addDoc(collection(db, 'routingMessages'), {
          temple: templeId,
          message: message,
          priorityGroup: 'all',
          createdAt: Timestamp.now(),
          isActive: true,
          type: 'auto-generated',
          source: 'crowd-simulator',
          festival: activeFestival?.name || null,
          crowdLevel: crowdLevel
        });
        console.log(`📢 MESSAGE: ${message.substring(0, 80)}...`);
      }
    } catch (error) {
      console.error('Auto message error:', error);
    }
  }

  static calculateTempleAreaCrowd(entranceCrowd) {
    let areaCrowd = entranceCrowd * 0.85;
    areaCrowd = Math.min(95, Math.max(3, areaCrowd));
    return Math.round(areaCrowd);
  }

  static calculateParkingCrowd(entranceCrowd) {
    let parkingCrowd = entranceCrowd * 0.9;
    parkingCrowd = Math.min(98, Math.max(2, parkingCrowd));
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

  static stop() {
    Object.values(this.intervals).forEach(interval => clearInterval(interval));
    this.isRunning = false;
    console.log('🛑 Crowd simulation stopped');
  }
}

export default AutomatedCrowdSimulator;