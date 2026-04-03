import React, { useState, useEffect } from 'react';
import { Activity, Clock, Bell, TrendingUp, Zap, Shield, RefreshCw } from 'lucide-react';
import CompleteAutomation from '../../services/completeAutomation';

const AutomationStatus = () => {
  const [status, setStatus] = useState({ isRunning: false, activeModules: 0 });
  const [lastActivities, setLastActivities] = useState([]);

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = () => {
    setStatus(CompleteAutomation.getStatus());
    // Simulate recent activities
    setLastActivities([
      { time: 'Just now', action: 'Crowd monitoring', status: 'active' },
      { time: '2 min ago', action: 'Routing message generated', status: 'success' },
      { time: '5 min ago', action: 'Wait times updated', status: 'success' },
      { time: '15 min ago', action: 'Slot optimization', status: 'active' },
    ]);
  };

  const modules = [
    { name: 'Crowd Monitoring', icon: Activity, interval: '30s', color: 'bg-green-500' },
    { name: 'Routing Messages', icon: Bell, interval: '2min', color: 'bg-blue-500' },
    { name: 'Wait Time Updates', icon: Clock, interval: '5min', color: 'bg-yellow-500' },
    { name: 'Slot Optimization', icon: TrendingUp, interval: '15min', color: 'bg-purple-500' },
    { name: 'Peak Hour Adjust', icon: Zap, interval: '30min', color: 'bg-orange-500' },
    { name: 'Security', icon: Shield, interval: 'Real-time', color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">🤖 AI Automation Engine</h2>
            <p className="text-green-100 mt-1">Fully Automated Crowd Management System</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">24/7</div>
            <p className="text-green-100">Active Monitoring</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">System Online</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Auto-Sync Active</span>
          </div>
        </div>
      </div>

      {/* Automation Modules */}
      <div className="grid md:grid-cols-3 gap-4">
        {modules.map((module, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 ${module.color} rounded-lg`}>
                <module.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-500">Every {module.interval}</span>
            </div>
            <h3 className="font-semibold text-gray-900">{module.name}</h3>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Automation Activities</h3>
        <div className="space-y-3">
          {lastActivities.map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${activity.status === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-sm text-gray-700">{activity.action}</span>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">100%</div>
          <div className="text-xs text-gray-500">Automation Coverage</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">Real-time</div>
          <div className="text-xs text-gray-500">Response Time</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">24/7</div>
          <div className="text-xs text-gray-500">Uptime</div>
        </div>
      </div>
    </div>
  );
};

export default AutomationStatus;