import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';

const AutoDemo = () => {
  const [demoRunning, setDemoRunning] = useState(false);
  const [currentCrowd, setCurrentCrowd] = useState(30);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 20));
  };

  const startAutoDemo = async () => {
    setDemoRunning(true);
    addLog('🤖 AUTO-DEMO STARTED - Watch automation in action!', 'success');
    
    const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
    let step = 0;
    
    const interval = setInterval(async () => {
      step++;
      const randomTemple = temples[Math.floor(Math.random() * temples.length)];
      const newCrowd = Math.floor(Math.random() * 100);
      
      // Auto-update crowd
      await updateDoc(doc(db, 'crowdData', randomTemple), {
        entranceLevel: newCrowd,
        lastAutoUpdate: new Date()
      });
      
      setCurrentCrowd(newCrowd);
      addLog(`📊 AUTO: ${randomTemple} crowd changed to ${newCrowd}%`, 
             newCrowd > 70 ? 'warning' : newCrowd < 30 ? 'success' : 'info');
      
      if (step >= 20) {
        clearInterval(interval);
        setDemoRunning(false);
        addLog('✅ AUTO-DEMO COMPLETED - 20 automatic updates performed!', 'success');
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-4">
          🤖 LIVE AUTOMATION DEMO
        </h1>
        <p className="text-gray-300 text-center mb-8">
          Watch as the system AUTOMATICALLY updates crowd data and generates responses
        </p>
        
        <div className="bg-black/50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-400 font-mono">● SYSTEM ACTIVE</span>
            {demoRunning && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-400">AUTO-DEMO RUNNING</span>
              </div>
            )}
          </div>
          
          <button
            onClick={startAutoDemo}
            disabled={demoRunning}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
          >
            {demoRunning ? '🤖 AUTOMATION IN PROGRESS...' : '🚀 START AUTOMATION DEMO'}
          </button>
        </div>
        
        <div className="bg-black/30 rounded-xl p-6">
          <h3 className="text-white font-bold mb-3">📋 AUTOMATION LOGS</h3>
          <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="text-gray-300 border-b border-gray-700 py-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoDemo;