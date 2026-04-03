import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Users, Clock, MapPin, Shield, ArrowRight, TrendingUp, 
  Bell, Calendar, QrCode, IndianRupee, Menu, X, 
  ChevronRight, Star, Award, Globe, Heart, Phone, 
  Mail, Facebook, Twitter, Instagram, Youtube 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Preserved Images
const templeImages = {
  main: 'https://res.cloudinary.com/kmadmin/image/upload/v1725368328/kiomoi/Ambaji_temple_4871.jpg',
  entrance: 'https://tse2.mm.bing.net/th/id/OIP.e6sa1PwEZN__FXRvOd4OWAHaEK?pid=Api&P=0&h=180',
  gabbarHill: 'https://www.holidify.com/images/cmsuploads/square/kailash_20200428150417.jpg',
  festival: 'data:image/jpeg;base64,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',
  crowd: 'https://images.bhaskarassets.com/web2images/960/2018/10/12/9_1539289796.jpg'
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  const stats = [
    { value: "32.54L+", label: "Devotees (Bhadarvi Poonam 2024)", icon: Users, gradient: "from-orange-500 to-red-500", delay: 0.1 },
    { value: "170+", label: "Years of Tradition", icon: Calendar, gradient: "from-green-500 to-emerald-500", delay: 0.2 },
    { value: "₹2.66Cr", label: "Donations (2024)", icon: IndianRupee, gradient: "from-purple-500 to-pink-500", delay: 0.3 },
    { value: "51st", label: "Shakti Peetha", icon: Shield, gradient: "from-blue-500 to-cyan-500", delay: 0.4 }
  ];

  const features = [
    { icon: QrCode, title: "Smart QR Entry", description: "Scan and enter - No paper tickets needed", gradient: "from-blue-500 to-cyan-500" },
    { icon: Clock, title: "Real-time Crowd Updates", description: "Live crowd levels and wait times", gradient: "from-green-500 to-emerald-500" },
    { icon: TrendingUp, title: "AI Predictions", description: "Intelligent crowd forecasting", gradient: "from-purple-500 to-pink-500" },
    { icon: Shield, title: "Special Assistance", description: "Priority for elderly & disabled", gradient: "from-orange-500 to-red-500" }
  ];

  const galleryImages = [
    { src: templeImages.main, title: "Main Temple Sanctum", desc: "Divine abode of Maa Ambaji", delay: 0.1 },
    { src: templeImages.entrance, title: "Temple Gopuram", desc: "Majestic entrance with intricate carvings", delay: 0.2 },
    { src: templeImages.gabbarHill, title: "Gabbar Hill - Jyot", desc: "Sacred hilltop with eternal flame", delay: 0.3 },
    { src: templeImages.crowd, title: "Bhadarvi Poonam Mahamela", desc: "32.54 lakh devotees • 170+ year tradition", delay: 0.4 }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🕉️</span>
              <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Ambaji Temple
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-orange-600 transition">Home</a>
              <a href="#gallery" className="text-gray-700 hover:text-orange-600 transition">Gallery</a>
              <a href="#features" className="text-gray-700 hover:text-orange-600 transition">Features</a>
              <a href="#festival" className="text-gray-700 hover:text-orange-600 transition">Festival</a>
              <button onClick={() => user ? navigate('/temple-selection') : navigate('/login')} className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-5 py-2 rounded-full font-semibold hover:shadow-lg transition">
                Book Darshan
              </button>
            </div>
            
            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t py-4">
            <div className="flex flex-col space-y-3 px-4">
              <a href="#home" className="text-gray-700 hover:text-orange-600 py-2" onClick={() => setMobileMenuOpen(false)}>Home</a>
              <a href="#gallery" className="text-gray-700 hover:text-orange-600 py-2" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
              <a href="#features" className="text-gray-700 hover:text-orange-600 py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#festival" className="text-gray-700 hover:text-orange-600 py-2" onClick={() => setMobileMenuOpen(false)}>Festival</a>
              <button onClick={() => { user ? navigate('/temple-selection') : navigate('/login'); setMobileMenuOpen(false); }} className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-5 py-2 rounded-full font-semibold">
                Book Darshan
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <img src={templeImages.main} alt="Ambaji Temple" className="w-full h-full object-cover scale-105 animate-slow-zoom" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-orange-900/70"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Bell className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Shree Ambaji Temple - AI Powered Crowd Management</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg">🕉️ Shree Ambaji Temple</h1>
            <p className="text-xl md:text-2xl mb-4 font-light">One of the 51 Shakti Peethas</p>
            <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">Experience divine blessings with our intelligent queue management system - Serving 32.54 lakh devotees annually</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => user ? navigate('/temple-selection') : navigate('/login')} className="group bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all inline-flex items-center justify-center gap-2">
                {user ? 'Book Darshan Now' : 'Get Started'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <a href="#gallery" className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2">
                Explore Temple <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: stat.delay }} className="group relative overflow-hidden rounded-2xl shadow-lg">
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-90`}></div>
                <div className="relative p-6 text-center text-white">
                  <stat.icon className="w-10 h-10 mx-auto mb-3 opacity-90 group-hover:scale-110 transition-transform" />
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm opacity-90">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">🛕 Ambaji Temple Gallery</motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl text-gray-600">Experience the divine beauty of Shakti Peetha</motion.p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleryImages.map((img, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: img.delay }} className="group relative overflow-hidden rounded-2xl shadow-xl h-80 cursor-pointer">
                <img src={img.src} alt={img.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <h3 className="text-white font-bold text-xl">{img.title}</h3>
                  <p className="text-gray-200 text-sm mt-1">{img.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Smart Features for Devotees</motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl text-gray-600">Powered by AI for a seamless darshan experience</motion.p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="group bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-2xl transition-all hover:-translate-y-2">
                <div className={`inline-flex p-4 bg-gradient-to-r ${feature.gradient} rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Festival Section */}
      <section id="festival" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={templeImages.festival} alt="Bhadarvi Poonam Festival" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-900/95 to-red-900/95"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Star className="w-4 h-4 animate-pulse" />
              <span className="text-sm">170+ Year Old Tradition</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-4">🎉 Bhadarvi Poonam Mahamela</h2>
            <p className="text-xl mb-4">32.54 Lakh Devotees in 2025 • Next Festival: September 12-18, 2026</p>
            <p className="text-orange-200 mb-8 max-w-2xl mx-auto">Join the largest spiritual gathering at Ambaji Temple</p>
            <button onClick={() => user ? navigate('/book-darshan/ambaji') : navigate('/login')} className="bg-white text-orange-600 px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition transform hover:scale-105">
              Book Special Darshan
            </button>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to a hassle-free darshan</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Book Online", desc: "Select your preferred date and time slot", icon: Calendar },
              { step: "02", title: "Get QR Code", desc: "Receive unique QR code on email & SMS", icon: QrCode },
              { step: "03", title: "Scan & Enter", desc: "Scan QR code at gate for quick entry", icon: Shield }
            ].map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <item.icon className="w-10 h-10 text-orange-600" />
                </div>
                <div className="text-4xl font-bold text-orange-500 mb-2">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Walk-in Banner */}
      <div className="py-12 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-2">📱 No Smartphone? No Problem!</h3>
          <p className="text-blue-100 mb-4">Visit our Walk-in Kiosk at Gate 4 for instant QR code generation</p>
          <button onClick={() => navigate('/admin/walkin-kiosk')} className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition">
            Walk-in Entry Info
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🕉️</span>
                <span className="font-bold text-xl">Ambaji Temple</span>
              </div>
              <p className="text-gray-400 text-sm">One of the 51 Shakti Peethas, serving devotees for over 170 years.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#home" className="hover:text-orange-400">Home</a></li>
                <li><a href="#gallery" className="hover:text-orange-400">Gallery</a></li>
                <li><a href="#features" className="hover:text-orange-400">Features</a></li>
                <li><a href="#festival" className="hover:text-orange-400">Festival</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 1234567890</li>
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@ambajitemple.org</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Ambaji, Banaskantha, Gujarat</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Follow Us</h4>
              <div className="flex gap-4">
                <Facebook className="w-5 h-5 cursor-pointer hover:text-orange-400" />
                <Twitter className="w-5 h-5 cursor-pointer hover:text-orange-400" />
                <Instagram className="w-5 h-5 cursor-pointer hover:text-orange-400" />
                <Youtube className="w-5 h-5 cursor-pointer hover:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2026 Ambaji Temple. All rights reserved. | AI-Powered Smart Darshan System</p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;