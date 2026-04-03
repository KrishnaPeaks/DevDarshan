import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { db } from '../../services/firebase';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { TEMPLE } from '../../utils/constants';
import { Activity, AlertTriangle, CheckCircle, Clock, MapPin, TrendingUp, Users, Car, Building2, Brain } from 'lucide-react';
import { getPrediction } from '../../data/ambajiHistoricalData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

const LiveCrowdDashboard = () => {
  const navigate = useNavigate();
  const [crowdData, setCrowdData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [routingMessages, setRoutingMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiPrediction, setAiPrediction] = useState(null);

  useEffect(() => {
    // Subscribe to crowd data for Ambaji Temple
    const unsubscribeCrowd = onSnapshot(doc(db, 'crowdData', 'ambaji'), (docSnap) => {
      if (docSnap.exists()) { 
        setCrowdData(docSnap.data()); 
        setLoading(false); 
      }
    });
    
    // Subscribe to routing messages COLLECTION (not a single document)
    const messagesQuery = query(
      collection(db, 'routingMessages'),
      where('temple', '==', 'ambaji'),
      where('isActive', '==', true)
    );
    
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoutingMessages(messages);
    });
    
    // Generate AI prediction
    const now = new Date();
    const hour = now.getHours();
    const timeSlot = `${hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
    const prediction = getPrediction(now.toISOString().split('T')[0], timeSlot);
    setAiPrediction(prediction);
    
    // Simulate historical data for chart
    const interval = setInterval(() => {
      setHistoricalData(prev => {
        const newData = [...prev, { entranceLevel: crowdData?.entranceLevel || 35, timestamp: new Date() }];
        return newData.slice(-20);
      });
    }, 30000);
    
    return () => { 
      unsubscribeCrowd(); 
      unsubscribeMessages(); 
      clearInterval(interval); 
    };
  }, []);

  const getCrowdStatus = (level) => {
    if (level <= 33) return { text: 'Smooth Flow', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
    if (level <= 66) return { text: 'Moderate Crowd', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Heavy Congestion', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' };
  };

  const zones = [
    { name: 'Entrance', level: crowdData?.entranceLevel || 0, icon: Users, waitTime: Math.floor((crowdData?.entranceLevel || 0) * 0.6) },
    { name: 'Temple Area', level: crowdData?.templeAreaLevel || 0, icon: Building2, waitTime: Math.floor((crowdData?.templeAreaLevel || 0) * 0.8) },
    { name: 'Parking', level: crowdData?.parkingLevel || 0, icon: Car, waitTime: Math.floor((crowdData?.parkingLevel || 0) * 0.3) }
  ];

  const chartData = {
    labels: historicalData.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [{ 
      label: 'Crowd Level', 
      data: historicalData.map(d => d.entranceLevel), 
      borderColor: 'rgb(234, 88, 12)', 
      backgroundColor: 'rgba(234, 88, 12, 0.1)', 
      tension: 0.4, 
      fill: true 
    }]
  };

  const doughnutData = { 
    labels: ['Entrance', 'Temple Area', 'Parking'], 
    datasets: [{ 
      data: [crowdData?.entranceLevel || 0, crowdData?.templeAreaLevel || 0, crowdData?.parkingLevel || 0], 
      backgroundColor: ['#ea580c', '#f97316', '#dc2626'] 
    }] 
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Crowd Level (%)' } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Ambaji Temple Data...</p>
          <p className="text-sm text-orange-600 mt-2">🕉️ Jai Ambaji Mata</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">🕉️ {TEMPLE.name}</h1>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{TEMPLE.location}</span>
            <span className="mx-2">•</span>
            <Clock className="w-4 h-4" />
            <span>Live Updates Every 30 Seconds</span>
          </div>
        </div>

        {/* AI Prediction Card */}
        {aiPrediction && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-6 h-6" />
              <span className="text-sm font-mono bg-white/20 px-2 py-1 rounded">AI POWERED PREDICTION</span>
            </div>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <p className="text-lg">
                  {aiPrediction.isFestival ? '🎉 Festival Time! Extreme Crowds Expected' : 
                   aiPrediction.crowdPercentage > 70 ? '🔴 Very Crowded' : 
                   aiPrediction.crowdPercentage > 40 ? '🟡 Moderate Crowd' : '🟢 Best Time to Visit'}
                </p>
                <p className="text-purple-200 mt-1">Expected Wait: {aiPrediction.waitTime} minutes</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{aiPrediction.crowdPercentage}%</div>
                <div className="text-sm opacity-75">Predicted Crowd</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Crowd Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {zones.map((zone, idx) => {
            const status = getCrowdStatus(zone.level);
            const StatusIcon = status.icon;
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-xl"><zone.icon className="w-6 h-6 text-orange-600" /></div>
                    <h3 className="text-lg font-semibold">{zone.name}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-sm ${status.bg} ${status.color}`}>
                    <StatusIcon className="w-3 h-3 inline mr-1" /> {status.text}
                  </span>
                </div>
                <div className="mb-4">
                  <div className="text-3xl font-bold">{Math.round(zone.level)}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-orange-500 h-2 rounded-full transition-all duration-300" style={{ width: `${zone.level}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Est. Wait Time:</span>
                  <span className="font-semibold">{zone.waitTime} min</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Crowd Trends (Last Hour)</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Current Distribution</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-80">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Routing Messages */}
        {routingMessages.length > 0 && (
          <div className="mb-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-blue-700">{routingMessages[0]?.message}</p>
            </div>
          </div>
        )}

        {/* Festival Info */}
        <div className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎉</span>
            <h3 className="text-lg font-semibold text-orange-800">Upcoming Festival: Bhadarvi Poonam Mahamela</h3>
          </div>
          <p className="text-orange-700">September 12-18, 2025 • 170+ Year Tradition • Expected 50+ Lakh Devotees</p>
          <p className="text-sm text-orange-600 mt-2">Book your darshan in advance to avoid long queues!</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => navigate('/book-darshan/ambaji')} className="bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-700 transition transform hover:scale-105">
            📅 Book Darshan
          </button>
          <button onClick={() => navigate('/my-bookings')} className="bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-700 transition">
            📋 My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveCrowdDashboard;