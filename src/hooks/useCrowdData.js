import { useState, useEffect } from 'react';
import { subscribeToCrowdData, subscribeToRoutingMessages } from '../services/firestore';

export const useCrowdData = (templeId) => {
  const [crowdData, setCrowdData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [routingMessages, setRoutingMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!templeId) return;

    setLoading(true);
    
    // Subscribe to real-time crowd data
    const unsubscribeCrowd = subscribeToCrowdData(templeId, (data) => {
      setCrowdData(data);
      // Add to historical data
      setHistoricalData(prev => {
        const newData = [...prev, { ...data, timestamp: new Date() }];
        // Keep last 20 entries
        return newData.slice(-20);
      });
      setLoading(false);
    });

    // Subscribe to routing messages
    const unsubscribeMessages = subscribeToRoutingMessages(templeId, (messages) => {
      setRoutingMessages(messages);
    });

    return () => {
      unsubscribeCrowd();
      unsubscribeMessages();
    };
  }, [templeId]);

  return { crowdData, historicalData, routingMessages, loading };
};

export const useBookings = (userId) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchBookings = async () => {
      try {
        const { getUserBookings } = await import('../services/firestore');
        const userBookings = await getUserBookings(userId);
        setBookings(userBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId]);

  return { bookings, loading, setBookings };
};