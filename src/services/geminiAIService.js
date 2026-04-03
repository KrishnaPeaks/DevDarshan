import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'dummy-key');
// Use correct model name: gemini-1.5-pro or gemini-1.5-flash
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

class GeminiAIService {
  
  static async getRealTimePrediction(templeId, date, timeSlot, currentCrowd) {
    // Check if API key is available
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'dummy-key') {
      return this.getFallbackPrediction(currentCrowd);
    }
    
    try {
      const prompt = `Predict crowd level for ${templeId} temple on ${date} at ${timeSlot}. Current crowd: ${currentCrowd}%. Return JSON only.`;
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return this.getFallbackPrediction(currentCrowd);
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackPrediction(currentCrowd);
    }
  }
  
  static async generateSmartRoutingMessage(templeId, crowdData) {
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'dummy-key') {
      return this.getFallbackMessage(crowdData);
    }
    
    try {
      const prompt = `Generate a short routing message for ${templeId} temple. Entrance: ${crowdData.entranceLevel}%. Keep under 100 chars.`;
      const result = await model.generateContent(prompt);
      return result.response.text().trim().substring(0, 150);
    } catch (error) {
      return this.getFallbackMessage(crowdData);
    }
  }
  
  static async generateSmartAlert(templeId, crowdData, userCount) {
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'dummy-key') {
      return this.getFallbackAlert(crowdData);
    }
    
    try {
      const prompt = `Create a short alert for devotees at ${templeId}. Crowd: ${crowdData.entranceLevel}%. Short message under 80 chars.`;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      return this.getFallbackAlert(crowdData);
    }
  }
  
  static async analyzeCrowdTrend(templeId, historicalData) {
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'dummy-key') {
      return { trend: "stable", recommendation: "Continue monitoring" };
    }
    
    try {
      const prompt = `Analyze this crowd trend: ${JSON.stringify(historicalData.slice(-10))}. Return JSON with trend and recommendation.`;
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return { trend: "stable", recommendation: "Monitor normally" };
    } catch (error) {
      return { trend: "stable", recommendation: "Continue monitoring" };
    }
  }
  
  static getFallbackPrediction(currentCrowd) {
    return {
      predictedCrowd: currentCrowd,
      recommendation: currentCrowd > 70 ? "High crowd expected" : currentCrowd > 40 ? "Moderate crowd" : "Low crowd expected",
      waitTime: currentCrowd > 70 ? 60 : currentCrowd > 40 ? 30 : 15,
      alertLevel: currentCrowd > 70 ? "high" : currentCrowd > 40 ? "medium" : "low",
      suggestion: "Book your slot and arrive on time"
    };
  }
  
  static getFallbackMessage(crowdData) {
    if (crowdData.entranceLevel > 70) return "🚨 Main gate crowded! Use East Gate for faster entry";
    if (crowdData.entranceLevel > 40) return "📊 Moderate crowd. Expected wait: 30 minutes";
    return "✅ Low crowd! Best time for darshan";
  }
  
  static getFallbackAlert(crowdData) {
    if (crowdData.entranceLevel > 70) return "🔴 Heavy crowd detected. Consider visiting later";
    if (crowdData.entranceLevel > 40) return "🟡 Moderate crowd. Plan accordingly";
    return "🟢 Perfect time for darshan! Low crowd";
  }
}

export default GeminiAIService;