import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp, updateDoc, getDoc } from 'firebase/firestore';
import { TEMPLES } from '../../utils/constants';
import { toast } from 'react-hot-toast';
import { 
  Send, Trash2, MessageSquare, Users, Clock, 
  Zap, Calendar, Bell, Eye, EyeOff, Copy, Sparkles, 
  TrendingUp, Shield, Map, Navigation, RefreshCw
} from 'lucide-react';

const RoutingControl = () => {
  const [selectedTemple, setSelectedTemple] = useState(TEMPLES[0]?.id || '');
  const [message, setMessage] = useState('');
  const [priorityGroup, setPriorityGroup] = useState('all');
  const [routingMessages, setRoutingMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedTemple) {
      loadRoutingMessages();
    }
  }, [selectedTemple]);

  const loadRoutingMessages = async () => {
    setLoading(true);
    try {
      const messagesRef = collection(db, 'routingMessages');
      const q = query(messagesRef, where('temple', '==', selectedTemple));
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      const sortedMessages = messages.sort((a, b) => b.createdAt - a.createdAt);
      setRoutingMessages(sortedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const addRoutingMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const newMessage = {
        temple: selectedTemple,
        message: message,
        priorityGroup: priorityGroup,
        createdAt: Timestamp.now(),
        isActive: true,
        type: 'manual'
      };
      
      await addDoc(collection(db, 'routingMessages'), newMessage);
      toast.success('Routing message added successfully!');
      setMessage('');
      await loadRoutingMessages();
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to add routing message');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Smart Routing Generation with better error handling
  const generateSmartRouting = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Analyzing crowd data and generating smart routing messages...');
    
    try {
      // Get current crowd data for the selected temple
      const crowdRef = doc(db, 'crowdData', selectedTemple);
      const crowdDoc = await getDoc(crowdRef);
      
      if (!crowdDoc.exists()) {
        toast.dismiss(loadingToast);
        toast.error('No crowd data found for this temple. Please update crowd levels first in Crowd Control tab.');
        setLoading(false);
        return;
      }
      
      const crowdData = crowdDoc.data();
      const entranceLevel = crowdData.entranceLevel || 0;
      const templeAreaLevel = crowdData.templeAreaLevel || 0;
      const parkingLevel = crowdData.parkingLevel || 0;
      
      console.log('Crowd Data:', { entranceLevel, templeAreaLevel, parkingLevel });
      
      const messages = [];
      const now = Timestamp.now();
      
      // Generate messages based on entrance crowd
      if (entranceLevel > 75) {
        messages.push({
          temple: selectedTemple,
          message: `🚨 CRITICAL: Main entrance at ${entranceLevel}% capacity! Use East Gate for immediate entry.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'high'
        });
      } else if (entranceLevel > 60) {
        messages.push({
          temple: selectedTemple,
          message: `⚠️ Main entrance crowded (${entranceLevel}%). Recommended: Use North Gate for faster entry. Expected wait: 30-40 min.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'medium'
        });
      } else if (entranceLevel > 40) {
        messages.push({
          temple: selectedTemple,
          message: `📊 Moderate crowd at main entrance (${entranceLevel}%). Expected wait time: 20-25 minutes.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'medium'
        });
      } else if (entranceLevel < 30) {
        messages.push({
          temple: selectedTemple,
          message: `🌟 GREAT NEWS! Current crowd is LOW (${entranceLevel}%). Best time for peaceful darshan! Expected wait: 10-15 min.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'low'
        });
      }
      
      // Generate messages based on temple area crowd
      if (templeAreaLevel > 80) {
        messages.push({
          temple: selectedTemple,
          message: `🛕 Temple area heavily crowded (${templeAreaLevel}%). Expected wait time: 60+ minutes. Consider visiting prasadam hall first.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'high'
        });
      } else if (templeAreaLevel > 60) {
        messages.push({
          temple: selectedTemple,
          message: `📊 Temple area moderately crowded (${templeAreaLevel}%). Expected wait time: 30-45 minutes.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'medium'
        });
      } else if (templeAreaLevel > 40 && templeAreaLevel <= 60) {
        messages.push({
          temple: selectedTemple,
          message: `✅ Temple area crowd is manageable (${templeAreaLevel}%). Smooth darshan expected.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'low'
        });
      }
      
      // Generate messages based on parking
      if (parkingLevel > 85) {
        messages.push({
          temple: selectedTemple,
          message: `🅿️ PARKING FULL (${parkingLevel}%)! Use overflow parking at Location B (500m ahead). Free shuttle available every 5 min.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'high'
        });
      } else if (parkingLevel > 60) {
        messages.push({
          temple: selectedTemple,
          message: `🅿️ Parking at ${parkingLevel}% capacity. Limited spots available. Recommend carpooling.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'medium'
        });
      } else if (parkingLevel < 30) {
        messages.push({
          temple: selectedTemple,
          message: `🅿️ Plenty of parking available (${parkingLevel}% occupied). Easy access to temple.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'low'
        });
      }
      
      // Time-based suggestions
      const currentHour = new Date().getHours();
      if (currentHour >= 12 && currentHour <= 15) {
        messages.push({
          temple: selectedTemple,
          message: `☀️ Mid-day heat! Carry water and umbrellas. Queue lengths are typically shorter during this time.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'low'
        });
      }
      
      if (currentHour >= 18 && currentHour <= 20) {
        messages.push({
          temple: selectedTemple,
          message: `🌙 Evening aarti starting soon! Evening crowds are moderate. Beautiful experience guaranteed.`,
          priorityGroup: 'all',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'low'
        });
      }
      
      // Senior citizen specific message if crowded
      if (entranceLevel > 50 || templeAreaLevel > 50) {
        messages.push({
          temple: selectedTemple,
          message: `👴 Senior citizens and differently-abled: Priority queue available at Gate 2. Please approach security for assistance.`,
          priorityGroup: 'senior',
          createdAt: now,
          isActive: true,
          type: 'smart-generated',
          severity: 'medium'
        });
      }
      
      // Save all generated messages
      let savedCount = 0;
      for (const messageData of messages) {
        await addDoc(collection(db, 'routingMessages'), messageData);
        savedCount++;
      }
      
      toast.dismiss(loadingToast);
      
      if (savedCount > 0) {
        toast.success(`✨ ${savedCount} smart routing messages generated based on current crowd levels!`);
      } else {
        toast.info('Crowd levels are normal. No additional routing messages needed at this time.');
      }
      
      // Reload messages
      await loadRoutingMessages();
      
    } catch (error) {
      console.error('Smart routing error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to generate smart routing messages: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMessageStatus = async (messageId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'routingMessages', messageId), {
        isActive: !currentStatus,
        updatedAt: Timestamp.now()
      });
      toast.success(`Message ${!currentStatus ? 'activated' : 'deactivated'}`);
      await loadRoutingMessages();
    } catch (error) {
      toast.error('Failed to update message');
    }
  };

  const deleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteDoc(doc(db, 'routingMessages', messageId));
        toast.success('Message deleted');
        await loadRoutingMessages();
      } catch (error) {
        toast.error('Failed to delete message');
      }
    }
  };

  const duplicateMessage = async (msg) => {
    try {
      const newMessage = {
        temple: selectedTemple,
        message: msg.message,
        priorityGroup: msg.priorityGroup,
        createdAt: Timestamp.now(),
        isActive: true,
        type: 'duplicate'
      };
      
      await addDoc(collection(db, 'routingMessages'), newMessage);
      toast.success('Message duplicated successfully!');
      await loadRoutingMessages();
    } catch (error) {
      toast.error('Failed to duplicate message');
    }
  };

  const refreshMessages = async () => {
    setRefreshing(true);
    await loadRoutingMessages();
    setRefreshing(false);
    toast.success('Messages refreshed');
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'senior': return 'bg-blue-100 text-blue-800';
      case 'disabled': return 'bg-purple-100 text-purple-800';
      case 'vip': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'senior': return 'Senior Citizens';
      case 'disabled': return 'Differently-Abled';
      case 'vip': return 'VIP';
      default: return 'All Devotees';
    }
  };

  const getSeverityBadge = (severity) => {
    switch(severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Just now';
    return date.toLocaleString();
  };

  const messageSuggestions = [
    { text: "Main gate overloaded → Use East Gate for faster entry", icon: Map },
    { text: "Senior citizens → use accessible route at Gate 3", icon: Users },
    { text: "Parking full → Use designated overflow parking 500m ahead", icon: Navigation },
    { text: "Expected wait time: 45 minutes at main entrance", icon: Clock },
    { text: "Heavy crowd at sanctum → Please maintain queue discipline", icon: Shield }
  ];

  const activeMessages = routingMessages.filter(m => m.isActive === true);
  const inactiveMessages = routingMessages.filter(m => m.isActive === false);

  // Get current temple name for display
  const currentTemple = TEMPLES.find(t => t.id === selectedTemple);

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Routing Message Control</h2>
          <p className="text-sm text-gray-500">Current Temple: {currentTemple?.name || selectedTemple}</p>
        </div>
        <button
          onClick={refreshMessages}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Smart Routing Button - AI Powered */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Smart Routing Generator</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Automatically generate intelligent routing messages based on real-time crowd levels at entrance, temple area, and parking.
        </p>
        <button
          onClick={generateSmartRouting}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          {loading ? 'Generating Smart Messages...' : '✨ Generate Smart Routing Messages'}
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Analyzes crowd levels and creates targeted routing suggestions
        </p>
      </div>

      {/* Quick Message Templates */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Quick Message Templates
        </h3>
        <div className="flex flex-wrap gap-2">
          {messageSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setMessage(suggestion.text)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <suggestion.icon className="w-3 h-3" />
              {suggestion.text.length > 50 ? suggestion.text.substring(0, 50) + '...' : suggestion.text}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Message */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Manual Routing Message</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Temple</label>
          <select
            value={selectedTemple}
            onChange={(e) => setSelectedTemple(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {TEMPLES.map(temple => (
              <option key={temple.id} value={temple.id}>{temple.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Routing Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Enter routing instruction for devotees..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
          <select
            value={priorityGroup}
            onChange={(e) => setPriorityGroup(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Devotees</option>
            <option value="senior">Senior Citizens (60+)</option>
            <option value="disabled">Differently-Abled</option>
            <option value="vip">VIP</option>
          </select>
        </div>

        <button
          onClick={addRoutingMessage}
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          {loading ? 'Publishing...' : 'Publish Message'}
        </button>
      </div>

      {/* Active Messages List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-green-600" />
            Active Messages ({activeMessages.length})
          </h3>
        </div>
        
        {activeMessages.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No active messages</p>
            <p className="text-sm text-gray-400 mt-1">Click "Generate Smart Routing" to create AI-powered messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeMessages.map((msg) => (
              <div key={msg.id} className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                    {msg.type === 'smart-generated' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Generated
                      </span>
                    )}
                    {msg.severity && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityBadge(msg.severity)}`}>
                        {msg.severity.toUpperCase()}
                      </span>
                    )}
                    {msg.priorityGroup !== 'all' && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityBadge(msg.priorityGroup)}`}>
                        {getPriorityLabel(msg.priorityGroup)}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-800">{msg.message}</p>
                </div>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => toggleMessageStatus(msg.id, msg.isActive)}
                    className="text-yellow-600 hover:text-yellow-700 p-1"
                    title="Deactivate"
                  >
                    <EyeOff className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => duplicateMessage(msg)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="Duplicate"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Messages List */}
      {inactiveMessages.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-gray-500" />
            Inactive Messages ({inactiveMessages.length})
          </h3>
          <div className="space-y-3">
            {inactiveMessages.map((msg) => (
              <div key={msg.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">Inactive</span>
                    <span className="text-xs text-gray-400">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="text-gray-600">{msg.message}</p>
                </div>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => toggleMessageStatus(msg.id, msg.isActive)}
                    className="text-green-600 hover:text-green-700 p-1"
                    title="Activate"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutingControl;