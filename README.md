# 🌀 Hurricane Monitor - Western Pacific Region - A SKYNET project

> Real-time storm tracking and AI-powered trajectory prediction system for the Western Pacific Ocean.

[![Watch the video](https://img.youtube.com/vi/_lGwsyp_c8Q/hqdefault.jpg)](https://www.youtube.com/watch?v=_lGwsyp_c8Q)

[![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20S3%20%7C%20CloudFront-orange)](https://aws.amazon.com/)
[![React](https://img.shields.io/badge/React-19.1.1-blue)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.12-green)](https://www.python.org/)
[![.NET](https://img.shields.io/badge/.NET-8.0-purple)](https://dotnet.microsoft.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Hurricane Monitor is a comprehensive storm tracking and prediction system that provides:

- **Real-time Storm Tracking**: Automated data collection from IBTrACS
- **AI-Powered Prediction**: LSTM + TCN models for trajectory forecasting
- **Interactive Visualization**: Leaflet-based map with multiple weather layers
- **Weather Integration**: Real-time weather data from OpenWeatherMap

**Live Demo**: [skynethurricane.com](skynethurricane.com)

---

## ✨ Features

### 🌊 Storm Tracking
- Automatic crawling of 3 most recent Western Pacific storms
- Historical track visualization with animated paths
- Storm intensity classification (Tropical Depression → Super Typhoon)

### 🤖 AI Prediction
- **LSTM Model**: Predicts total distance storm will travel
- **TCN Model**: Generates step-by-step trajectory forecast
- Minimum 9 historical positions required
- 72-hour forecast with confidence intervals

### 🗺️ Interactive Map
- Multiple weather layers (Temperature, Wind, Radar, Satellite)
- Wind particle visualization system
- Province boundaries overlay
- Custom storm prediction rendering

### 🌡️ Weather Data
- Current weather by city or coordinates
- 5-day forecast
- Auto-detection via IP geolocation
- Multi-level caching for performance

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PHẦN 1: FRONTEND DELIVERY                 │
└─────────────────────────────────────────────────────────────┘

User nhập URL
    │
    ▼
CloudFront (d3lj47ilp0fgxy.cloudfront.net)
    │
    ├─> Edge Location (cache)
    │   └─> Return cached content (nếu có)
    │
    └─> Origin Fetch (nếu cache miss)
        │
        ▼
    S3: storm-frontend-hosting-duc-2025
        ├─ index.html
        ├─ assets/*.js
        ├─ assets/*.css
        └─ recent_storms.json  ◄─── Frontend fetch trực tiếp
    
    ▼
User thấy giao diện


┌─────────────────────────────────────────────────────────────┐
│           PHẦN 2: BACKEND & DATA PROCESSING                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  A. STORM DATA COLLECTION (Automated)                    │
└──────────────────────────────────────────────────────────┘

EventBridge (Scheduler)
    │ Trigger every morning
    ▼
Lambda: storm-crawler
    │ 1. Crawl IBTrACS website
    │ 2. Parse HTML (BeautifulSoup)
    │ 3. Filter 3 WP storms
    │ 4. Transform data
    │ 5. Upload to S3
    ▼
S3: storm-frontend-hosting-duc-2025/recent_storms.json
    │
    └─> CloudFront invalidate cache
        │
        └─> Frontend fetch new data


┌──────────────────────────────────────────────────────────┐
│  B. STORM PREDICTION (On-demand)                         │
└──────────────────────────────────────────────────────────┘

User submit form
    │
    ▼
Frontend POST request
    │
    ▼
Lambda Function URL (Public HTTPS)  
    │
    ▼
Lambda: storm-prediction
    │ 1. Load models from S3
    │    ├─ S3: storm-ai-models-duc-2025
    │    │   ├─ lstm_totald_256_4.pt
    │    │   └─ cropping_storm_7304_2l.pth
    │    └─ Cache in /tmp/
    │
    │ 2. Run LSTM (total distance)
    │ 3. Run TCN (path generation)
    │ 4. Save result to S3
    │    └─> S3: storm-frontend-hosting-duc-2025/predictions/
    │
    └─> Return JSON to frontend



```

### Key Components

1. **Frontend (React + TypeScript)**
   - Interactive map with Leaflet
   - Real-time data visualization
   - Responsive UI with TailwindCSS

2. **Storm Crawler (Python Lambda)**
   - Scheduled execution every 30 minutes
   - Scrapes IBTrACS website
   - Transforms and uploads to S3

3. **Prediction Service (Python Lambda)**
   - LSTM + TCN models
   - PyTorch inference
   - Model caching for performance

4. **Weather API (.NET Lambda)**
   - OpenWeatherMap integration
   - Multi-level caching
   - Secure API key management

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19.1.1 + TypeScript
- **Build Tool**: Vite 7.1.2
- **UI Library**: TailwindCSS + shadcn/ui
- **Maps**: Leaflet 1.9.4
- **State Management**: React Query + Context API

### Backend
- **Weather API**: .NET 8 (C#)
- **Storm Services**: Python 3.12
- **ML Framework**: PyTorch 2.1.0
- **Web Scraping**: BeautifulSoup4

### Infrastructure
- **Compute**: AWS Lambda
- **Storage**: AWS S3
- **CDN**: AWS CloudFront
- **Scheduler**: AWS EventBridge
- **Security**: AWS Secrets Manager
- **Monitoring**: AWS CloudWatch

### AI/ML
- **LSTM**: Total distance prediction
- **TCN**: Trajectory generation
- **Dataset**: IBTrACS (226,152 records, 1842-2025)

---

## 📁 Project Structure

```
hurricane-monitor/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── storm/         # Storm visualization components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   ├── api/               # API client
│   │   ├── lib/               # Utilities and helpers
│   │   └── hooks/             # Custom React hooks
│   ├── public/                # Static assets
│   └── package.json
│
├── backend/                    # .NET Weather API
│   ├── Controllers/           # API controllers
│   ├── Services/              # Business logic
│   ├── Program.cs             # Entry point
│   └── WeatherBackend.csproj
│
├── storm_crawler/             # Python crawler service
│   ├── app.py                 # Lambda handler
│   ├── Dockerfile             # Container image
│   └── requirements.txt
│
├── storm_prediction/          # Python AI service
│   ├── app.py                 # Lambda handler with ML models
│   ├── Dockerfile
│   └── requirements.txt
│
├── ml_storm_models/           # ML training and models
│   ├── dataset/               # IBTrACS data
│   ├── training/              # Jupyter notebooks
│   └── check_point/           # Trained model files
│
├── docs/                      # Documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE_FLOW_GUIDE.md
│   └── QA_PREPARATION.md
│
└── README.md                 
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- .NET 8 SDK
- AWS CLI configured
- Docker (for Lambda deployment)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Backend Setup

#### Weather API (.NET)
```bash
cd backend
dotnet restore
dotnet run
```

API will be available at `http://localhost:5090`

#### Storm Crawler (Python)
```bash
cd storm_crawler
pip install -r requirements.txt
python app.py  # For local testing
```

#### Storm Prediction (Python)
```bash
cd storm_prediction
pip install -r requirements.txt
python app.py  # For local testing
```

### Environment Variables

#### Frontend (.env.production)
```env
VITE_CLOUDFRONT_URL=https://d3lj47ilp0fgxy.cloudfront.net
VITE_PREDICTION_API_URL=https://your-lambda-url.lambda-url.ap-southeast-1.on.aws
VITE_API_BASE_URL=https://your-api-gateway-url
```

#### Backend (AWS Secrets Manager)
```json
{
  "OpenWeatherApiKey": "your-api-key-here"
}
```

---

## 📦 Deployment

### Frontend Deployment

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://storm-frontend-hosting-duc-2025/
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Lambda Deployment

#### Storm Crawler
```bash
cd storm_crawler
docker build -t storm-crawler .
docker tag storm-crawler:latest YOUR_ECR_URI/storm-crawler:latest
docker push YOUR_ECR_URI/storm-crawler:latest
aws lambda update-function-code --function-name storm-crawler --image-uri YOUR_ECR_URI/storm-crawler:latest
```

#### Storm Prediction
```bash
cd storm_prediction
docker build -t storm-prediction .
docker tag storm-prediction:latest YOUR_ECR_URI/storm-prediction:latest
docker push YOUR_ECR_URI/storm-prediction:latest
aws lambda update-function-code --function-name storm-prediction --image-uri YOUR_ECR_URI/storm-prediction:latest
```

#### Weather Backend
```bash
cd backend
dotnet publish -c Release
# Deploy using AWS Toolkit or SAM
```

### EventBridge Schedule

```bash
aws events put-rule \
  --name storm-crawler-schedule \
  --schedule-expression "rate(30 minutes)"

aws events put-targets \
  --rule storm-crawler-schedule \
  --targets "Id"="1","Arn"="arn:aws:lambda:REGION:ACCOUNT:function:storm-crawler"
```

---

## 📚 API Documentation

### Weather API

#### Get Current Weather
```http
GET /api/weather?city=Hanoi
```

**Response:**
```json
{
  "localTime": "2025-12-11 10:30:00",
  "city": "Hanoi",
  "temp": 25.5,
  "humidity": 70,
  "wind": 3.5,
  "weather": "Partly cloudy"
}
```

#### Get Weather by Coordinates
```http
GET /api/weather/by-coord?lat=21.0&lon=105.8
```

#### Get 5-Day Forecast
```http
GET /api/weather/forecast?city=Hanoi
```

### Prediction API

#### Predict Storm Trajectory
```http
POST /predict
Content-Type: application/json

{
  "history": [
    {"lat": 15.92, "lng": 133.0, "windSpeed": 65},
    {"lat": 16.127, "lng": 132.7, "windSpeed": 70},
    ...
  ],
  "storm_name": "Typhoon Maria"
}
```

**Response:**
```json
{
  "storm_id": "2024301N11136",
  "storm_name": "Typhoon Maria",
  "totalDistance": 1250.5,
  "lifespan": 72,
  "forecast": [
    {
      "lat": 16.32,
      "lng": 130.1,
      "timestamp": 1703012400000,
      "windSpeed": 95.3,
      "pressure": 980.0,
      "category": "Bão rất mạnh"
    },
    ...
  ]
}
```

---

## 🔧 Configuration

### AWS Services Configuration

#### S3 Buckets
- `storm-frontend-hosting-duc-2025`: Frontend + storm data
- `storm-ai-models-duc-2025`: ML model files

#### Lambda Functions
- `storm-crawler`: 512MB, 5min timeout, Python 3.12
- `storm-prediction`: 2048MB, 5min timeout, Python 3.12
- `weather-backend`: 512MB, 30s timeout, .NET 8

#### IAM Roles
- `LambdaCrawlerExecutionRole`: s3:PutObject, logs:*
- `LambdaPredictionExecutionRole`: s3:GetObject, s3:PutObject, logs:*
- `LambdaWeatherExecutionRole`: secretsmanager:GetSecretValue, logs:*

---

## 📊 Performance

- **Frontend Load Time**: < 3s
- **API Response Time**: < 200ms (cached), < 1s (uncached)
- **AI Prediction Time**: 2-3s (warm), 5s (cold start)
- **Crawler Execution**: ~30s per run
- **Availability**: 99.9% (AWS SLA)

---

## 💰 Cost

**Monthly Cost Breakdown:**
- Lambda: $0 (free tier)
- S3: $0.01
- CloudFront: $1.30
- Secrets Manager: $0.41
- CloudWatch: $0 (free tier)

**Total: ~$1.72/month** (with free tier)

---

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
```

### Backend Tests
```bash
cd backend
dotnet test
```

---

## 📈 Monitoring

### CloudWatch Dashboards
- Lambda invocations, errors, duration
- S3 request count
- CloudFront cache hit ratio

### Logs
- `/aws/lambda/storm-crawler`
- `/aws/lambda/storm-prediction`
- `/aws/lambda/weather-backend`


---

## 🙏 Acknowledgments

- **IBTrACS** - Storm data source
- **OpenWeatherMap** - Weather data API
- **AWS** - Cloud infrastructure
- **PyTorch** - ML framework
- **React** - Frontend framework

---
