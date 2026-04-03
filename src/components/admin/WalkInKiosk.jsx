import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode.react';
import { Printer, Download, CheckCircle, UserPlus, Phone, Users, QrCode as QrIcon } from 'lucide-react';

const WalkInKiosk = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', devoteesCount: 1, specialAssistance: false });
  const [loading, setLoading] = useState(false);
  const [generatedQR, setGeneratedQR] = useState(null);
  const [step, setStep] = useState('form');

  const generateTokenNumber = () => {
    const date = new Date();
    const prefix = 'WALK';
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${dateStr}${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) { toast.error('Please enter devotee name'); return; }
    setLoading(true);
    try {
      const tokenNumber = generateTokenNumber();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const qrData = `WALKIN|${formData.name}|${formData.phone || 'N/A'}|${tokenNumber}|${timestamp}|${randomStr}`;
      
      await addDoc(collection(db, 'walkInEntries'), {
        name: formData.name, phone: formData.phone || '', devoteesCount: formData.devoteesCount,
        specialAssistance: formData.specialAssistance, tokenNumber: tokenNumber, qrCodeData: qrData,
        entryTime: Timestamp.now(), status: 'pending', type: 'walk-in', issuedBy: 'kiosk-staff'
      });
      
      setGeneratedQR({ qrData, tokenNumber, name: formData.name });
      setStep('qr');
      toast.success(`QR Code generated for ${formData.name}`);
      setFormData({ name: '', phone: '', devoteesCount: 1, specialAssistance: false });
    } catch (error) { toast.error('Failed to generate QR'); }
    finally { setLoading(false); }
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Ambaji Temple - Entry Pass</title>
      <style>body{text-align:center;padding:20px;font-family:Arial;}.pass{border:2px solid #ea580c;border-radius:12px;padding:20px;max-width:300px;margin:auto;}.header{color:#ea580c;font-size:20px;}.token{font-size:24px;font-weight:bold;margin:10px 0;}</style>
      </head><body><div class="pass"><div class="header">🕉️ AMBAJI TEMPLE</div><div class="header">WALK-IN ENTRY PASS</div><div class="token">Token: ${generatedQR?.tokenNumber}</div><div>${document.getElementById('walkin-qr-canvas')?.outerHTML || 'QR Code'}</div><div><strong>Devotee:</strong> ${generatedQR?.name}</div><div><strong>Gate:</strong> Gate 4 (Walk-in Counter)</div><div class="footer">Valid for today | Show this slip at entry</div></div></body></html>
    `);
    printWindow.print();
    toast.success('Printing slip...');
  };

  if (step === 'qr' && generatedQR) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-green-100 border border-green-300 rounded-xl p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-green-800">QR Code Generated!</h2>
          <div className="bg-white p-4 rounded-lg my-4 inline-block"><QRCode id="walkin-qr-canvas" value={generatedQR.qrData} size={180} level="H" /></div>
          <div className="bg-white rounded-lg p-3 mb-4"><p className="text-sm text-gray-500">Token Number</p><p className="text-2xl font-bold">{generatedQR.tokenNumber}</p><p className="text-sm text-gray-500 mt-2">Devotee</p><p className="font-semibold">{generatedQR.name}</p></div>
          <button onClick={printQR} className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 mb-3"><Printer className="w-5 h-5" /> Print Entry Slip</button>
          <button onClick={() => { setStep('form'); setGeneratedQR(null); }} className="w-full bg-green-600 text-white py-2 rounded-lg">+ New Walk-in Entry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white text-center mb-6"><h1 className="text-2xl font-bold">🚪 Walk-in Entry Kiosk</h1><p className="text-orange-100 text-sm">Gate 4 - Staff Use Only | Ambaji Temple</p></div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1"><UserPlus className="w-4 h-4 inline mr-1" /> Devotee Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border rounded-lg text-lg" placeholder="Enter full name" autoFocus /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1"><Phone className="w-4 h-4 inline mr-1" /> Phone Number (Optional)</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 border rounded-lg" placeholder="For SMS notification" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1"><Users className="w-4 h-4 inline mr-1" /> Number of Devotees</label><select value={formData.devoteesCount} onChange={(e) => setFormData({...formData, devoteesCount: parseInt(e.target.value)})} className="w-full px-4 py-3 border rounded-lg">{[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1} {i+1 === 1 ? 'person' : 'people'}</option>)}</select></div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><input type="checkbox" id="specialAssistance" checked={formData.specialAssistance} onChange={(e) => setFormData({...formData, specialAssistance: e.target.checked})} className="w-5 h-5" /><label htmlFor="specialAssistance" className="text-gray-700">🧓 Special Assistance Required</label></div>
          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><QrIcon className="w-5 h-5" /> Generate QR & Print Slip</>}</button>
        </form>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700"><strong>📢 Instructions for Staff:</strong><ul className="mt-1 space-y-1"><li>• Fill devotee's name as they say</li><li>• Click "Generate QR & Print Slip"</li><li>• Give the printed slip to devotee</li><li>• Direct them to entry gate</li></ul></div>
      </div>
    </div>
  );
};

export default WalkInKiosk;