// src/services/firebase-init.js
import { db, auth } from './firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    Timestamp
} from 'firebase/firestore';

// Initialize default data for the system
export const initializeFirestore = async () => {
    try {
        // 1. Create admin user in Firestore
        const adminRef = doc(db, 'admins', 'admin@123');
        const adminDoc = await getDoc(adminRef);

        if (!adminDoc.exists()) {
            await setDoc(adminRef, {
                email: 'admin@123',
                role: 'super_admin',
                createdAt: Timestamp.now()
            });
            console.log('✅ Admin user created');
        }

        // 2. Initialize crowd data for all temples
        const temples = ['somnath', 'dwarkadhish', 'ambaji', 'pavagadh'];

        for (const temple of temples) {
            const crowdRef = doc(db, 'crowdData', temple);
            const crowdDoc = await getDoc(crowdRef);

            if (!crowdDoc.exists()) {
                await setDoc(crowdRef, {
                    temple: temple,
                    entranceLevel: 25,
                    templeAreaLevel: 30,
                    parkingLevel: 20,
                    lastUpdated: Timestamp.now(),
                    status: 'active'
                });
                console.log(`✅ Crowd data initialized for ${temple}`);
            }
        }

        // 3. Initialize sample routing messages
        const messagesRef = collection(db, 'routingMessages');
        const sampleMessages = [
            {
                temple: 'somnath',
                message: 'Main gate crowd is high. Please use East Gate for faster entry.',
                priorityGroup: 'all',
                createdAt: Timestamp.now(),
                isActive: true
            },
            {
                temple: 'dwarkadhish',
                message: 'Senior citizens can use Gate 3 for priority access.',
                priorityGroup: 'senior',
                createdAt: Timestamp.now(),
                isActive: true
            }
        ];

        // Only add if no messages exist (optional)
        console.log('✅ Firestore initialization complete');

    } catch (error) {
        console.error('Error initializing Firestore:', error);
    }
};

// Call this once when your app starts
export const setupDatabase = async () => {
    await initializeFirestore();
};