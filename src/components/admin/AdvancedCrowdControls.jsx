import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc, writeBatch, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Bell, Users, Clock, TrendingUp, Send, Settings, Shield, Calendar, Filter } from 'lucide-react';

const TIME_SLOTS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'
];

const AdvancedCrowdControls = ({ selectedTemple }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotData, setSlotData] = useState({});
  const [allSlotData, setAllSlotData] = useState([]);
  const [waitTime, setWaitTime] = useState(30);
  const [slotCapacity, setSlotCapacity] = useState({ current: 0, max: 100 });
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFilterSlot, setSelectedFilterSlot] = useState('all');

  useEffect(() => {
    if (selectedTemple && selectedDate) {
      fetchSlotData();
      fetchAllSlotsData();
    }
  }, [selectedTemple, selectedDate]);

  const fetchSlotData = async () => {
    try {
      let q = query(
        collection(db, 'bookings'),
        where('temple', '==', selectedTemple),
        where('date', '==', selectedDate)
      );
      
      if (selectedSlot) {
        q = query(q, where('timeSlot', '==', selectedSlot));
      }
      
      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const slotWiseData = {};
      TIME_SLOTS.forEach(slot => {
        const slotBookings = bookings.filter(b => b.timeSlot === slot);
        slotWiseData[slot] = {
          total: slotBookings.length,
          upcoming: slotBookings.filter(b => b.status === 'upcoming').length,
          active: slotBookings.filter(b => b.status === 'active').length,
          completed: slotBookings.filter(b => b.status === 'completed').length,
          capacity: slotCapacity.max,
          percentage: (slotBookings.length / slotCapacity.max) * 100
        };
      });
      
      setSlotData(slotWiseData);
      
      if (selectedSlot && slotWiseData[selectedSlot]) {
        setSlotCapacity({
          current: slotWiseData[selectedSlot].total,
          max: 100
        });
      }
    } catch (error) {
      console.error('Error fetching slot data:', error);
    }
  };

  const fetchAllSlotsData = async () => {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('temple', '==', selectedTemple),
        where('date', '==', selectedDate)
      );
      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const slotSummary = TIME_SLOTS.map(slot => ({
        slot,
        count: bookings.filter(b => b.timeSlot === slot).length,
        status: bookings.filter(b => b.timeSlot === slot).map(b => b.status)
      })).sort((a, b) => b.count - a.count);
      
      setAllSlotData(slotSummary);
    } catch (error) {
      console.error('Error fetching all slots:', error);
    }
  };

  const updateSlotCapacity = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot first');
      return;
    }
    
    setLoading(true);
    try {
      await setDoc(doc(db, 'slotCapacity', `${selectedTemple}_${selectedDate}_${selectedSlot}`), {
        temple: selectedTemple,
        date: selectedDate,
        timeSlot: selectedSlot,
        maxCapacity: slotCapacity.max,
        updatedAt: Timestamp.now(),
        updatedBy: 'admin'
      }, { merge: true });
      
      toast.success(`Capacity for ${selectedSlot} updated to ${slotCapacity.max}`);
      fetchSlotData();
    } catch (error) {
      toast.error('Failed to update capacity');
    } finally {
      setLoading(false);
    }
  };

  const updateSlotWaitTime = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot first');
      return;
    }
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('temple', '==', selectedTemple),
        where('date', '==', selectedDate),
        where('timeSlot', '==', selectedSlot),
        where('status', '==', 'upcoming')
      );
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { estimatedWaitTime: waitTime });
      });
      await batch.commit();
      
      toast.success(`Wait time updated to ${waitTime} minutes for ${snapshot.size} bookings in ${selectedSlot}`);
    } catch (error) {
      toast.error('Failed to update wait time');
    } finally {
      setLoading(false);
    }
  };

  const sendSlotSpecificNotification = async () => {
    if (!alertMessage) {
      toast.error('Please enter a message');
      return;
    }
    
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('temple', '==', selectedTemple),
        where('date', '==', selectedDate),
        where('timeSlot', '==', selectedSlot),
        where('status', '==', 'upcoming')
      );
      const snapshot = await getDocs(q);
      
      const userIds = [...new Set(snapshot.docs.map(doc => doc.data().userId))];
      
      for (const userId of userIds) {
        await addDoc(collection(db, 'notifications'), {
          userId: userId,
          message: `[${selectedSlot}] ${alertMessage}`,
          temple: selectedTemple,
          timeSlot: selectedSlot,
          date: selectedDate,
          createdAt: Timestamp.now(),
          read: false,
          type: 'slot_alert'
        });
      }
      
      toast.success(`Alert sent to ${userIds.length} users for ${selectedSlot}`);
      setAlertMessage('');
    } catch (error) {
      toast.error('Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  const getCongestionLevel = (count, maxCapacity = 100) => {
    const percentage = (count / maxCapacity) * 100;
    if (percentage < 30) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage < 70) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'High', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const filteredSlots = selectedFilterSlot === 'all' 
    ? allSlotData 
    : allSlotData.filter(s => {
        if (selectedFilterSlot === 'congested') return s.count > 70;
        if (selectedFilterSlot === 'moderate') return s.count > 30 && s.count <= 70;
        if (selectedFilterSlot === 'free') return s.count <= 30;
        return true;
      });

  return (
    <div className="space-y-6">
      {/* Date and Slot Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          Select Date & Time Slot
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a time slot</option>
              {TIME_SLOTS.map(slot => (
                <option key={slot} value={slot}>
                  {slot} {slotData[slot] && `(${slotData[slot].total} bookings)`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Slot-wise Crowd Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary-600" />
            Slot-wise Crowd Overview
          </h3>
          <select
            value={selectedFilterSlot}
            onChange={(e) => setSelectedFilterSlot(e.target.value)}
            className="px-3 py-1 border rounded-lg text-sm"
          >
            <option value="all">All Slots</option>
            <option value="congested">High Congestion (70%+)</option>
            <option value="moderate">Moderate (30-70%)</option>
            <option value="free">Low (Below 30%)</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time Slot</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Bookings</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Congestion</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSlots.map((slot) => {
                const congestion = getCongestionLevel(slot.count);
                const percentage = Math.min(100, (slot.count / 100) * 100);
                return (
                  <tr key={slot.slot} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedSlot(slot.slot)}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{slot.slot}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{slot.count} / 100</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${congestion.color.replace('text', 'bg')}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${congestion.color}`}>
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${congestion.bg} ${congestion.color}`}>
                        {congestion.level}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Slot Controls */}
      {selectedSlot && (
        <>
          {/* Capacity Control for Selected Slot */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Capacity Control for {selectedSlot}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Current: {slotCapacity.current} / {slotCapacity.max}</span>
                  <span>{Math.round((slotCapacity.current / slotCapacity.max) * 100)}% Full</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      (slotCapacity.current / slotCapacity.max) * 100 > 70 ? 'bg-red-500' : 
                      (slotCapacity.current / slotCapacity.max) * 100 > 30 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, (slotCapacity.current / slotCapacity.max) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={slotCapacity.max}
                  onChange={(e) => setSlotCapacity({ ...slotCapacity, max: parseInt(e.target.value) || 100 })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="Max Capacity"
                />
                <button
                  onClick={updateSlotCapacity}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Update Capacity
                </button>
              </div>
            </div>
          </div>

          {/* Wait Time Control for Selected Slot */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Wait Time Control for {selectedSlot}
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <input
                  type="range"
                  min="0"
                  max="180"
                  value={waitTime}
                  onChange={(e) => setWaitTime(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-orange-600 min-w-[60px]">{waitTime} min</span>
              </div>
              <button
                onClick={updateSlotWaitTime}
                disabled={loading}
                className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                Update Wait Time for {selectedSlot}
              </button>
            </div>
          </div>

          {/* Slot-Specific Notifications */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              Send Alert for {selectedSlot}
            </h3>
            <textarea
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              placeholder={`Enter alert message for devotees booked in ${selectedSlot}...`}
              className="w-full px-3 py-2 border rounded-lg mb-3"
              rows="3"
            />
            <button
              onClick={sendSlotSpecificNotification}
              disabled={loading || !alertMessage}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send to Users in {selectedSlot}
            </button>
          </div>
        </>
      )}

      {/* Congestion Summary */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Congestion Summary for {selectedDate}
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">
              {allSlotData.filter(s => s.count > 70).length}
            </div>
            <div className="text-xs text-gray-600">High Congestion Slots</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {allSlotData.filter(s => s.count > 30 && s.count <= 70).length}
            </div>
            <div className="text-xs text-gray-600">Moderate Slots</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {allSlotData.filter(s => s.count <= 30).length}
            </div>
            <div className="text-xs text-gray-600">Free Slots</div>
          </div>
        </div>
        <div className="mt-3 text-center text-sm text-gray-600">
          Total Bookings Today: {allSlotData.reduce((sum, s) => sum + s.count, 0)}
        </div>
      </div>
    </div>
  );
};

export default AdvancedCrowdControls;