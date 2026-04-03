import GeminiAIService from './geminiAIService';

// This can be used as a mock API endpoint
export const getAIPrediction = async (templeId, date, timeSlot, currentCrowd) => {
  return await GeminiAIService.getRealTimePrediction(templeId, date, timeSlot, currentCrowd);
};

export const getSmartRouting = async (templeId, crowdData) => {
  return await GeminiAIService.generateSmartRoutingMessage(templeId, crowdData);
};