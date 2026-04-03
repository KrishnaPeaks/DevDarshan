import { Timestamp } from 'firebase/firestore';

// Format date for display
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Format time for display
export const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate estimated wait time based on crowd level
export const calculateWaitTime = (crowdLevel, priority = false) => {
  let baseWait = 30; // minutes
  
  if (crowdLevel <= 33) baseWait = 15;
  else if (crowdLevel <= 66) baseWait = 45;
  else baseWait = 90;
  
  if (priority) baseWait = Math.floor(baseWait / 2);
  
  return baseWait;
};

// Get crowd status text and color
export const getCrowdStatus = (level) => {
  if (level <= 33) return { text: 'Low', color: 'green', message: 'Smooth darshan expected' };
  if (level <= 66) return { text: 'Medium', color: 'yellow', message: 'Moderate waiting time' };
  return { text: 'High', color: 'red', message: 'Heavy crowd, consider alternative timing' };
};

// Get status badge color for bookings - ADD THIS FUNCTION
export const getStatusBadgeColor = (status) => {
  switch(status) {
    case 'upcoming':
      return 'bg-yellow-100 text-yellow-800';
    case 'active':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Generate unique token number
export const generateTokenNumber = async (templeId, date, bookingCount) => {
  const prefix = templeId.substring(0, 3).toUpperCase();
  const dateStr = date.replace(/-/g, '');
  const sequence = String(bookingCount + 1).padStart(4, '0');
  return `${prefix}${dateStr}${sequence}`;
};

// Validate booking slot
export const isValidSlot = (date, timeSlot) => {
  const bookingDateTime = new Date(`${date} ${timeSlot}`);
  const now = new Date();
  const minAdvanceTime = 2 * 60 * 60 * 1000; // 2 hours minimum advance
  
  return bookingDateTime - now >= minAdvanceTime;
};

// Get available time slots
export const getAvailableTimeSlots = () => {
  const slots = [];
  for (let i = 6; i <= 20; i++) {
    slots.push(`${i}:00 AM`);
    if (i < 12) slots.push(`${i}:30 AM`);
    else if (i === 12) slots.push(`12:30 PM`);
    else {
      const hour = i - 12;
      slots.push(`${hour}:30 PM`);
    }
  }
  return slots;
};

// Get crowd color based on percentage
export const getCrowdColor = (percentage) => {
  if (percentage <= 33) return 'bg-green-500';
  if (percentage <= 66) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Get crowd level text
export const getCrowdLevel = (percentage) => {
  if (percentage <= 33) return 'Low';
  if (percentage <= 66) return 'Medium';
  return 'High';
};

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate password
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Get user initials
export const getInitials = (name) => {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};