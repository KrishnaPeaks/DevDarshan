import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
} from 'chart.js';
import { useCrowdData } from '../../hooks/useCrowdData';
import { TEMPLES } from '../../utils/constants';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  TrendingUp,
  Users,
  Car,
  Building2,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
);

const LiveCrowdDashboard = () => {
  const { templeId } = useParams();
  const navigate = useNavigate();
  const { crowdData, historicalData, routingMessages, loading } = useCrowdData(templeId);
  const [temple, setTemple] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const selectedTemple = TEMPLES.find(t => t.id === templeId);
    if (selectedTemple) {
      setTemple(selectedTemple);
    }
  }, [templeId]);

  const getCrowdColor = (level) => {
    if (level <= 33) return 'text-green-600 bg-green-100';
    if (level <= 66) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCrowdBgColor = (level) => {
    if (level <= 33) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (level <= 66) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  const getCrowdStatus = (level) => {
    if (level <= 33) return { text: 'Smooth Flow', icon: CheckCircle, color: 'text-green-600' };
    if (level <= 66) return { text: 'Moderate Crowd', icon: AlertTriangle, color: 'text-yellow-600' };
    return { text: 'Heavy Congestion', icon: AlertTriangle, color: 'text-red-600' };
  };

  const crowdZones = [
    { 
      name: 'Entrance', 
      key: 'entranceLevel',
      level: crowdData?.entranceLevel || 0, 
      icon: Users,
      description: 'Queue at main gate',
      waitTime: Math.floor((crowdData?.entranceLevel || 0) * 0.6)
    },
    { 
      name: 'Main Temple', 
      key: 'templeAreaLevel',
      level: crowdData?.templeAreaLevel || 0, 
      icon: Building2,
      description: 'Sanctum area',
      waitTime: Math.floor((crowdData?.templeAreaLevel || 0) * 0.8)
    },
    { 
      name: 'Parking', 
      key: 'parkingLevel',
      level: crowdData?.parkingLevel || 0, 
      icon: Car,
      description: 'Vehicle parking',
      waitTime: Math.floor((crowdData?.parkingLevel || 0) * 0.3)
    }
  ];

  const chartData = {
    labels: historicalData.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'Entrance Crowd',
        data: historicalData.map(d => d.entranceLevel),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)'
      },
      {
        label: 'Temple Area',
        data: historicalData.map(d => d.templeAreaLevel),
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(234, 179, 8)'
      }
    ]
  };

  const doughnutData = {
    labels: ['Entrance', 'Temple Area', 'Parking'],
    datasets: [{
      data: [crowdData?.entranceLevel || 0, crowdData?.templeAreaLevel || 0, crowdData?.parkingLevel || 0],
      backgroundColor: ['#3B82F6', '#EAB308', '#EF4444'],
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 10 }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        max: 100, 
        title: { display: true, text: 'Crowd Level (%)', font: { weight: 'bold' } },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: { grid: { display: false } }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
    cutout: '60%'
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading crowd data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{temple?.name}</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{temple?.location}</span>
                <span className="mx-2">•</span>
                <Clock className="w-4 h-4" />
                <span>Last updated: {crowdData?.lastUpdated ? new Date(crowdData.lastUpdated).toLocaleTimeString() : 'Just now'}</span>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Routing Messages */}
        <AnimatePresence>
          {routingMessages && routingMessages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="inline-flex p-2 bg-blue-100 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-blue-800">Smart Routing Suggestion</p>
                    <p className="text-sm text-blue-700 mt-1">{routingMessages[0]?.message}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crowd Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {crowdZones.map((zone, index) => {
            const status = getCrowdStatus(zone.level);
            const StatusIcon = status.icon;
            return (
              <motion.div
                key={zone.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className={`absolute top-0 left-0 w-full h-1 ${getCrowdBgColor(zone.level)}`}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex p-2 bg-gray-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <zone.icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getCrowdColor(zone.level)}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{status.text}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-3xl font-bold text-gray-900">{zone.level}%</span>
                      <span className="text-sm text-gray-500">Capacity</span>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${zone.level}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getCrowdBgColor(zone.level)}`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">{zone.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Est. Wait Time:</span>
                      <span className="font-semibold text-gray-900">{zone.waitTime} min</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Crowd Trends</h3>
                <p className="text-sm text-gray-500 mt-1">Last 2 hours analysis</p>
              </div>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Current Distribution</h3>
                <p className="text-sm text-gray-500 mt-1">Real-time capacity breakdown</p>
              </div>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-80">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </motion.div>
        </div>

        {/* Recommendations Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="inline-flex p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Best Time to Visit</p>
                <p className="text-sm text-gray-600">Early morning (6-8 AM) or late evening (7-9 PM)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="inline-flex p-2 bg-blue-100 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Expected Wait Time</p>
                <p className="text-sm text-gray-600">Approximately 30-45 minutes for darshan</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/book-darshan/${templeId}`)}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Book Darshan Now
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/my-bookings')}
            className="bg-white text-gray-700 px-8 py-3 rounded-xl font-semibold border-2 border-gray-300 hover:border-primary-500 hover:text-primary-600 transition-all duration-300"
          >
            View My Bookings
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default LiveCrowdDashboard;