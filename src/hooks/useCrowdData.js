// src/hooks/useCrowdData.js
import { useState, useEffect } from 'react';
import { crowdService, routingService } from '../services/firestore';

export const useCrowdData = (templeId) => {
  const [crowdData, setCrowdData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [routingMessages, setRoutingMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!templeId) return;

    setLoading(true);

    // Subscribe to real-time crowd data
    const unsubscribeCrowd = crowdService.subscribeToCrowdData(templeId, (data) => {
      setCrowdData(data);
      setLoading(false);
    });

    // Subscribe to routing messages
    const unsubscribeMessages = routingService.subscribeToRoutingMessages(templeId, (messages) => {
      setRoutingMessages(messages);
    });

    // Load historical data
    const loadHistory = async () => {
      const history = await crowdService.getHistoricalData(templeId, 2);
      setHistoricalData(history);
    };
    loadHistory();

    // Refresh history every 5 minutes
    const interval = setInterval(loadHistory, 300000);

    return () => {
      unsubscribeCrowd();
      unsubscribeMessages();
      clearInterval(interval);
    };
  }, [templeId]);

  return { crowdData, historicalData, routingMessages, loading };
};