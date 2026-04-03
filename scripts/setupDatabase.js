// scripts/setupDatabase.js
// Run with: node scripts/setupDatabase.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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