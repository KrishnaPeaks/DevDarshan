import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, User, LogOut, Calendar, LayoutDashboard, Home, Shield, Users, QrCode } from 'lucide-react';

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsOpen(false);
  };

  // Different links for different user types
  const userLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/temple-selection', label: 'Temples', icon: LayoutDashboard },
    { path: '/my-bookings', label: 'My Bookings', icon: Calendar }
  ];

  const adminLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/admin', label: 'Admin Panel', icon: Shield },
    { path: '/admin/walkin-kiosk', label: '🚪 Walk-in Kiosk', icon: Users }
  ];

  const navLinks = user ? (isAdmin ? adminLinks : userLinks) : [{ path: '/', label: 'Home', icon: Home }];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🕉️</span>
              <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Dev Darshan
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <span className="flex items-center gap-1">
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </span>
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {isAdmin ? 'Admin' : user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-base font-medium w-full"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 bg-primary-600 text-white px-3 py-2 rounded-md text-base font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;