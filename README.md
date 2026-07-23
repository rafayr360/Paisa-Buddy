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
- 🎨 **Minimalist Premium UI** — Clean, smooth, and modern design

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | Frontend framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| Firebase | Authentication & database |
| Google Gemini AI | AI assistant |
| Groq | AI inference |
| Recharts | Data visualization |
| Radix UI | Accessible UI components |
| React Router | Client-side routing |

---

## 📦 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- Firebase project
- Google Gemini API key
- Groq API key

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

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Dashboard.jsx
│   ├── Header.jsx
│   ├── Sidebar.jsx
│   ├── TransactionModal.jsx
│   └── ui/            # Base UI components (Button, Card, etc.)
├── context/           # Global state management
├── lib/               # Firebase, Gemini AI config
├── pages/             # App pages
│   ├── LandingPage.jsx
│   ├── AuthPage.jsx
│   ├── BudgetsPage.jsx
│   ├── SavingsPage.jsx
│   ├── ReportsPage.jsx
│   ├── TransactionsPage.jsx
│   └── SettingsPage.jsx
├── App.jsx
└── main.jsx
```

---

## 🔧 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Rafay**
- GitHub: [@rafayr360](https://github.com/rafayr360)

---

> Built with ❤️ to make personal finance simple and accessible for everyone.
