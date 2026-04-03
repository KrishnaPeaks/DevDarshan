import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, Timestamp, collection } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import toast from 'react-hot-toast';

const Setup = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const setupDatabase = async () => {
    setLoading(true);
    setStatus('Starting database setup...');
    
    try {
      // Step 1: Create Admin User with VALID EMAIL
      setStatus('Creating admin user in Authentication...');
      const adminEmail = 'admin@devdarshan.com'; // VALID email format
      const adminPassword = 'admin123';
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        setStatus('✅ Admin user created in Authentication');
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          setStatus('ℹ️ Admin user already exists in Authentication');
        } else {
          throw error;
        }
      }
      
      // Step 2: Create Admin Document in Firestore
      setStatus('Creating admin document in Firestore...');
      await setDoc(doc(db, 'admins', 'admin@devdarshan.com'), {
        email: 'admin@devdarshan.com',
        role: 'super_admin',
        createdAt: Timestamp.now()
      });
      setStatus('✅ Admin document created with timestamp');
      
      // Step 3: Create Crowd Data for Temples
      setStatus('Creating crowd data for temples...');
      const temples = [
        { id: 'somnath', name: 'Somnath Temple' },
        { id: 'dwarka', name: 'Dwarkadhish Temple' },
        { id: 'ambaji', name: 'Ambaji Temple' },
        { id: 'pavagadh', name: 'Pavagadh Temple' }
      ];
      
      for (const temple of temples) {
        await setDoc(doc(db, 'crowdData', temple.id), {
          temple: temple.id,
          entranceLevel: 25,
          templeAreaLevel: 30,
          parkingLevel: 20,
          lastUpdated: Timestamp.now(),
          status: 'active'
        });
        setStatus(`✅ Crowd data created for ${temple.name}`);
      }
      
      // Step 4: Create Sample Routing Message
      setStatus('Creating routing messages...');
      const messages = [
        {
          temple: 'somnath',
          message: 'Main gate overloaded → Use East Gate for faster entry',
          priorityGroup: 'all',
          createdAt: Timestamp.now(),
          isActive: true
        },
        {
          temple: 'dwarka',
          message: 'Senior citizens → use Gate 3 for priority access',
          priorityGroup: 'senior',
          createdAt: Timestamp.now(),
          isActive: true
        }
      ];
      
      for (const message of messages) {
        await setDoc(doc(collection(db, 'routingMessages')), message);
        setStatus(`✅ Routing message created for ${message.temple}`);
      }
      
      setStatus('🎉 DATABASE SETUP COMPLETE!');
      toast.success('Database setup complete!');
      
    } catch (error) {
      console.error('Setup error:', error);
      setStatus(`❌ Error: ${error.message}`);
      toast.error('Setup failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="text-2xl font-bold text-gray-900">Firebase Database Setup</h1>
          <p className="text-gray-600 mt-2">
            Click the button below to automatically set up your Firestore database
          </p>
        </div>
        
        <button
          onClick={setupDatabase}
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 mb-6"
        >
          {loading ? 'Setting up...' : 'Setup Database'}
        </button>
        
        {status && (
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap text-gray-700">
              {status}
            </pre>
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>This will create:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Admin user: <strong>admin@devdarshan.com / admin123</strong></li>
            <li>Crowd data for all 4 temples</li>
            <li>Sample routing messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Setup;