import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Wallet, ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0c14] text-slate-100 font-sans">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-700/8 rounded-full blur-[140px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-10 py-5 max-w-4xl mx-auto border-b border-white/5">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Wallet className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Paisa Buddy</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </nav>

      {/* Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Privacy Policy</h1>
            <p className="text-slate-500 text-sm mt-1">Last updated: April 2026</p>
          </div>
        </div>

        <p className="text-slate-400 leading-relaxed mb-10">
          At Paisa Buddy, we take your privacy seriously. This policy explains what data we collect, how we use it, and what rights you have as a user.
        </p>

        <div className="space-y-8">
          {[
            {
              title: "1. Data We Collect",
              content: "We collect only the minimum necessary information: your email address for authentication and the financial data you voluntarily enter into the app (transactions, budgets, savings goals). We do not collect payment information, government IDs, or any sensitive personal documents."
            },
            {
              title: "2. How We Store Your Data",
              content: "All data is stored in Google Firebase — a secure, encrypted cloud platform. Your data is completely isolated per user account. No other user or third party can access your financial information. Firebase uses AES-256 encryption at rest and TLS in transit."
            },
            {
              title: "3. AI Feature Processing",
              content: "When you use AI features (natural language input, receipt scanning, insights), your text or image is temporarily sent to Google Gemini API for processing. We do not permanently store your AI conversations or uploaded receipt images after processing is complete."
            },
            {
              title: "4. Third-Party Services",
              content: "We use the following third-party services: Google Firebase (authentication & database), Google Gemini API (AI features), and Open Exchange Rates API (currency conversion). Each of these services has their own privacy policies which govern their data handling."
            },
            {
              title: "5. Your Rights",
              content: "You have full control over your data. You can export your transaction data as CSV anytime from the Transactions page. You can permanently delete your account and all associated data from Settings → Account → Delete Account. Deletion is immediate and irreversible."
            },
            {
              title: "6. Cookies & Analytics",
              content: "Paisa Buddy does not use tracking cookies or third-party analytics. We do not serve advertisements. The only local storage used is for keeping you logged in between sessions (via Firebase Auth tokens)."
            },
            {
              title: "7. Children's Privacy",
              content: "Paisa Buddy is not intended for users under 13 years of age. We do not knowingly collect data from children. If you believe a child has provided us with personal information, please contact us immediately."
            },
            {
              title: "8. Changes to This Policy",
              content: "We may update this policy from time to time. Significant changes will be communicated through the app. Continued use after changes means you accept the updated policy."
            },
            {
              title: "9. Contact",
              content: "For any privacy-related questions or concerns, please reach out through the Settings page inside the app. We aim to respond within 48 hours."
            },
          ].map((section, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <h2 className="text-white font-bold text-base mb-3">{section.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
          <p className="text-slate-300 text-sm">Your trust matters to us. Paisa Buddy will never sell or misuse your data.</p>
          <Link to="/" className="inline-flex items-center gap-2 mt-4 text-indigo-400 hover:text-indigo-300 font-bold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Return to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
