import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { TEMPLES } from '../../utils/constants';
import toast from 'react-hot-toast';
import { Users, Car, Building2, TrendingUp, Save } from 'lucide-react';

// New Slot Management Component
const SlotManagement = ({ selectedTemple }) => {
  const [selectedSlot, setSelectedSlot] = useState('');
  const [newTiming, setNewTiming] = useState('');

  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
    '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
    '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
  ];

  const adjustSlotTiming = async () => {
    if (!selectedSlot || !newTiming) {
      toast.error('Please select slot and new timing');
      return;
    }

    try {
      // Update slot timing in Firestore
      await setDoc(doc(db, 'slotAdjustments', `${selectedTemple}_${selectedSlot}`), {
        temple: selectedTemple,
        originalSlot: selectedSlot,
        newTiming: newTiming,
        adjustedBy: 'admin',
        adjustedAt: Timestamp.now(),
        isActive: true
      });
      
      toast.success(`Slot timing adjusted from ${selectedSlot} to ${newTiming}`);
      setSelectedSlot('');
      setNewTiming('');
    } catch (error) {
      console.error('Error adjusting slot:', error);
      toast.error('Failed to adjust slot');
    }
  };

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-3">Adjust Slot Timings</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Select Congested Slot</label>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select Congested Slot</option>
            {timeSlots.map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-gray-600 mb-1">New Timing</label>
          <select
            value={newTiming}
            onChange={(e) => setNewTiming(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            disabled={!selectedSlot}
          >
            <option value="">Select New Timing</option>
            {timeSlots
              .filter(slot => slot !== selectedSlot)
              .map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))
            }
          </select>
        </div>
      </div>

      <button
        onClick={adjustSlotTiming}
        disabled={!selectedSlot || !newTiming}
        className="mt-4 w-full bg-orange-600 text-white py-2.5 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed font-medium"
      >
        Adjust Slot Timing
      </button>
    </div>
  );
};

const CrowdControlPanel = () => {
  const [selectedTemple, setSelectedTemple] = useState(TEMPLES[0]?.id || '');
  const [crowdLevels, setCrowdLevels] = useState({
    entrance: 0,
    templeArea: 0,
    parking: 0
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (selectedTemple) {
      loadCurrentCrowdData();
    }
  }, [selectedTemple]);

  const loadCurrentCrowdData = async () => {
    try {
      const crowdRef = doc(db, 'crowdData', selectedTemple);
      const crowdDoc = await getDoc(crowdRef);
      if (crowdDoc.exists()) {
        const data = crowdDoc.data();
        setCrowdLevels({
          entrance: data.entranceLevel || 0,
          templeArea: data.templeAreaLevel || 0,
          parking: data.parkingLevel || 0
        });
        setLastUpdated(data.lastUpdated?.toDate() || new Date());
      }
    } catch (error) {
      console.error('Error loading crowd data:', error);
    }
  };

  const updateCrowdLevel = (zone, value) => {
    setCrowdLevels(prev => ({ ...prev, [zone]: value }));
  };

  const saveCrowdData = async () => {
    setLoading(true);
    try {
      const crowdData = {
        temple: selectedTemple,
        entranceLevel: crowdLevels.entrance,
        templeAreaLevel: crowdLevels.templeArea,
        parkingLevel: crowdLevels.parking,
        lastUpdated: Timestamp.now(),
        updatedBy: 'admin'
      };
      
      await setDoc(doc(db, 'crowdData', selectedTemple), crowdData, { merge: true });
      setLastUpdated(new Date());
      toast.success('Crowd data updated successfully!');
    } catch (error) {
      console.error('Error saving crowd data:', error);
      toast.error('Failed to update crowd data');
    } finally {
      setLoading(false);
    }
  };

  const getCrowdColor = (level) => {
    if (level <= 33) return 'text-green-600';
    if (level <= 66) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCrowdBgColor = (level) => {
    if (level <= 33) return 'bg-green-500';
    if (level <= 66) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const zones = [
    { key: 'entrance', label: 'Entrance Gate', icon: Users, color: 'blue' },
    { key: 'templeArea', label: 'Temple Area', icon: Building2, color: 'purple' },
    { key: 'parking', label: 'Parking Area', icon: Car, color: 'orange' }
  ];

  return (
    <div className="space-y-6">
      {/* Temple Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Live Crowd Control</h2>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Temple</label>
          <select
            value={selectedTemple}
            onChange={(e) => setSelectedTemple(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {TEMPLES.map(temple => (
              <option key={temple.id} value={temple.id}>{temple.name}</option>
            ))}
          </select>
        </div>

        {/* Crowd Sliders */}
        <div className="space-y-8">
          {zones.map((zone) => (
            <div key={zone.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <zone.icon className={`w-5 h-5 text-${zone.color}-600`} />
                  <label className="font-medium text-gray-700">{zone.label}</label>
                </div>
                <span className={`font-bold text-lg ${getCrowdColor(crowdLevels[zone.key])}`}>
                  {crowdLevels[zone.key]}%
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={crowdLevels[zone.key]}
                  onChange={(e) => updateCrowdLevel(zone.key, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Low (0-33%)</span>
                  <span>Medium (34-66%)</span>
                  <span>High (67-100%)</span>
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${getCrowdBgColor(crowdLevels[zone.key])} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${crowdLevels[zone.key]}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={saveCrowdData}
          disabled={loading}
          className="mt-8 w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Updating...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Update Crowd Data
            </>
          )}
        </button>

        {/* Added Slot Management Section */}
        <SlotManagement selectedTemple={selectedTemple} />
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Real-time Updates</h3>
            <p className="text-sm text-blue-800">
              Changes will reflect instantly on the user dashboard. 
              Green = Smooth, Yellow = Moderate, Red = Heavy crowd.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrowdControlPanel;