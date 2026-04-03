export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

export const getCrowdColor = (percentage) => {
  if (percentage <= 33) return 'bg-green-500';
  if (percentage <= 66) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const getCrowdStatus = (percentage) => {
  if (percentage <= 33) return { text: 'Low', color: 'green', icon: '🟢' };
  if (percentage <= 66) return { text: 'Medium', color: 'yellow', icon: '🟡' };
  return { text: 'High', color: 'red', icon: '🔴' };
};