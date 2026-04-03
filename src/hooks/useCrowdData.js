import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';

export const useCrowdData = (templeId) => {
  const [crowdData, setCrowdData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [routingMessages, setRoutingMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!templeId) return;

    setLoading(true);
    
    const unsubscribeCrowd = onSnapshot(doc(db, 'crowdData', templeId), (doc) => {
      if (doc.exists()) {
        setCrowdData({ id: doc.id, ...doc.data() });
        setLoading(false);
      }
    });

    // Fetch historical data without orderBy to avoid index
    const fetchHistoricalData = async () => {
      try {
        const q = query(
          collection(db, 'crowdHistory'),
          where('temple', '==', templeId)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data());
        // Sort manually
        const sorted = data.sort((a, b) => {
          const dateA = a.timestamp?.toDate?.() || new Date(0);
          const dateB = b.timestamp?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
        setHistoricalData(sorted.slice(0, 20));
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };
    
    fetchHistoricalData();

    const unsubscribeMessages = onSnapshot(
      query(collection(db, 'routingMessages'), where('temple', '==', templeId), where('isActive', '==', true)),
      (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRoutingMessages(messages);
      }
    );

    return () => {
      unsubscribeCrowd();
      unsubscribeMessages();
    };
  }, [templeId]);

  return { crowdData, historicalData, routingMessages, loading };
};