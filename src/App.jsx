import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import LandingPage from './components/devotee/LandingPage';
import TempleSelection from './components/devotee/TempleSelection';
import LiveCrowdDashboard from './components/devotee/LiveCrowdDashboard';
import VirtualQueueBooking from './components/devotee/VirtualQueueBooking';
import MyBookings from './components/devotee/MyBookings';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import Navbar from './components/common/Navbar';
import Setup from './pages/Setup';
import WalkInKiosk from './components/admin/WalkInKiosk';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#ea580c',
                secondary: '#fff',
              },
            },
          }}
        />
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/setup" element={<Setup />} />
          
          {/* Devotee Routes (Protected) */}
          <Route path="/temple-selection" element={
            <ProtectedRoute>
              <TempleSelection />
            </ProtectedRoute>
          } />
          
          <Route path="/live-dashboard/:templeId" element={
            <ProtectedRoute>
              <LiveCrowdDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/book-darshan/:templeId" element={
            <ProtectedRoute>
              <VirtualQueueBooking />
            </ProtectedRoute>
          } />
          
          <Route path="/my-bookings" element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes (Protected + Admin Only) */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Walk-in Kiosk for Temple Staff (Admin only) */}
          <Route path="/admin/walkin-kiosk" element={
            <ProtectedRoute adminOnly={true}>
              <WalkInKiosk />
            </ProtectedRoute>
          } />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;