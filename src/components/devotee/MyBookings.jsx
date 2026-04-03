import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { bookingsService } from '../../services/firestore';
import QRCode from 'qrcode.react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, QrCode, ChevronDown, ChevronUp, Download, Copy, Ticket } from 'lucide-react';
import { formatDate, getStatusBadgeColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const unsubscribe = bookingsService.subscribeToUserBookings(user.uid, (userBookings) => {
      setBookings(userBookings);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingsService.updateBookingStatus(bookingId, 'cancelled');
        toast.success('Booking cancelled successfully');
      } catch (error) {
        toast.error('Failed to cancel booking');
      }
    }
  };

  const downloadQRCode = (tokenNumber) => {
    const canvas = document.getElementById(`qr-canvas-${tokenNumber}`);
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `dev-darshan-${tokenNumber}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success('QR Code downloaded!');
    }
  };

  const copyQRData = (qrData) => {
    navigator.clipboard.writeText(qrData);
    toast.success('QR data copied to clipboard!');
  };

  const copyTokenNumber = (tokenNumber) => {
    navigator.clipboard.writeText(tokenNumber);
    toast.success('Token number copied! You can use this in admin scanner.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-600 mt-2">View and manage your darshan bookings</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
          <p className="text-gray-600 mb-6">You haven't made any darshan bookings yet</p>
          <button
            onClick={() => window.location.href = '/temple-selection'}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Book Your First Darshan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{booking.templeName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Ticket className="w-4 h-4 text-gray-400" />
                          <p className="text-sm font-mono text-gray-600">Token: {booking.tokenNumber}</p>
                          <button
                            onClick={() => copyTokenNumber(booking.tokenNumber)}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            <Copy className="w-3 h-3 inline" /> Copy
                          </button>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(booking.status)}`}>
                        {booking.status?.toUpperCase() || 'UPCOMING'}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">{formatDate(booking.date)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm">{booking.timeSlot}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm">Est. Wait: {booking.estimatedWaitTime} min</span>
                      </div>
                      {booking.priority && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm">Priority Queue Access</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {booking.status === 'upcoming' && (
                        <>
                          <button
                            onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                          >
                            {expandedId === booking.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {expandedId === booking.id ? 'Hide QR Code' : 'Show QR Code'}
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Cancel Booking
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="md:text-right">
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <QrCode className="w-4 h-4" />
                      <span>Entry Pass</span>
                    </div>
                  </div>
                </div>

                {expandedId === booking.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-gray-200"
                  >
                    <div className="flex flex-col items-center">
                      {/* QR Code */}
                      <div className="bg-white p-4 rounded-xl shadow-md">
                        <QRCode
                          id={`qr-canvas-${booking.tokenNumber}`}
                          value={booking.qrCodeData}
                          size={200}
                          level="H"
                          includeMargin={true}
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>
                      
                      {/* Token Number Display */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-xs text-blue-600 mb-1">Entry Token Number</p>
                        <p className="text-lg font-mono font-bold text-blue-800">{booking.tokenNumber}</p>
                      </div>
                      
                      {/* QR Data Display */}
                      <div className="mt-2 p-3 bg-gray-100 rounded-lg max-w-full overflow-x-auto">
                        <p className="text-xs font-mono text-gray-600 break-all">
                          <strong>Encoded Data:</strong> {booking.qrCodeData}
                        </p>
                      </div>
                      
                      <div className="flex gap-3 mt-4 flex-wrap justify-center">
                        <button
                          onClick={() => downloadQRCode(booking.tokenNumber)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                        >
                          <Download className="w-4 h-4" />
                          Download QR Code
                        </button>
                        <button
                          onClick={() => copyQRData(booking.qrCodeData)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                        >
                          <Copy className="w-4 h-4" />
                          Copy QR Data
                        </button>
                      </div>
                      
                      <p className="text-center text-xs text-gray-500 mt-3">
                        Scan this QR code at the temple entrance for entry
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;