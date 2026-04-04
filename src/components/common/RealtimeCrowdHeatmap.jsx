import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RealtimeCrowdHeatmap = () => {
  const mapRef = useRef(null);
  const [crowdData, setCrowdData] = useState({
    entranceLevel: 45,
    templeAreaLevel: 40,
    parkingLevel: 35
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [realtimeLog, setRealtimeLog] = useState([]);

  // Ambaji Temple coordinates
  const templeCenter = [24.3324, 72.8620];
  const zoom = 16;

  // Zone coordinates
  const zones = [
    { name: '🚪 Entrance Gate', coords: [24.3320, 72.8615], key: 'entranceLevel', icon: '🚪', description: 'Main entry point' },
    { name: '🛕 Main Temple', coords: [24.3324, 72.8620], key: 'templeAreaLevel', icon: '🛕', description: 'Sanctum sanctorum' },
    { name: '🅿️ Parking Area', coords: [24.3330, 72.8610], key: 'parkingLevel', icon: '🅿️', description: 'Vehicle parking' },
    { name: '⛰️ Gabbar Hill', coords: [24.3340, 72.8605], key: 'gabbarLevel', icon: '⛰️', description: 'Sacred hilltop' }
  ];

  const addLog = (message, type = 'info') => {
    setRealtimeLog(prev => {
      const newLog = [{ time: new Date(), message, type }, ...prev];
      return newLog.slice(0, 20);
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current && document.getElementById('realtime-heatmap')) {
      mapRef.current = L.map('realtime-heatmap').setView(templeCenter, zoom);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapRef.current);
      
      addLog('🗺️ Heatmap initialized', 'success');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // REAL-TIME CROWD DATA LISTENER
  useEffect(() => {
    const unsubscribeCrowd = onSnapshot(doc(db, 'crowdData', 'ambaji'), (docSnap) => {
      if (docSnap.exists()) {
        const newData = docSnap.data();
        setCrowdData(newData);
        setLastUpdate(new Date());
        addLog(`📊 Crowd updated: Entrance ${newData.entranceLevel}% | Temple ${newData.templeAreaLevel}% | Parking ${newData.parkingLevel}%`, 'update');
        updateMapMarkers(newData);
      } else {
        addLog('⚠️ No crowd data found for Ambaji Temple', 'warning');
      }
    });

    return () => unsubscribeCrowd();
  }, []);

  // Update map markers in real-time
  const updateMapMarkers = (data) => {
    if (!mapRef.current) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer.options && (layer.options.pane === 'markerPane' || layer._icon)) {
        mapRef.current.removeLayer(layer);
      }
    });

    zones.forEach(zone => {
      const level = data[zone.key] || 0;
      const color = getColorByCrowd(level);
      const radius = 20 + (level / 100) * 40;
      
      const circle = L.circleMarker(zone.coords, {
        radius: radius,
        fillColor: color,
        color: '#ffffff',
        weight: 3,
        fillOpacity: 0.7,
        opacity: 0.9
      }).addTo(mapRef.current);

      if (level > 70) {
        circle.setStyle({ className: 'pulse-marker' });
      }

      circle.bindPopup(`
        <div style="padding: 12px; min-width: 200px; font-family: Arial;">
          <div style="font-size: 24px; text-align: center;">${zone.icon}</div>
          <h4 style="font-weight: bold; margin: 8px 0; text-align: center;">${zone.name}</h4>
          <p style="font-size: 12px; color: #666; text-align: center;">${zone.description}</p>
          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Crowd Level:</span>
              <span style="font-weight: bold; color: ${color};">${Math.round(level)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Status:</span>
              <span>${getStatusText(level)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Wait Time:</span>
              <span>${getWaitTime(level)} min</span>
            </div>
          </div>
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center;">
            Last updated: ${new Date().toLocaleTimeString()}
          </div>
        </div>
      `);

      circle.bindTooltip(`${zone.name}: ${Math.round(level)}% crowded`, { sticky: true });
    });
  };

  const getColorByCrowd = (level) => {
    if (level > 75) return '#ef4444';
    if (level > 60) return '#f97316';
    if (level > 40) return '#eab308';
    if (level > 20) return '#84cc16';
    return '#22c55e';
  };

  const getStatusText = (level) => {
    if (level > 75) return '🔴 Critical - Avoid';
    if (level > 60) return '🟠 High - Consider waiting';
    if (level > 40) return '🟡 Moderate - Manageable';
    if (level > 20) return '🟢 Low - Good time';
    return '✅ Very Low - Best time';
  };

  const getWaitTime = (level) => {
    if (level > 80) return 90;
    if (level > 65) return 60;
    if (level > 50) return 45;
    if (level > 35) return 30;
    if (level > 20) return 20;
    return 10;
  };

  const getCrowdSummary = () => {
    const avg = (crowdData.entranceLevel + crowdData.templeAreaLevel) / 2;
    if (avg > 70) return { text: 'Heavy Crowd', color: '#ef4444', message: 'Expect long queues. Use East Gate.' };
    if (avg > 40) return { text: 'Moderate Crowd', color: '#eab308', message: 'Manageable. Good time for darshan.' };
    return { text: 'Low Crowd', color: '#22c55e', message: 'Best time for peaceful darshan!' };
  };

  const summary = getCrowdSummary();

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-mono">REAL-TIME UPDATES</span>
            </div>
            <h3 className="text-xl font-bold">🔥 Live Crowd Heatmap</h3>
            <p className="text-orange-100 text-sm">Updates automatically when crowd changes</p>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-75">Last Update</div>
            <div className="text-sm font-mono">{lastUpdate.toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      <div className="p-3 bg-gray-50 border-b" style={{ borderLeftColor: summary.color, borderLeftWidth: '4px' }}>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-semibold" style={{ color: summary.color }}>{summary.text}</span>
            <p className="text-xs text-gray-500">{summary.message}</p>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div>Low</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div>Moderate</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500"></div>High</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>Critical</div>
          </div>
        </div>
      </div>

      <div id="realtime-heatmap" style={{ height: '450px', width: '100%' }}></div>

      <div className="p-4 bg-gray-50 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">🚪 Entrance Gate</div>
            <div className="text-2xl font-bold" style={{ color: getColorByCrowd(crowdData.entranceLevel) }}>
              {Math.round(crowdData.entranceLevel)}%
            </div>
            <div className="text-xs text-gray-400">Wait: {getWaitTime(crowdData.entranceLevel)} min</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">🛕 Main Temple</div>
            <div className="text-2xl font-bold" style={{ color: getColorByCrowd(crowdData.templeAreaLevel) }}>
              {Math.round(crowdData.templeAreaLevel)}%
            </div>
            <div className="text-xs text-gray-400">Wait: {getWaitTime(crowdData.templeAreaLevel)} min</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">🅿️ Parking</div>
            <div className="text-2xl font-bold" style={{ color: getColorByCrowd(crowdData.parkingLevel) }}>
              {Math.round(crowdData.parkingLevel)}%
            </div>
            <div className="text-xs text-gray-400">Occupancy: {Math.round(crowdData.parkingLevel)}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">📊 Avg Crowd</div>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((crowdData.entranceLevel + crowdData.templeAreaLevel) / 2)}%
            </div>
            <div className="text-xs text-gray-400">Overall status</div>
          </div>
        </div>
      </div>

      <div className="p-3 bg-gray-100 border-t text-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-mono font-semibold">LIVE ACTIVITY FEED</span>
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {realtimeLog.map((log, idx) => (
            <div key={idx} className="font-mono text-gray-600">
              <span className="text-gray-400">[{log.time.toLocaleTimeString()}]</span>{' '}
              <span className={log.type === 'success' ? 'text-green-600' : log.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealtimeCrowdHeatmap;