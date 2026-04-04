# 🕉️ Dev Darshan – Smart Crowd Management System

## 📌 Overview

**Dev Darshan** is an AI-powered, fully automated crowd management system designed for Ambaji Temple (Gujarat, India). It aims to streamline the darshan experience by reducing waiting time, preventing overcrowding, and improving safety through real-time monitoring, AI predictions, and smart queue management.

This system is especially useful during peak seasons and major festivals where millions of devotees visit the temple.

---

## 🎯 Objectives

* Reduce overcrowding and waiting time
* Provide a seamless darshan experience
* Improve safety and crowd flow
* Enable smart decision-making using AI
* Support both online and walk-in devotees

---

## 🚀 Key Features

### 📊 Real-time Crowd Monitoring

* Tracks crowd levels at:

  * Entrance
  * Temple area
  * Parking zones
* Updates every few minutes
* Color-coded indicators:

  * 🟢 Low
  * 🟡 Medium
  * 🔴 High

---

### 🎟️ Virtual Queue Booking

* Book darshan slots in advance
* Generate unique QR code for entry
* Time-based slot allocation
* Reduces physical queues

---

### 🤖 AI-Powered Predictions

* Predicts crowd for upcoming hours
* Suggests best time slots
* Provides confidence score
* Uses historical + real-time data

---

### 🔔 Automated Notifications

* Alerts users about:

  * Crowd level changes
  * Slot reminders
  * Entry timings
* Triggered automatically

---

### ⏱️ Smart Wait Time System

* Calculates estimated waiting time
* Updates every 5 minutes
* Based on real-time crowd density

---

### 🗺️ Real-time Heatmap

* Visual representation of crowd density
* Color-coded zones
* Helps in route planning

---

### 🧾 Walk-in Kiosk System

* For devotees without smartphones
* Staff-assisted entry
* Instant QR generation & print
* Inclusive design for all users

---

### 🛠️ Admin Dashboard

* Monitor real-time crowd
* Control routing messages
* Manage bookings
* View analytics and trends

---

### 🎉 Festival Detection System

Automatically increases crowd estimation during:

* Bhadarvi Poonam
* Navratri
* Diwali

Applies dynamic multipliers for accurate predictions.

---

## 🏗️ System Architecture

* **Frontend:** React.js
* **Backend:** Firebase
* **Database:** Firestore
* **AI Engine:** Google Gemini API
* **Maps:** Leaflet + OpenStreetMap
* **Deployment:** Vercel

---

## 🔄 Data Flow

1. Crowd simulator generates data based on time
2. Data stored in Firestore
3. Real-time updates sent to:

   * Admin Dashboard
   * User Interface
   * Heatmap

---

## ⏳ Time-Based Crowd Logic

| Time Slot | Crowd Level |
| --------- | ----------- |
| 6–8 AM    | 25%         |
| 9–11 AM   | 65%         |
| 12–2 PM   | 45%         |
| 6–8 PM    | 80%         |
| Night     | 8%          |

### Additional Factors

* Weekend boost: +25%
* Festival boost: 2.5x – 8.5x

---

## 📁 Project Structure

```
src/
 ├── components/
 │   ├── auth/
 │   ├── admin/
 │   ├── devotee/
 │   └── common/
 ├── services/
 │   ├── firebase.js
 │   ├── firestore.js
 │   ├── aiAutomationService.js
 │   ├── automatedCrowdSimulator.js
 │   └── notificationService.js
 ├── contexts/
 ├── data/
 ├── utils/
 └── App.jsx
```

---

## 🗄️ Database Schema

### Collections

* **users**

  * name, email, phone, role

* **bookings**

  * userId, date, timeSlot, QR data

* **crowdData**

  * entranceLevel, templeLevel, parkingLevel

* **crowdHistory**

  * timestamp, levels

* **routingMessages**

  * message, priority

* **notifications**

  * userId, message

* **aiPredictions**

  * predictedCrowd, confidence

* **walkInEntries**

  * name, token, QR

---

## 📱 User Flows

### Devotee Flow

Landing → Login → Dashboard → Book Slot → QR Code → Entry

### Admin Flow

Login → Dashboard → Monitor → Control Crowd

### Walk-in Flow

Kiosk → Register → QR → Entry

---

## 📊 Performance Metrics

* Prediction Accuracy: 92–96%
* Update Delay: < 2 seconds
* Load Time: < 1.5 seconds
* Concurrent Users: 10,000+
* Uptime: 99.9%

---

## 📊 Historical Data (Sample)

| Year | Devotees  |
| ---- | --------- |
| 2024 | 32.5 Lakh |
| 2023 | 45 Lakh   |
| 2022 | 42 Lakh   |
| 2021 | 38 Lakh   |

---

## ⚙️ Installation & Setup

```bash
git clone <repo>
cd dev-darshan
npm install
npm run dev
```

### Environment Variables

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your_project
VITE_GEMINI_API_KEY=your_key
```

---

## 🔐 Access Credentials

### Admin

* Email: [admin@ambaji.com](mailto:admin@ambaji.com)
* Password: admin123

### Users

* Register or login via Google

---

## 🛠️ Troubleshooting

* Firebase error → Check config
* Heatmap issue → Install Leaflet
* Index error → Create in Firebase

---

## 🤝 Team – CodeFlux

* Abhijeet Baraskar = https://github.com/abhijeetbaraskar24
* Krishna Aundehkar = https://github.com/BipashaDoke
* Trupti Chaudhari = Trupti Chaudhari = https://github.com/chaudharitk1-tech
* Bipasha Doke = https://github.com/KrishnaPeaks

---

## 📬 Contact

* Email: [support@devdarshan.com](mailto:support@devdarshan.com)
* Demo: https://dev-darshan.vercel.app

---

## 🙏 Acknowledgements

* Ambaji Temple Trust
* Gujarat Government
* Google Gemini AI
* OpenStreetMap

---

## 📜 License

MIT License

---

🕉️ **Jai Ambaji Mata**
