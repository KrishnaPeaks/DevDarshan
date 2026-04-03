export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getCrowdLevel = (percentage) => {
  if (percentage <= 33) return 'LOW';
  if (percentage <= 66) return 'MEDIUM';
  return 'HIGH';
};

export const getCrowdColor = (percentage) => {
  if (percentage <= 33) return 'bg-green-500';
  if (percentage <= 66) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const getStatusBadgeColor = (status) => {
  switch(status) {
    case 'upcoming': return 'bg-yellow-100 text-yellow-800';
    case 'active': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};