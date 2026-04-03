import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  addDoc,
  onSnapshot
} from 'firebase/firestore';

// User Operations
export const createUser = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Booking Operations
export const createBooking = async (bookingData) => {
  try {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      bookedAt: Timestamp.now(),
      status: 'upcoming'
    });
    return { id: docRef.id, ...bookingData };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getUserBookings = async (userId) => {
  try {
    const q = query(
      collection(db, 'bookings'), 
      where('userId', '==', userId),
      orderBy('bookedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting bookings:', error);
    throw error;
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status: status,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

// Crowd Data Operations
export const getCrowdData = async (templeId) => {
  try {
    const crowdDoc = await getDoc(doc(db, 'crowdData', templeId));
    if (crowdDoc.exists()) {
      return { id: crowdDoc.id, ...crowdDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting crowd data:', error);
    throw error;
  }
};

export const updateCrowdData = async (templeId, crowdData) => {
  try {
    await setDoc(doc(db, 'crowdData', templeId), {
      ...crowdData,
      timestamp: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating crowd data:', error);
    throw error;
  }
};

// Real-time listeners
export const subscribeToCrowdData = (templeId, callback) => {
  return onSnapshot(doc(db, 'crowdData', templeId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

export const subscribeToRoutingMessages = (templeId, callback) => {
  const q = query(
    collection(db, 'routingMessages'),
    where('temple', '==', templeId),
    where('isActive', '==', true)
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};