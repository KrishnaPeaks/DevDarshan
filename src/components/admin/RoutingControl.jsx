import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp, updateDoc, orderBy } from 'firebase/firestore';
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

  // Load messages when component mounts or temple changes
  useEffect(() => {
    if (selectedTemple) {
      loadRoutingMessages();
    }
  }, [selectedTemple]);

  const loadRoutingMessages = async () => {
    setLoading(true);
    try {
      console.log('Loading messages for temple:', selectedTemple);
      
      const messagesRef = collection(db, 'routingMessages');
      const q = query(
        messagesRef, 
        where('temple', '==', selectedTemple)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Found messages:', querySnapshot.size);
      
      const messages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        };
      });
      
      // Sort by createdAt descending (newest first)
      const sortedMessages = messages.sort((a, b) => b.createdAt - a.createdAt);
      setRoutingMessages(sortedMessages);
      
      console.log('Active messages:', sortedMessages.filter(m => m.isActive === true).length);
      console.log('Inactive messages:', sortedMessages.filter(m => m.isActive === false).length);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages: ' + error.message);
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
      
      console.log('Adding message:', newMessage);
      const docRef = await addDoc(collection(db, 'routingMessages'), newMessage);
      console.log('Message added with ID:', docRef.id);
      
      toast.success('Routing message added successfully!');
      setMessage(''); // Clear the message input
      await loadRoutingMessages(); // Reload the list
      
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to add routing message: ' + error.message);
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
      console.error('Error updating message:', error);
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
        console.error('Error deleting message:', error);
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
      console.error('Error duplicating message:', error);
      toast.error('Failed to duplicate message');
    }
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

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Routing Message Control</h2>
        <button
          onClick={loadRoutingMessages}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Routing Message</h3>

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
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-500 mt-2">Loading messages...</p>
          </div>
        ) : activeMessages.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No active messages</p>
            <p className="text-sm text-gray-400 mt-1">Create a new message above to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeMessages.map((msg) => (
              <div key={msg.id} className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
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