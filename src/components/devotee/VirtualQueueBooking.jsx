import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createBooking } from '../../services/firestore';
import { TEMPLES, TIME_SLOTS, calculateWaitTime, generateTokenNumber } from '../../utils/constants';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Heart, Shield, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    const selectedTemple = TEMPLES.find(t => t.id === templeId);
    setTemple(selectedTemple);
    // Simulate getting current crowd level
    setCrowdLevel(Math.floor(Math.random() * 100));
  }, [templeId]);

  useEffect(() => {
    if (selectedSlot) {
      const wait = calculateWaitTime(crowdLevel, priority);
      setEstimatedWait(wait);
    }
  }, [selectedSlot, priority, crowdLevel]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select date and time slot');
      return;
    }

    setLoading(true);
    try {
      // Generate unique token
      const tokenNumber = generateTokenNumber(templeId, selectedDate, Date.now());
      
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
        qrCodeData: `${user.uid}|${templeId}|${selectedDate}|${selectedSlot}|${tokenNumber}|${Date.now()}`
      };

      await createBooking(bookingData);
      toast.success('Booking confirmed!');
      navigate('/my-bookings');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (!temple) return <div className="text-center py-20">Loading...</div>;

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
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all transform hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default VirtualQueueBooking;