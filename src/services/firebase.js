import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import {getDatabase} from 'firebase/database';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDO0MFu90dtP6ZDMA5IH8mr4UaMjE5Ckrc",
  authDomain: "devdarshan-d55b1.firebaseapp.com",
  projectId: "devdarshan-d55b1",
  storageBucket: "devdarshan-d55b1.firebasestorage.app",
  messagingSenderId: "199116636241",
  appId: "1:199116636241:web:8e941ae7ae1cd96daa7870",
  measurementId: "G-HC37PNNQGG",
  databaseURL: "https://devdarshan-d55b1-default-rtdb.firebaseio.com"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
