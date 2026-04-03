import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Map, QrCode, Settings, LayoutDashboard, LogOut } from 'lucide-react';
import CrowdControlPanel from './CrowdControlPanel';
import BookingManagement from './BookingManagement';
import RoutingControl from './RoutingControl';
import QRScanner from './QRScanner';
import AdvancedCrowdControls from './AdvancedCrowdControls';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('crowd');
  const [selectedTemple, setSelectedTemple] = useState('somnath');

  const tabs = [
    { id: 'crowd', name: 'Crowd Control', icon: Users, color: 'bg-blue-500' },
    { id: 'scanner', name: 'QR Scanner', icon: QrCode, color: 'bg-green-500' },
    { id: 'bookings', name: 'Booking Management', icon: Calendar, color: 'bg-yellow-500' },
    { id: 'routing', name: 'Routing Control', icon: Map, color: 'bg-purple-500' },
    { id: 'advanced', name: 'Advanced Controls', icon: Settings, color: 'bg-red-500' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    toast.success('Logged out successfully');
    navigate('/admin-login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-2 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Dev Darshan - Crowd Management System</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'crowd' && <CrowdControlPanel />}
        {activeTab === 'scanner' && <QRScanner onScanComplete={() => {}} />}
        {activeTab === 'bookings' && <BookingManagement />}
        {activeTab === 'routing' && <RoutingControl />}
        {activeTab === 'advanced' && <AdvancedCrowdControls selectedTemple={selectedTemple} />}
      </div>
    </div>
  );
};

export default AdminDashboard;