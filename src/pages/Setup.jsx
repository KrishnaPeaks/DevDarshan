import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

const Setup = () => {
  const [status, setStatus] = useState('');

  const setupDatabase = async () => {
    setStatus('Starting setup...');
    
    try {
      // 1. Create Admin User in Authentication
      setStatus('Creating admin user...');
      await createUserWithEmailAndPassword(auth, 'admin@123', 'admin123');
      setStatus('✅ Admin user created');
      
      // 2. Create Admin Document in Firestore
      setStatus('Creating admin document...');
      await setDoc(doc(db, 'admins', 'admin@123'), {
        email: 'admin@123',
        role: 'super_admin',
        createdAt: Timestamp.now()
      });
      setStatus('✅ Admin document created');
      
      // 3. Create Crowd Data for Temples
      const temples = ['somnath', 'dwarka', 'ambaji', 'pavagadh'];
      for (const temple of temples) {
        setStatus(`Creating crowd data for ${temple}...`);
        await setDoc(doc(db, 'crowdData', temple), {
          temple: temple,
          entranceLevel: 25,
          templeAreaLevel: 30,
          parkingLevel: 20,
          lastUpdated: Timestamp.now()
        });
      }
      setStatus('✅ All crowd data created');
      
      // 4. Create Sample Routing Message
      setStatus('Creating routing message...');
      await setDoc(doc(db, 'routingMessages', 'sample1'), {
        temple: 'somnath',
        message: 'Main gate is busy. Please use East Gate for faster entry.',
        priorityGroup: 'all',
        createdAt: Timestamp.now(),
        isActive: true
      });
      
      setStatus('🎉 SETUP COMPLETE! You can now close this page.');
      
    } catch (error) {
      console.error('Setup error:', error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">Firebase Setup</h1>
        <p className="text-gray-600 text-center mb-6">
          Click the button below to automatically set up your database
        </p>
        <button
          onClick={setupDatabase}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mb-4"
        >
          Setup Database
        </button>
        {status && (
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-sm font-mono whitespace-pre-wrap">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Setup;