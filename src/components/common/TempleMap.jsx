import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TEMPLES } from '../../utils/constants';
import { MapPin, Clock, ChevronRight, Map as MapIcon, Grid3x3 } from 'lucide-react';
import TempleMapSimple from '../common/TempleMapSimple';

const TempleSelection = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');

  const handleTempleSelect = (templeId) => {
    navigate(`/live-dashboard/${templeId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
        >
          Choose Your Destination
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-600 max-w-2xl mx-auto mb-6"
        >
          Select from India's most revered pilgrimage sites
        </motion.p>
        
        {/* View Toggle Buttons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            Grid View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'map' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Map View
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {TEMPLES.map((temple, index) => (
            <motion.div
              key={temple.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
              onClick={() => handleTempleSelect(temple.id)}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={temple.image} 
                  alt={temple.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Temple';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{temple.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{temple.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    {temple.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {temple.timings}
                  </div>
                </div>
                
                <button className="w-full flex items-center justify-between px-4 py-2 bg-primary-600 text-white rounded-lg group-hover:bg-primary-700 transition-colors">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <TempleMapSimple onTempleSelect={handleTempleSelect} />
      )}
    </div>
  );
};

export default TempleSelection;