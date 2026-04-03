// ONLY AMBAJI TEMPLE - Export as array for backward compatibility
export const TEMPLES = [
  {
    id: 'ambaji',
    name: 'Ambaji Temple',
    location: 'Banaskantha, Gujarat',
    description: 'One of the 51 Shakti Peethas, sacred pilgrimage site with 170-year-old Bhadarvi Poonam Mahamela tradition',
    image: 'https://images.unsplash.com/photo-1633534725943-b32ffc6c7c9f?w=400&h=300&fit=crop',
    timings: '6:00 AM - 8:00 PM',
    coordinates: { lat: 24.3324, lng: 72.8620 },
    history: '32.54 lakh devotees during Bhadarvi Poonam Mahamela 2024, ₹2.66 Cr donations'
  }
];

// Single temple export for convenience
export const TEMPLE = TEMPLES[0];

export const TIME_SLOTS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'
];

export const calculateWaitTime = (crowdLevel, priority = false) => {
  let baseWait = 30;
  if (crowdLevel <= 33) baseWait = 15;
  else if (crowdLevel <= 66) baseWait = 45;
  else baseWait = 90;
  return priority ? Math.floor(baseWait / 2) : baseWait;
};

export const generateTokenNumber = (templeId, date, count) => {
  const prefix = 'AMB';
  const dateStr = date.replace(/-/g, '');
  return `${prefix}${dateStr}${String(count + 1).padStart(4, '0')}`;
};