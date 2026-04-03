import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLES } from '../../utils/constants';

const TempleSelection = () => {
  const navigate = useNavigate();
  const temple = TEMPLES[0]; // Only Ambaji Temple

  // Auto-redirect to live dashboard since only one temple
  useEffect(() => {
    if (temple) {
      navigate(`/live-dashboard/${temple.id}`);
    }
  }, [temple, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading Ambaji Temple...</p>
        <p className="text-sm text-orange-600 mt-2">🕉️ Jai Ambaji Mata</p>
      </div>
    </div>
  );
};

export default TempleSelection;