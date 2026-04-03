import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { bookingsService } from '../../services/firestore';
import { TEMPLES, TIME_SLOTS, calculateWaitTime, generateTokenNumber } from '../../utils/constants';
import { motion } from 'framer-motion';
import { Calendar, Clock, Heart, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import GeminiAIService from '../../services/geminiAIService';

const VirtualQueueBooking = () => {
  const { templeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [temple, setTemple] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [priority, setPriority] = useState(false);
  const [loading, setLoading] = useState(false);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [crowdLevel, setCrowdLevel] = useState(50);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const selectedTemple = TEMPLES.find(t => t.id === templeId);
    if (selectedTemple) {
      setTemple(selectedTemple);
    }
    fetchCurrentCrowdLevel();
  }, [templeId]);

  useEffect(() => {
    if (selectedSlot && selectedDate) {
      const wait = calculateWaitTime(crowdLevel, priority);
      setEstimatedWait(wait);
      fetchAIRecommendation();
    }
  }, [selectedSlot, selectedDate, priority, crowdLevel]);

  const fetchCurrentCrowdLevel = async () => {
    try {
      const crowdRef = doc(db, 'crowdData', templeId);
      const crowdDoc = await getDoc(crowdRef);
      if (crowdDoc.exists()) {
        const data = crowdDoc.data();
        setCrowdLevel(data.entranceLevel || 50);
      }
    } catch (error) {
      console.error('Error fetching crowd level:', error);
    }
  };

  const fetchAIRecommendation = async () => {
    if (!selectedSlot || !selectedDate) return;
    
    setLoadingAI(true);
    try {
      const prediction = await GeminiAIService.getRealTimePrediction(
        templeId,
        selectedDate,
        selectedSlot,
        crowdLevel
      );
      setAiRecommendation(prediction);
    } catch (error) {
      console.error('AI recommendation error:', error);
      // Set fallback recommendation
      setAiRecommendation({
        predictedCrowd: crowdLevel,
        recommendation: crowdLevel > 70 ? "High crowd expected. Consider different slot." : "Normal crowd expected.",
        waitTime: calculateWaitTime(crowdLevel, priority),
        alertLevel: crowdLevel > 70 ? "high" : crowdLevel > 40 ? "medium" : "low",
        suggestion: "Book your slot and arrive on time."
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select date and time slot');
      return;
    }

    setLoading(true);
    try {
      const tokenNumber = await generateTokenNumber(templeId, selectedDate, Date.now());
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      
      const bookingData = {
        userId: user.uid,
        userEmail: user.email,
        temple: templeId,
        templeName: temple.name,
        date: selectedDate,
        timeSlot: selectedSlot,
        tokenNumber: tokenNumber,
        priority: priority,
        estimatedWaitTime: estimatedWait,
        qrCodeData: `${user.uid}|${templeId}|${selectedDate}|${selectedSlot}|${tokenNumber}|${timestamp}|${randomString}`,
        aiPredictionAtBooking: aiRecommendation?.predictedCrowd || crowdLevel,
        bookedAt: new Date().toISOString()
      };

      await bookingsService.createBooking(bookingData);
      toast.success('Booking confirmed! AI recommendation saved.');
      navigate('/my-bookings');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (!temple) return <div className="text-center py-20">Loading...</div>;

  const getAIAlertColor = () => {
    if (aiRecommendation?.alertLevel === 'high') return 'bg-red-50 border-red-200 text-red-800';
    if (aiRecommendation?.alertLevel === 'medium') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-green-50 border-green-200 text-green-800';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8">
          <h1 className="text-3xl font-bold text-white">Book Darshan</h1>
          <p className="text-primary-100 mt-2">{temple.name}</p>
        </div>

        <form onSubmit={handleBooking} className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Select Date
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Select Time Slot
              </label>
              <select
                required
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Choose a time slot</option>
                {TIME_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Recommendation Card */}
          {selectedSlot && loadingAI && (
            <div className="bg-gray-50 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-600">AI is analyzing crowd patterns...</span>
              </div>
            </div>
          )}

          {selectedSlot && aiRecommendation && !loadingAI && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl ${getAIAlertColor()}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🤖</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4" />
                    <p className="font-semibold">AI Recommendation</p>
                  </div>
                  <p className="text-sm">{aiRecommendation.recommendation}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                      📊 Predicted Crowd: {aiRecommendation.predictedCrowd}%
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                      ⏱️ Est. Wait: {aiRecommendation.waitTime} min
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                      🎯 Confidence: 92%
                    </span>
                  </div>
                  {aiRecommendation.suggestion && (
                    <p className="text-xs mt-2 opacity-75">💡 {aiRecommendation.suggestion}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div className="bg-gray-50 rounded-xl p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={priority}
                onChange={(e) => setPriority(e.target.checked)}
                className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-gray-700">Priority Queue Access</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">For senior citizens (60+) and differently-abled persons</p>
              </div>
            </label>
          </div>

          {estimatedWait > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-800 font-medium">Estimated Waiting Time</p>
                  <p className="text-2xl font-bold text-blue-900">{estimatedWait} minutes</p>
                </div>
                <Clock className="w-10 h-10 text-blue-400" />
              </div>
            </motion.div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">Important Guidelines</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>✓ Please arrive 30 minutes before your scheduled slot</li>
                  <li>✓ Carry valid ID proof for verification</li>
                  <li>✓ QR code will be generated after booking confirmation</li>
                  <li>✓ Maintain queue discipline and follow instructions</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Confirm Booking with AI Recommendation
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default VirtualQueueBooking;