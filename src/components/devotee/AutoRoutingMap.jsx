import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const AutoRoutingMap = ({ templeId }) => {
  const [crowdLevel, setCrowdLevel] = useState(0);
  const [autoSuggestion, setAutoSuggestion] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'crowdData', templeId), (doc) => {
      if (doc.exists()) {
        const level = doc.data().entranceLevel || 0;
        setCrowdLevel(level);
        
        // AUTO-ROUTING LOGIC
        if (level > 75) {
          setAutoSuggestion('🔴 HEAVY CROWD → Use EAST GATE (Auto-routing activated)');
        } else if (level > 50) {
          setAutoSuggestion('🟡 MODERATE CROWD → Use NORTH GATE for faster entry');
        } else {
          setAutoSuggestion('🟢 LOW CROWD → Main gate recommended (Auto-routing optimal)');
        }
      }
    });
    return () => unsubscribe();
  }, [templeId]);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🗺️</span>
        <span className="font-mono text-sm bg-white/20 px-2 py-1 rounded">AUTO-ROUTING ENGINE</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">Live Crowd: {crowdLevel}%</p>
          <p className="text-lg font-bold mt-1">{autoSuggestion}</p>
        </div>
        <div className="text-right">
          <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
        </div>
      </div>
    </div>
  );
};