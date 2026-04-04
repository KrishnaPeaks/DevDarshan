import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, ArcElement, Filler 
} from 'chart.js';
import { db } from '../../services/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { TEMPLE } from '../../utils/constants';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, MapPin, 
  TrendingUp, Users, Car, Building2, RefreshCw, Sparkles, 
  Brain, Calendar, Bell, ArrowRight, Star, Flame
} from 'lucide-react';
import DashboardService from '../../services/dashboardService';
import AIAutomationService from '../../services/aiAutomationService';
import RealtimeCrowdHeatmap from '../common/RealtimeCrowdHeatmap';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

const LiveCrowdDashboard = () => {
  const navigate = useNavigate();
  const [crowdData, setCrowdData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Real-time crowd listener
  useEffect(() => {
    const unsubscribeCrowd = onSnapshot(doc(db, 'crowdData', 'ambaji'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCrowdData(data);
        setLoading(false);
        refreshDashboardData();
      }
    });
    
    return () => unsubscribeCrowd();
  }, []);

  // Historical data for chart
  useEffect(() => {
    const fetchHistorical = async () => {
      try {
        const q = query(collection(db, 'crowdHistory'), where('temple', '==', 'ambaji'));
        const snapshot = await getDocs(q);
        const history = snapshot.docs.map(doc => ({ 
          ...doc.data(), 
          timestamp: doc.data().timestamp?.toDate() || new Date() 
        }));
        const sorted = history.sort((a, b) => a.timestamp - b.timestamp);
        setHistoricalData(sorted.slice(-20));
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };
    fetchHistorical();
    const interval = setInterval(fetchHistorical, 120000);
    return () => clearInterval(interval);
  }, []);

  const refreshDashboardData = async () => {
    setRefreshing(true);
    const data = await DashboardService.getCompleteDashboardData('ambaji');
    setDashboardData(data);
    setRefreshing(false);
  };

  const getCrowdStatus = (level) => {
    if (level <= 25) return { text: 'Very Low', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', action: 'Best Time!' };
    if (level <= 50) return { text: 'Moderate', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100', action: 'Good Time' };
    if (level <= 75) return { text: 'High', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100', action: 'Consider Waiting' };
    return { text: 'Very High', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', action: 'Avoid Now' };
  };

  const zones = [
    { name: 'Entrance', level: crowdData?.entranceLevel || 0, icon: Users, waitTime: Math.floor((crowdData?.entranceLevel || 0) * 0.6) },
    { name: 'Temple Area', level: crowdData?.templeAreaLevel || 0, icon: Building2, waitTime: Math.floor((crowdData?.templeAreaLevel || 0) * 0.8) },
    { name: 'Parking', level: crowdData?.parkingLevel || 0, icon: Car, waitTime: Math.floor((crowdData?.parkingLevel || 0) * 0.3) }
  ];

  const chartData = {
    labels: historicalData.map(d => d.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''),
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
    plugins: { legend: { position: 'bottom' } }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Ambaji Temple Dashboard...</p>
          <p className="text-sm text-orange-600 mt-2">🕉️ Jai Ambaji Mata</p>
        </div>
      </div>
    );
  }

  const status = getCrowdStatus(crowdData?.entranceLevel || 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">🕉️ {TEMPLE.name}</h1>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <MapPin className="w-4 h-4" /> {TEMPLE.location}
              <span className="mx-2">•</span>
              <Clock className="w-4 h-4" /> Real-time updates every 2 minutes
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
            >
              <Flame className="w-4 h-4" />
              {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
            </button>
            <button onClick={refreshDashboardData} disabled={refreshing} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Heatmap Section */}
        {showHeatmap && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <RealtimeCrowdHeatmap />
          </motion.div>
        )}

        {/* Main Crowd Status Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-6 mb-6 ${status.bg}`}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <status.icon className={`w-6 h-6 ${status.color}`} />
                <span className={`font-semibold ${status.color}`}>Current Status: {status.text}</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{crowdData?.entranceLevel}% Crowded</h2>
              <p className="text-gray-600 mt-1">{status.action} • Est. Wait: {Math.floor(crowdData?.entranceLevel * 0.6)} minutes</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Last updated</div>
              <div className="font-mono text-sm">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic AI Recommendations */}
        {dashboardData?.recommendations && dashboardData.recommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" /> AI Smart Recommendations
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dashboardData.recommendations.map((rec, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                    rec.type === 'festival' ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300' :
                    rec.type === 'immediate' ? 'bg-green-50 border-green-200' :
                    rec.type === 'prediction' ? 'bg-blue-50 border-blue-200' :
                    rec.type === 'best' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
                  } border`}
                  onClick={() => {
                    setSelectedRecommendation(rec);
                    if (rec.action === 'Go Now') toast.success('🚶 Head to the temple now!');
                    else if (rec.action === 'Book Slot') navigate('/book-darshan/ambaji');
                  }}
                >
                  <p className="text-gray-800 text-sm">{rec.text}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">⏱️ {rec.waitTime}</span>
                    <button className="text-orange-600 text-sm font-medium flex items-center gap-1">
                      {rec.action} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Time-Based Insight */}
        {dashboardData?.timeBasedInsight && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{dashboardData.timeBasedInsight.icon}</span>
              <div>
                <p className="font-semibold text-gray-900">{dashboardData.timeBasedInsight.period} • {dashboardData.timeBasedInsight.crowdExpectation}</p>
                <p className="text-sm text-gray-600">{dashboardData.timeBasedInsight.recommendation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Historical Trend Insight */}
        {dashboardData?.historicalTrend && (
          <div className="mb-6 bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.historicalTrend.average}%</div>
                  <div className="text-xs text-gray-500">7-Day Avg</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{dashboardData.historicalTrend.peak}%</div>
                  <div className="text-xs text-gray-500">Peak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{dashboardData.historicalTrend.offPeak}%</div>
                  <div className="text-xs text-gray-500">Off-Peak</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Trend: {dashboardData.historicalTrend.trend === 'increasing' ? '📈 Increasing' : dashboardData.historicalTrend.trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3 Zone Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {zones.map((zone, idx) => {
            const zoneStatus = getCrowdStatus(zone.level);
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white rounded-2xl shadow-lg p-5">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2"><zone.icon className="w-5 h-5 text-orange-600" /><h3 className="font-semibold">{zone.name}</h3></div>
                  <span className={`px-2 py-1 rounded-full text-xs ${zoneStatus.bg} ${zoneStatus.color}`}>{zoneStatus.text}</span>
                </div>
                <div className="text-3xl font-bold mb-2">{Math.round(zone.level)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-orange-500 h-2 rounded-full" style={{ width: `${zone.level}%` }}></div></div>
                <div className="flex justify-between mt-3 text-sm"><span className="text-gray-500">Est. Wait:</span><span className="font-semibold">{zone.waitTime} min</span></div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <h3 className="font-semibold mb-3">📊 Crowd Trend (Last 2 Hours)</h3>
            <div className="h-64"><Line data={chartData} options={chartOptions} /></div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <h3 className="font-semibold mb-3">🥧 Current Distribution</h3>
            <div className="h-64"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
          </div>
        </div>

        {/* Festival Alert */}
        {dashboardData?.festivalImpact?.active && (
          <div className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-3 flex-wrap">
              <Star className="w-8 h-8 animate-pulse" />
              <div>
                <p className="font-bold text-lg">{dashboardData.festivalImpact.name}</p>
                <p className="text-purple-100 text-sm">{dashboardData.festivalImpact.message}</p>
              </div>
              <button onClick={() => navigate('/book-darshan/ambaji')} className="ml-auto bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold text-sm">Book Special Entry</button>
            </div>
          </div>
        )}

        {/* Booking Insight */}
        {dashboardData?.bookingInsights && dashboardData.bookingInsights.leastBookedSlot && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3"><Calendar className="w-6 h-6 text-green-600" /><div><p className="font-semibold text-gray-900">Slot Availability Insight</p><p className="text-sm text-gray-600">Least booked slot: <span className="font-bold text-green-600">{dashboardData.bookingInsights.leastBookedSlot}</span> • {dashboardData.bookingInsights.totalBookings} bookings today</p></div></div>
              <button onClick={() => navigate('/book-darshan/ambaji')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1">Book Now <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => navigate('/book-darshan/ambaji')} className="bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-700 transition transform hover:scale-105">📅 Book Darshan</button>
          <button onClick={() => navigate('/my-bookings')} className="bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-700 transition">📋 My Bookings</button>
        </div>
      </div>
    </div>
  );
};

export default LiveCrowdDashboard;