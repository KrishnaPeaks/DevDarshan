// scripts/setupDatabase.js
// Run with: node scripts/setupDatabase.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');

// Your Firebase config - REPLACE with your actual config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDO0MFu90dtP6ZDMA5IH8mr4UaMjE5Ckrc",  // Replace with YOUR actual API key
  authDomain: "devdarshan-d55b1.firebaseapp.com",     // Replace with YOUR auth domain
  projectId: "devdarshan-d55b1",                      // Replace with YOUR project ID
  storageBucket: "devdarshan-d55b1.appspot.com",      // Replace with YOUR storage bucket
  messagingSenderId: "123456789012",                  // Replace with YOUR sender ID
  appId: "1:123456789012:web:abcdef123456"            // Replace with YOUR app ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupDatabase() {
  console.log('🔥 Setting up Firestore database...');
  
  try {
    // 1. Create admin user
    await setDoc(doc(db, 'admins', 'admin@123'), {
      email: 'admin@123',
      role: 'super_admin',
      createdAt: Timestamp.now()
    });
    console.log('✅ Admin user created');

    // 2. Initialize crowd data for temples
    const temples = [
      { id: 'somnath', name: 'Somnath Temple', location: 'Gujarat' },
      { id: 'dwarkadhish', name: 'Dwarkadhish Temple', location: 'Gujarat' },
      { id: 'ambaji', name: 'Ambaji Temple', location: 'Gujarat' },
      { id: 'pavagadh', name: 'Pavagadh Temple', location: 'Gujarat' }
    ];

    for (const temple of temples) {
      await setDoc(doc(db, 'crowdData', temple.id), {
        temple: temple.id,
        entranceLevel: Math.floor(Math.random() * 100),
        templeAreaLevel: Math.floor(Math.random() * 100),
        parkingLevel: Math.floor(Math.random() * 100),
        lastUpdated: Timestamp.now(),
        status: 'active'
      });
      console.log(`✅ Crowd data created for ${temple.name}`);
    }

    // 3. Create sample routing messages
    const messages = [
      {
        temple: 'somnath',
        message: 'Main gate overloaded → Use East Gate for faster entry',
        priorityGroup: 'all',
        createdAt: Timestamp.now(),
        isActive: true
      },
      {
        temple: 'dwarkadhish',
        message: 'Senior citizens → use Gate 3 for priority access',
        priorityGroup: 'senior',
        createdAt: Timestamp.now(),
        isActive: true
      }
    ];

    for (const message of messages) {
      await setDoc(doc(collection(db, 'routingMessages')), message);
      console.log(`✅ Routing message created for ${message.temple}`);
    }

    console.log('🎉 Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();