import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TEMPLES } from '../../utils/constants';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TempleMapSimple = ({ onTempleSelect }) => {
  const mapRef = useRef(null);
  const [crowdData, setCrowdData] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const center = [22.2587, 71.1924]; // Center of Gujarat

  // Initialize map
  useEffect(() => {
    if (!mapRef.current && document.getElementById('temple-map')) {
      mapRef.current = L.map('temple-map').setView(center, 7);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Subscribe to crowd data
  useEffect(() => {
    const unsubscribes = TEMPLES.map(temple => {
      return onSnapshot(doc(db, 'crowdData', temple.id), (doc) => {
        if (doc.exists()) {
          setCrowdData(prev => ({
            ...prev,
            [temple.id]: doc.data()
          }));
        }
      });
    });

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('Geolocation error:', error)
      );
    }

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, []);

  // Add markers when map is ready or data changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers (keep only tile layer)
    mapRef.current.eachLayer((layer) => {
      if (layer !== mapRef.current._layers[Object.keys(mapRef.current._layers)[0]]) {
        mapRef.current.removeLayer(layer);
      }
    });

    // Add temple markers
    TEMPLES.forEach((temple) => {
      const crowdLevel = crowdData[temple.id]?.entranceLevel || 0;
      const color = crowdLevel <= 33 ? '#22c55e' : crowdLevel <= 66 ? '#eab308' : '#ef4444';
      const radius = 15 + (crowdLevel / 100) * 25;

      const circle = L.circleMarker([temple.coordinates.lat, temple.coordinates.lng], {
        radius: radius,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.7
      }).addTo(mapRef.current);

      circle.bindPopup(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">${temple.name}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${temple.location}</p>
          <div style="margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span>Entrance Crowd:</span>
              <span style="font-weight: bold; color: ${color}">
                ${Math.round(crowdLevel)}%
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px;">
              <span>Status:</span>
              <span>
                ${crowdLevel <= 33 ? '🟢 Low' : crowdLevel <= 66 ? '🟡 Medium' : '🔴 High'}
              </span>
            </div>
          </div>
          <button 
            onclick="window.selectTemple('${temple.id}')"
            style="margin-top: 12px; width: 100%; background-color: #4f46e5; color: white; border: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; cursor: pointer;"
          >
            View Details
          </button>
        </div>
      `);

      circle.bindTooltip(`${temple.name}<br/>${Math.round(crowdLevel)}% Crowded`);
    });

    // Add user location marker
    if (userLocation) {
      L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 3,
        fillOpacity: 0.8
      }).addTo(mapRef.current)
        .bindPopup('<strong>Your Location</strong><br/>You are here')
        .bindTooltip('You are here');
    }

  }, [crowdData, userLocation]);

  // Expose selectTemple to window for popup button
  useEffect(() => {
    window.selectTemple = (templeId) => {
      onTempleSelect?.(templeId);
    };
    return () => {
      delete window.selectTemple;
    };
  }, [onTempleSelect]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div id="temple-map" style={{ height: '500px', width: '100%' }}></div>
      
      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Low Crowd (0-33%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span>Medium Crowd (34-66%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>High Crowd (67-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
            <span>Your Location</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempleMapSimple;