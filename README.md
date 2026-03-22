<div align="center">

# 🏥 AiMedScan

### AI-Powered Medical Assistant for Prescription Analysis & Symptom Checking

[![Live Demo](https://img.shields.io/badge/Live%20Demo-aimedscan.vercel.app-teal?style=for-the-badge)](https://aimedscan.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-yasasswini08%2FAiMedScan-black?style=for-the-badge&logo=github)](https://github.com/yasasswini08/AiMedScan)
[![Made with React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![AWS Bedrock](https://img.shields.io/badge/AI-AWS%20Bedrock%20Claude-FF9900?style=for-the-badge&logo=amazonaws)](https://aws.amazon.com/bedrock)

</div>

---

## 📖 Overview

**AiMedScan** is a full-stack AI-powered medical assistant designed to bridge the gap between patients and medical information. It leverages AWS Bedrock (Claude Haiku) to read handwritten prescriptions — even in mixed Telugu-English scripts — and provides patients with clear, plain-language explanations of their medicines, symptoms, and nearby healthcare facilities.

> Built for patients in India who receive handwritten prescriptions and struggle to understand the medicines prescribed to them.

---

## ✨ Features

### 📋 Prescription Analyzer
- Upload a photo or PDF of any doctor's prescription
- AI reads handwritten text — including Telugu + English mixed scripts
- Identifies every medicine with dosage, frequency, and duration
- Explains purpose, side effects, and precautions in plain language
- Works without login — no account required

### 🩺 Symptom Checker
- Describe symptoms via text or voice input
- AI-powered disease prediction with confidence scores
- Severity detection (mild / moderate / severe)
- Personalized follow-up questions for accurate analysis
- Body map for visual symptom selection

### 🏥 Hospital Finder
- Find nearby hospitals based on current location
- Filter by specialty, distance, and availability
- Interactive map with directions

### 📊 Personal Health Dashboard
- View prescription and symptom history
- Track health trends over time
- Download analysis reports

### 🎤 Voice Input
- Speak your symptoms using the built-in speech recognition
- Supports multilingual input

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, CSS3 |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas) |
| AI Vision | AWS Bedrock — Claude 3 Haiku |
| ML Model | Python, scikit-learn |
| Auth | JWT (JSON Web Tokens) |
| File Upload | Multer (memory storage) |
| Deployment | Vercel (frontend), Render (backend) |

---

## 🏗️ Project Structure

```
AiMedScan/
├── frontend/                  # React + Vite app
│   └── src/
│       ├── components/        # Navbar, HospitalMap, SymptomBodyMap...
│       ├── context/           # AppContext (global state)
│       ├── pages/             # Auth, Dashboard, PrescriptionAnalyzer...
│       └── styles/            # CSS per component
├── backend/                   # Node.js + Express API
│   ├── controllers/           # Auth, Prescription, Symptom, Dashboard
│   ├── middleware/            # JWT auth middleware
│   ├── models/                # MongoDB schemas (User, History)
│   ├── routes/                # API route definitions
│   └── services/              # AWS Bedrock vision service
└── ai-model/                  # Python ML model
    ├── app.py                 # Flask API
    ├── train_model.py         # Model training
    └── prescription_service.py
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account
- AWS account with Bedrock access

### 1. Clone the repo
```bash
git clone https://github.com/yasasswini08/AiMedScan.git
cd AiMedScan
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5001
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
BEDROCK_API_KEY=your_aws_bedrock_api_key
BEDROCK_REGION=us-east-1
```

```bash
npm run dev
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 4. AI Model (optional)
```bash
cd ai-model
pip install -r requirements.txt
python app.py
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login |
| POST | `/api/prescription/analyze` | ❌ | Analyze prescription image |
| GET | `/api/prescription/medicine/:name` | ❌ | Get medicine info |
| POST | `/api/predict` | ✅ | Symptom prediction |
| GET | `/api/dashboard` | ✅ | User dashboard data |
| GET | `/api/history` | ✅ | Analysis history |

---

## 🌐 Live Demo

🔗 **[https://aimedscan.vercel.app](https://aimedscan.vercel.app)**

---

## 👩‍💻 Authors

**Yasasswini** — [@yasasswini08](https://github.com/yasasswini08)

**Bala Praharsha Mannepalli**

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
