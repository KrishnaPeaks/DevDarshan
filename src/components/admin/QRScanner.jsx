import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { QrCode, CheckCircle, XCircle, Loader } from 'lucide-react';

const QRScanner = ({ onScanComplete }) => {
  const [scanning, setScanning] = useState(true);
  const [scannedData, setScannedData] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Simulate QR scan (since we can't use actual camera in development easily)
  // In production, you would use html5-qrcode or react-qr-reader
  const simulateScan = () => {
    const mockQRCode = prompt("Enter QR Code Data (for testing):\nFormat: userId|templeId|date|timeSlot|tokenNumber|timestamp|random");
    if (mockQRCode) {
      handleScan(mockQRCode);
    }
  };

  const handleScan = async (decodedText) => {
    setVerifying(true);
    try {
      // Parse QR data
      const parts = decodedText.split('|');
      if (parts.length < 5) {
        toast.error('Invalid QR Code format');
        setVerifying(false);
        return;
      }
      
      const [userId, templeId, date, timeSlot, tokenNumber] = parts;
      
      // Find booking in Firestore
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('tokenNumber', '==', tokenNumber));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const bookingDoc = querySnapshot.docs[0];
        const bookingData = bookingDoc.data();
        
        if (bookingData.status === 'upcoming') {
          await updateDoc(doc(db, 'bookings', bookingDoc.id), {
            status: 'active',
            scannedAt: new Date().toISOString(),
            scannedBy: 'admin'
          });
          
          setScannedData({
            success: true,
            message: `✅ Entry Granted for ${bookingData.templeName}`,
            booking: bookingData
          });
          
          toast.success(`Entry granted for ${bookingData.templeName}`);
          onScanComplete?.(bookingData);
        } else if (bookingData.status === 'active') {
          setScannedData({
            success: false,
            message: '⚠️ This ticket has already been scanned and is active'
          });
          toast.error('Already scanned and active');
        } else if (bookingData.status === 'completed') {
          setScannedData({
            success: false,
            message: '❌ This ticket has already been used'
          });
          toast.error('Already used');
        } else {
          setScannedData({
            success: false,
            message: 'Invalid booking status'
          });
          toast.error('Invalid booking status');
        }
      } else {
        setScannedData({
          success: false,
          message: '❌ Invalid QR Code - No booking found'
        });
        toast.error('Invalid QR Code');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScannedData({
        success: false,
        message: 'Error processing QR code'
      });
      toast.error('Error processing QR code');
    } finally {
      setVerifying(false);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setScanning(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <QrCode className="w-6 h-6 text-primary-600" />
          QR Code Scanner
        </h3>
        {!scannedData && (
          <button
            onClick={simulateScan}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Simulate Scan
          </button>
        )}
      </div>

      {!scannedData ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="w-32 h-32 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
              {verifying ? (
                <Loader className="w-12 h-12 text-primary-600 animate-spin" />
              ) : (
                <QrCode className="w-16 h-16 text-gray-400" />
              )}
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            {verifying ? 'Verifying QR Code...' : 'Ready to scan QR Code'}
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-800 font-medium mb-2">📱 How to test:</p>
            <p className="text-xs text-yellow-700">
              1. Go to My Bookings as a user<br/>
              2. Click "Show QR Code" on a booking<br/>
              3. Copy the QR code data<br/>
              4. Click "Simulate Scan" and paste the data<br/>
              <br/>
              <strong>Format:</strong> userId|templeId|date|timeSlot|tokenNumber|timestamp|random
            </p>
          </div>
        </div>
      ) : (
        <div className={`p-6 rounded-lg text-center ${
          scannedData.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="mb-4">
            {scannedData.success ? (
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            ) : (
              <XCircle className="w-16 h-16 text-red-600 mx-auto" />
            )}
          </div>
          
          <h4 className={`text-lg font-semibold mb-2 ${
            scannedData.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {scannedData.success ? 'Access Granted!' : 'Access Denied'}
          </h4>
          
          <p className="text-gray-700 mb-4">{scannedData.message}</p>
          
          {scannedData.booking && (
            <div className="bg-white rounded-lg p-4 mb-4 text-left">
              <p className="text-sm font-medium text-gray-900">Booking Details:</p>
              <p className="text-xs text-gray-600">Temple: {scannedData.booking.templeName}</p>
              <p className="text-xs text-gray-600">Token: {scannedData.booking.tokenNumber}</p>
              <p className="text-xs text-gray-600">Time: {scannedData.booking.timeSlot}</p>
              <p className="text-xs text-gray-600">Date: {scannedData.booking.date}</p>
            </div>
          )}
          
          <button
            onClick={resetScanner}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Scan Another QR Code
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;