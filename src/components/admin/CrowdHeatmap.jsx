import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { TEMPLES } from '../../utils/constants';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const CrowdHeatmap = () => {
  const [crowdData, setCrowdData] = useState({});
  const center = [22.2587, 71.1924];

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
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, []);

  const getCrowdColor = (level) => {
    if (level <= 33) return '#22c55e';
    if (level <= 66) return '#eab308';
    return '#ef4444';
  };

  const getCrowdRadius = (level) => {
    return 20 + (level / 100) * 40;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Crowd Heatmap</h3>
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: '500px', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {TEMPLES.map((temple) => {
          const data = crowdData[temple.id] || {};
          const entranceLevel = data.entranceLevel || 0;
          const templeLevel = data.templeAreaLevel || 0;
          const parkingLevel = data.parkingLevel || 0;
          
          return (
            <div key={temple.id}>
              {/* Entrance Marker */}
              <CircleMarker
                center={[temple.coordinates.lat + 0.01, temple.coordinates.lng]}
                radius={getCrowdRadius(entranceLevel)}
                fillColor={getCrowdColor(entranceLevel)}
                color="#ffffff"
                weight={2}
                fillOpacity={0.7}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-bold">{temple.name} - Entrance</h4>
                    <p>Crowd: {Math.round(entranceLevel)}%</p>
                    <p>Status: {entranceLevel <= 33 ? 'Low' : entranceLevel <= 66 ? 'Medium' : 'High'}</p>
                  </div>
                </Popup>
                <Tooltip>{temple.name} Entrance: {Math.round(entranceLevel)}%</Tooltip>
              </CircleMarker>
              
              {/* Temple Area Marker */}
              <CircleMarker
                center={[temple.coordinates.lat, temple.coordinates.lng]}
                radius={getCrowdRadius(templeLevel)}
                fillColor={getCrowdColor(templeLevel)}
                color="#ffffff"
                weight={2}
                fillOpacity={0.7}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-bold">{temple.name} - Temple Area</h4>
                    <p>Crowd: {Math.round(templeLevel)}%</p>
                    <p>Status: {templeLevel <= 33 ? 'Low' : templeLevel <= 66 ? 'Medium' : 'High'}</p>
                  </div>
                </Popup>
                <Tooltip>{temple.name} Temple: {Math.round(templeLevel)}%</Tooltip>
              </CircleMarker>
              
              {/* Parking Marker */}
              <CircleMarker
                center={[temple.coordinates.lat - 0.01, temple.coordinates.lng]}
                radius={getCrowdRadius(parkingLevel)}
                fillColor={getCrowdColor(parkingLevel)}
                color="#ffffff"
                weight={2}
                fillOpacity={0.7}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-bold">{temple.name} - Parking</h4>
                    <p>Occupancy: {Math.round(parkingLevel)}%</p>
                    <p>Status: {parkingLevel <= 33 ? 'Available' : parkingLevel <= 66 ? 'Limited' : 'Full'}</p>
                  </div>
                </Popup>
                <Tooltip>{temple.name} Parking: {Math.round(parkingLevel)}%</Tooltip>
              </CircleMarker>
            </div>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span className="text-sm">Low (0-33%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span className="text-sm">Medium (34-66%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span className="text-sm">High (67-100%)</span>
        </div>
      </div>
    </div>
  );
};

export default CrowdHeatmap;