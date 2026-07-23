# 💰 Paisa Buddy

A premium personal finance web application built to make budget management intuitive, intelligent, and visually refined.

![Paisa Buddy](./src/assets/hero.png)

---

## 🚀 Features

- 🔐 **Authentication** — Secure login & signup with Firebase Auth
- 📊 **Dashboard** — Real-time overview of your financial health
- 💸 **Transactions** — Log and manage income & expenses easily
- 📋 **Budgets** — Set and track budgets by category
- 🏦 **Savings Goals** — Plan and monitor your savings progress
- 📈 **Reports** — Visual charts and analytics of your spending habits
- 🤖 **AI Assistant** — Powered by Google Gemini & Groq for smart financial insights
- ⚙️ **Settings** — Customize your experience
- 🎨 **Minimalist Premium UI** — Clean, smooth and modern design

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | Frontend framework |
| Tailwind CSS | Styling |
| Firebase | Authentication & database |
| Google Gemini AI | AI assistant |
| Groq | AI inference |
| Recharts | Data visualization |

---

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rafayr360/Paisa-Buddy.git
   cd Paisa-Buddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_GROQ_API_KEY=your_groq_api_key

   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
