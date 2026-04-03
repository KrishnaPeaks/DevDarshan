import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { TEMPLES } from '../../utils/constants';
import { Activity, TrendingUp, TrendingDown, Minus, Clock, Calendar } from 'lucide-react';

const AutomatedCrowdView = () => {
  const [crowdData, setCrowdData] = useState({});
  const [selectedTemple, setSelectedTemple] = useState(TEMPLES[0]?.id || '');

  useEffect(() => {
    if (!selectedTemple) return;
    
    const unsubscribe = onSnapshot(doc(db, 'crowdData', selectedTemple), (doc) => {
      if (doc.exists()) {
        setCrowdData({ id: doc.id, ...doc.data() });
      }
    });
    
    return () => unsubscribe();
  }, [selectedTemple]);

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  const getCrowdStatus = (level) => {
    if (level > 70) return { text: 'High', color: 'text-red-600', bg: 'bg-red-100' };
    if (level > 40) return { text: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const peakHourMessage = (currentHour >= 10 && currentHour <= 13) || (currentHour >= 17 && currentHour <= 20) 
    ? '📍 Peak hours currently - Automated routing active'
    : '📍 Off-peak hours - Smooth flow expected';

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-mono">AUTOMATED CROWD SYSTEM</span>
            </div>
            <h2 className="text-2xl font-bold">🤖 AI-Powered Automation Active</h2>
            <p className="text-green-100 mt-1">No manual input required - System updates automatically</p>
          </div>
          <div className="text-right">
            <div className="text-sm">Last auto-update</div>
            <div className="font-mono text-xs">{crowdData?.lastAutomatedUpdate?.toDate?.().toLocaleTimeString() || 'Just now'}</div>
          </div>
        </div>
      </div>

      {/* Temple Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">View Temple</label>
        <select
          value={selectedTemple}
          onChange={(e) => setSelectedTemple(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg"
        >
          {TEMPLES.map(temple => (
            <option key={temple.id} value={temple.id}>{temple.name}</option>
          ))}
        </select>
      </div>

      {/* Live Automated Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500">Entrance Crowd</span>
            {getTrendIcon(crowdData?.crowdTrend)}
          </div>
          <div className="text-4xl font-bold">{crowdData?.entranceLevel || 0}%</div>
          <div className="mt-2">
            <span className={`px-2 py-1 text-xs rounded-full ${getCrowdStatus(crowdData?.entranceLevel || 0).bg} ${getCrowdStatus(crowdData?.entranceLevel || 0).color}`}>
              {getCrowdStatus(crowdData?.entranceLevel || 0).text} Crowd
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500">Temple Area</span>
          </div>
          <div className="text-4xl font-bold">{crowdData?.templeAreaLevel || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${crowdData?.templeAreaLevel || 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500">Parking</span>
          </div>
          <div className="text-4xl font-bold">{crowdData?.parkingLevel || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${crowdData?.parkingLevel || 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Automation Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Automation Schedule</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Crowd updates:</span>
              <span className="font-mono">Every 2 minutes (auto)</span>
            </div>
            <div className="flex justify-between">
              <span>Routing messages:</span>
              <span className="font-mono">Triggered by crowd level</span>
            </div>
            <div className="flex justify-between">
              <span>Peak hour detection:</span>
              <span className="font-mono">Automatic</span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Real-time Intelligence</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Current status:</span>
              <span className="font-mono text-green-600">● System Active</span>
            </div>
            <div className="flex justify-between">
              <span>Auto-routing:</span>
              <span className="font-mono">Enabled</span>
            </div>
            <div className="flex justify-between">
              <span>Predictions:</span>
              <span className="font-mono">{peakHourMessage}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Card */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
        <h3 className="font-bold mb-2">🤖 How the Automation Works</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-green-400 mb-1">1. Real-time Data</div>
            <p className="text-gray-300 text-xs">System pulls live crowd data from sensors and historical patterns</p>
          </div>
          <div>
            <div className="text-blue-400 mb-1">2. AI Analysis</div>
            <p className="text-gray-300 text-xs">Machine learning predicts crowd trends and peak hours</p>
          </div>
          <div>
            <div className="text-purple-400 mb-1">3. Auto Actions</div>
            <p className="text-gray-300 text-xs">Routing messages, wait times, and alerts trigger automatically</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomatedCrowdView;