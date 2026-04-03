import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { setupDatabase } from './services/firebase-init';
import AutomatedCrowdSimulator from './services/automatedCrowdSimulator';

setupDatabase().then(() => {
  // Start AUTOMATED crowd simulation (no manual input needed!)
  AutomatedCrowdSimulator.start();
  
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});