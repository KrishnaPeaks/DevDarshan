import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Clock, MapPin, Shield, ArrowRight, TrendingUp, Bell, QrCode, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    { 
      icon: Users, 
      title: "Virtual Queue", 
      description: "Book your slot and avoid long queues",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      icon: Clock, 
      title: "Real-time Updates", 
      description: "Live crowd status and waiting times",
      color: "from-green-500 to-emerald-500"
    },
    { 
      icon: MapPin, 
      title: "Smart Routing", 
      description: "Intelligent route suggestions",
      color: "from-purple-500 to-pink-500"
    },
    { 
      icon: Shield, 
      title: "Safe Experience", 
      description: "Priority for elderly & disabled",
      color: "from-orange-500 to-red-500"
    }
  ];

  const stats = [
    { value: "50K+", label: "Devotees Served", icon: Users },
    { value: "98%", label: "Satisfaction Rate", icon: TrendingUp },
    { value: "<10min", label: "Avg Wait Time", icon: Clock },
    { value: "4", label: "Major Temples", icon: MapPin }
  ];

  const steps = [
    { step: "01", title: "Select Temple", desc: "Choose your preferred pilgrimage site", icon: MapPin },
    { step: "02", title: "Book Slot", desc: "Pick date & time with live crowd info", icon: Calendar },
    { step: "03", title: "Get QR Code", desc: "Receive digital token for entry", icon: QrCode },
    { step: "04", title: "Visit Temple", desc: "Scan QR code and enter smoothly", icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
            >
              <Bell className="w-4 h-4 animate-pulse" />
              <span className="text-sm">AI-Powered Crowd Management</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-primary-100 to-purple-200 bg-clip-text text-transparent">
              Dev Darshan
            </h1>
            <p className="text-xl md:text-2xl mb-4 font-light">
              Smart Crowd Management System for Pilgrimage Sites
            </p>
            <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Experience divine blessings without the stress of crowds using our intelligent queue management system
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => user ? navigate('/temple-selection') : navigate('/login')}
              className="group bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-2"
            >
              {user ? 'Book Darshan Now' : 'Get Started'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
        
        {/* Wave Effect */}
        <div className="absolute bottom-0 w-full">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                  fill="white" opacity="0.8"></path>
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
                  <stat.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The Challenge</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Millions of devotees face long queues and crowd congestion daily at pilgrimage sites
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: "😰", title: "Long Waiting Hours", desc: "Average wait time of 4-6 hours during peak seasons", color: "from-red-500 to-pink-500" },
              { emoji: "⚠️", title: "Safety Concerns", desc: "Overcrowding leads to safety risks and discomfort", color: "from-yellow-500 to-orange-500" },
              { emoji: "🔄", title: "Poor Information", desc: "Lack of real-time crowd updates and alternative routes", color: "from-blue-500 to-cyan-500" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="p-8 text-center relative">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{item.emoji}</div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Smart Features</h2>
            <p className="text-xl text-gray-600">Powered by cutting-edge AI technology</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className="inline-flex p-3 bg-gradient-to-r from-primary-100 to-purple-100 rounded-xl mb-4">
                    <feature.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to a hassle-free darshan</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative text-center"
              >
                <div className="inline-flex p-4 bg-primary-100 rounded-2xl mb-4">
                  <item.icon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-2xl font-bold text-primary-600 mb-2">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/3 -right-4">
                    <ArrowRight className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-purple-600 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">Ready for a Peaceful Darshan?</h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of devotees who've experienced hassle-free pilgrimage
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => user ? navigate('/temple-selection') : navigate('/login')}
              className="bg-white text-primary-600 px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-2"
            >
              Book Your Slot Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;