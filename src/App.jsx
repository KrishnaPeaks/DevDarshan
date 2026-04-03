import React from 'react';
import { app } from './services/firebase';
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
                primary: '#4f46e5',
                secondary: '#fff',
              },
            },
          }}
        />
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/setup" element={<Setup />} />
          
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
          
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;