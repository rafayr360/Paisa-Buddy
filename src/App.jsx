import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { GlobalProvider, useGlobal } from "./context/GlobalContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import LandingPage from "./pages/LandingPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TransactionsPage from "./pages/TransactionsPage";
import ReportsPage from "./pages/ReportsPage";
import BudgetsPage from "./pages/BudgetsPage";
import SavingsPage from "./pages/SavingsPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import AuthFinish from "./pages/AuthFinish";

// --- Protected Route Wrapper ---
function ProtectedRoute() {
  const { user } = useGlobal();
  
  if (!user || !user.emailVerified) {
    return <Navigate to="/login" replace />;
  }

  // App Layout for logged-in users
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto no-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <GlobalProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/auth-finish" element={<AuthFinish />} />

          {/* Protected App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/savings" element={<SavingsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Router>
    </GlobalProvider>
  );
}

export default App;
