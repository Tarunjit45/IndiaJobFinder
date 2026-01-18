# 🇮🇳 IndiaJobFinder - AI Lightning Scanner

A high-performance, eligibility-first job discovery engine tailored for the Indian workforce. Built with **Gemini 2.5 Flash Lite**, this platform scans government (Sarkari) and private sectors in real-time to match candidates based on their specific age and sector preferences.

## ⚡ Why This Exists?
Finding jobs in India often involves navigating cluttered portals with outdated info. IndiaJobFinder uses **Real-Time Web Grounding** to find active notifications from 2024-2025 and filters them instantly based on your age—the most common disqualifier in Indian recruitment.

## ✨ Key Features

- **🚀 Lightning Engine**: Powered by `gemini-2.5-flash-lite-latest` for sub-3-second response times.
- **🛡️ 100% Uptime Architecture**: Includes a "Smart Fallback" system. If the AI API is exhausted or busy, the app seamlessly switches to a curated database of trending Indian jobs (SSC, UPSC, Banking, etc.).
- **🔞 Age-Verified Results**: Automatically discards jobs where your age falls outside the official notification limits.
- **🔍 Dual-Sector Search**: Toggle between Government and Private sectors or scan both simultaneously.
- **🔗 Source Verification**: Every AI-generated result includes grounding metadata linking back to official portals.
- **🎨 Neo-Brutalist UI**: High-contrast, accessibility-focused design that works perfectly on mobile and desktop.

## 🛠️ Technology Stack

- **React 19**: Utilizing the latest concurrent rendering features.
- **TypeScript**: Full type safety for job schemas and API responses.
- **Google GenAI SDK**: Direct browser-to-model integration using `@google/genai`.
- **Tailwind CSS**: Modern utility-first styling for a premium aesthetic.
- **Import Maps**: No build-step required; runs directly in modern browsers via ESM.

## 🚀 Getting Started

1. **Prerequisites**: A modern web browser.
2. **API Key**: 
   - This app requires a Gemini API key to perform live web scans.
   - Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).
3. **Usage**:
   - Open the app.
   - Click "Update API Key" at the bottom to save your key locally.
   - Enter your age, select a sector, and hit **Fast Scan**.

## 📁 Core Components

- `App.tsx`: The heart of the application, managing state and the search lifecycle.
- `services/geminiService.ts`: Specialized service that handles prompt engineering for the Flash-Lite model and manages the fallback logic.
- `components/JobCard.tsx`: A robust UI component designed to highlight critical info like "Last Date" and "Eligibility" at a glance.

## 📝 License
This project is for educational and public service purposes, helping Indian job seekers find legitimate opportunities faster.

---
*Built with ❤️ for Indian Job Seekers.*