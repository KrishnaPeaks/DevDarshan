// src/hooks/useBookings.js
import { useState, useEffect } from 'react';
import { bookingsService } from '../services/firestore';
import { useAuth } from '../contexts/AuthContext';

export const useBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time booking updates
    const unsubscribe = bookingsService.subscribeToUserBookings(user.uid, (userBookings) => {
      setBookings(userBookings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createBooking = async (bookingData) => {
    if (!user) throw new Error('User not authenticated');
    
    // Check for duplicate
    const isDuplicate = await bookingsService.checkDuplicateBooking(
      user.uid,
      bookingData.temple,
      bookingData.date,
      bookingData.timeSlot
    );
    
    if (isDuplicate) {
      throw new Error('You already have a booking for this slot');
    }
    
    return await bookingsService.createBooking({
      ...bookingData,
      userId: user.uid,
      userEmail: user.email
    });
  };

  const updateStatus = async (bookingId, status) => {
    await bookingsService.updateBookingStatus(bookingId, status);
  };

  return { bookings, loading, createBooking, updateStatus };
};