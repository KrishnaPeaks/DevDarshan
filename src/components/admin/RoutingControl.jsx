import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { TEMPLES } from '../../utils/constants';
import { toast } from 'react-hot-toast';
import { Send, Trash2, MessageSquare, Users, Clock } from 'lucide-react';

const RoutingControl = () => {
  const [selectedTemple, setSelectedTemple] = useState(TEMPLES[0]?.id || '');
  const [message, setMessage] = useState('');
  const [priorityGroup, setPriorityGroup] = useState('all');
  const [routingMessages, setRoutingMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedTemple) {
      loadRoutingMessages();
    }
  }, [selectedTemple]);

  const loadRoutingMessages = async () => {
    try {
      const messagesRef = collection(db, 'routingMessages');
      const q = query(
        messagesRef, 
        where('temple', '==', selectedTemple),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setRoutingMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const addRoutingMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'routingMessages'), {
        temple: selectedTemple,
        message: message,
        priorityGroup: priorityGroup,
        createdAt: Timestamp.now(),
        isActive: true
      });
      toast.success('Routing message added successfully!');
      setMessage('');
      loadRoutingMessages();
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to add routing message');
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await deleteDoc(doc(db, 'routingMessages', messageId));
      toast.success('Message deleted');
      loadRoutingMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const messageSuggestions = [
    "Main gate overloaded → Use East Gate",
    "Senior citizens → use accessible route",
    "Parking full → Use designated overflow parking",
    "Expected wait time: 45 minutes",
    "Heavy crowd at sanctum → Please maintain queue discipline",
    "Special darshan arrangement for VIPs",
    "Weather alert: Carry umbrella",
    "Prasadam counters are less crowded now"
  ];

  return (
    <div className="space-y-6">
      {/* Add Message Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Intelligent Routing Control</h2>

        <div className="mb-6">
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

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Routing Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            <option value="senior">Senior Citizens</option>
            <option value="disabled">Disabled Persons</option>
            <option value="vip">VIP</option>
          </select>
        </div>

        <button
          onClick={addRoutingMessage}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Publishing...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Publish Routing Message
            </>
          )}
        </button>
      </div>

      {/* Message Suggestions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          Quick Message Templates
        </h3>
        <div className="flex flex-wrap gap-2">
          {messageSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setMessage(suggestion)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Active Messages */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          Active Routing Messages
        </h3>
        
        {routingMessages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active messages for this temple</p>
        ) : (
          <div className="space-y-3">
            {routingMessages.map((msg) => (
              <div key={msg.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-gray-800">{msg.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">
                      Target: {msg.priorityGroup === 'all' ? 'All Devotees' : msg.priorityGroup}
                    </span>
                    <span className="text-xs text-gray-500">
                      Posted: {msg.createdAt?.toLocaleTimeString?.() || new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteMessage(msg.id)}
                  className="text-red-600 hover:text-red-700 ml-3"
                  title="Delete message"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutingControl;