export const TEMPLES = [
  {
    id: 'somnath',
    name: 'Somnath Temple',
    location: 'Prabhas Patan, Gujarat',
    description: 'First among the 12 Jyotirlingas, a sacred pilgrimage site',
    image: 'https://images.unsplash.com/photo-1633534725943-b32ffc6c7c9f?w=400&h=300&fit=crop',
    timings: '6:00 AM - 9:00 PM',
    coordinates: { lat: 20.8880, lng: 70.4012 }
  },
  {
    id: 'dwarka',
    name: 'Dwarkadhish Temple',
    location: 'Dwarka, Gujarat',
    description: 'Ancient temple dedicated to Lord Krishna',
    image: 'https://images.unsplash.com/photo-1633534725943-b32ffc6c7c9f?w=400&h=300&fit=crop',
    timings: '6:30 AM - 9:00 PM',
    coordinates: { lat: 22.2442, lng: 68.9685 }
  },
  {
    id: 'ambaji',
    name: 'Ambaji Temple',
    location: 'Banaskantha, Gujarat',
    description: 'Famous Shakti Peetha temple',
    image: 'https://images.unsplash.com/photo-1633534725943-b32ffc6c7c9f?w=400&h=300&fit=crop',
    timings: '6:00 AM - 8:00 PM',
    coordinates: { lat: 24.3324, lng: 72.8620 }
  },
  {
    id: 'pavagadh',
    name: 'Pavagadh Temple',
    location: 'Panchmahal, Gujarat',
    description: 'Kali Mata Temple on a hilltop',
    image: 'https://images.unsplash.com/photo-1633534725943-b32ffc6c7c9f?w=400&h=300&fit=crop',
    timings: '5:00 AM - 7:00 PM',
    coordinates: { lat: 22.4681, lng: 73.5405 }
  }
];

export const TIME_SLOTS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'
];

export const calculateWaitTime = (crowdLevel, priority = false) => {
  let baseWait = 30;
  if (crowdLevel <= 33) baseWait = 15;
  else if (crowdLevel <= 66) baseWait = 45;
  else baseWait = 90;
  return priority ? Math.floor(baseWait / 2) : baseWait;
};

export const generateTokenNumber = (templeId, date, count) => {
  const prefix = templeId.substring(0, 3).toUpperCase();
  const dateStr = date.replace(/-/g, '');
  return `${prefix}${dateStr}${String(count + 1).padStart(4, '0')}`;
};