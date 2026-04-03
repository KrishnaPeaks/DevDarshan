import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { QrCode, CheckCircle, XCircle, Loader, Scan, Copy } from 'lucide-react';

const QRScanner = ({ onScanComplete }) => {
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [qrInput, setQrInput] = useState('');

  const verifyQRCode = async (qrData) => {
    setVerifying(true);
    setScanResult(null);
    
    try {
      console.log('Verifying QR Data:', qrData);
      
      let bookingDoc = null;
      let bookingData = null;
      
      // Method 1: Try to find by exact QR data match
      const q1 = query(collection(db, 'bookings'), where('qrCodeData', '==', qrData));
      const snapshot1 = await getDocs(q1);
      
      if (!snapshot1.empty) {
        bookingDoc = snapshot1.docs[0];
        bookingData = bookingDoc.data();
        console.log('Found by QR data match:', bookingData);
      }
      
      // Method 2: Try to parse and search by token number
      if (!bookingDoc) {
        const parts = qrData.split('|');
        let tokenToSearch = qrData;
        
        if (parts.length >= 5) {
          tokenToSearch = parts[4];
        }
        
        console.log('Searching by token:', tokenToSearch);
        const q2 = query(collection(db, 'bookings'), where('tokenNumber', '==', tokenToSearch));
        const snapshot2 = await getDocs(q2);
        
        if (!snapshot2.empty) {
          bookingDoc = snapshot2.docs[0];
          bookingData = bookingDoc.data();
          console.log('Found by token match:', bookingData);
        }
      }
      
      // Method 3: Search by token number directly
      if (!bookingDoc) {
        const q3 = query(collection(db, 'bookings'), where('tokenNumber', '==', qrData));
        const snapshot3 = await getDocs(q3);
        
        if (!snapshot3.empty) {
          bookingDoc = snapshot3.docs[0];
          bookingData = bookingDoc.data();
          console.log('Found by direct token match:', bookingData);
        }
      }
      
      if (!bookingDoc) {
        setScanResult({ 
          success: false, 
          message: '❌ No booking found. Please check the QR data and try again.' 
        });
        toast.error('Booking not found');
        setVerifying(false);
        return;
      }
      
      // Check booking status
      if (bookingData.status === 'upcoming') {
        await updateDoc(doc(db, 'bookings', bookingDoc.id), {
          status: 'active',
          scannedAt: Timestamp.now(),
          scannedBy: 'admin',
          entryTime: new Date().toISOString()
        });
        
        setScanResult({
          success: true,
          message: '✅ Entry Granted! Welcome!',
          booking: {
            templeName: bookingData.templeName,
            tokenNumber: bookingData.tokenNumber,
            timeSlot: bookingData.timeSlot,
            date: bookingData.date,
            devoteeName: bookingData.userEmail,
            priority: bookingData.priority ? 'Yes' : 'No'
          }
        });
        
        toast.success(`Entry granted for ${bookingData.templeName}`);
        
        if (onScanComplete) {
          onScanComplete(bookingData);
        }
        
      } else if (bookingData.status === 'active') {
        setScanResult({ 
          success: false, 
          message: '⚠️ This ticket has already been scanned and is active' 
        });
        toast.error('Already scanned');
        
      } else if (bookingData.status === 'completed') {
        setScanResult({ 
          success: false, 
          message: '❌ This ticket has already been used/completed' 
        });
        toast.error('Already used');
        
      } else if (bookingData.status === 'cancelled') {
        setScanResult({ 
          success: false, 
          message: '❌ This booking has been cancelled' 
        });
        toast.error('Booking cancelled');
        
      } else {
        setScanResult({ 
          success: false, 
          message: `❌ Invalid booking status: ${bookingData.status}` 
        });
      }
      
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({ 
        success: false, 
        message: '❌ Error processing QR code: ' + error.message 
      });
      toast.error('Scan failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualEntry = async () => {
    if (!qrInput.trim()) {
      toast.error('Please enter QR code data');
      return;
    }
    await verifyQRCode(qrInput);
    setQrInput('');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setQrInput(text);
      toast.success('Pasted from clipboard');
    } catch (err) {
      toast.error('Could not read clipboard');
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setQrInput('');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <QrCode className="w-6 h-6 text-primary-600" />
        <h3 className="text-xl font-semibold text-gray-900">QR Code Entry Scanner</h3>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter QR Code Data or Token Number
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Paste QR code data or enter token number..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
          />
          <button
            onClick={handlePasteFromClipboard}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            title="Paste from clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleManualEntry}
            disabled={verifying || !qrInput}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {verifying ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4" />
                Verify
              </>
            )}
          </button>
        </div>
      </div>
      
      {scanResult && (
        <div className={`p-4 rounded-lg mb-6 ${
          scanResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {scanResult.success ? (
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-semibold ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {scanResult.message}
              </p>
              {scanResult.booking && (
                <div className="mt-3 space-y-1 text-sm">
                  <p><strong>📛 Temple:</strong> {scanResult.booking.templeName}</p>
                  <p><strong>🎫 Token:</strong> {scanResult.booking.tokenNumber}</p>
                  <p><strong>⏰ Time:</strong> {scanResult.booking.timeSlot}</p>
                  <p><strong>📅 Date:</strong> {scanResult.booking.date}</p>
                  <p><strong>👤 Devotee:</strong> {scanResult.booking.devoteeName}</p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={resetScanner}
            className="mt-3 text-sm text-primary-600 hover:text-primary-700"
          >
            Scan Another QR Code →
          </button>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-blue-800 mb-2">📱 How to test QR scanning:</p>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>Login as a regular user (not admin)</li>
          <li>Book a darshan for any temple</li>
          <li>Go to "My Bookings" page</li>
          <li>Click "Show QR Code" on your booking</li>
          <li>Click "Copy QR Data" button</li>
          <li>Paste the data here and click "Verify"</li>
          <li>OR just enter the Token Number shown on your booking</li>
        </ol>
      </div>
    </div>
  );
};

export default QRScanner;