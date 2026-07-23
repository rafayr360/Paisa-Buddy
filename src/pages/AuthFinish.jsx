import { useEffect, useState } from "react";
import { useGlobal } from "../context/GlobalContext";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AuthFinish() {
  const { completeLinkLogin } = useGlobal();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error

  useEffect(() => {
    const finishLogin = async () => {
      try {
        await completeLinkLogin();
        setStatus("success");
        setTimeout(() => navigate("/dashboard"), 2000);
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    };
    finishLogin();
  }, [completeLinkLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-12 text-center border border-slate-100">
        {status === "loading" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verifying Magic Link...</h2>
              <p className="text-slate-500 font-medium">Please wait while we securely log you in.</p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Login Successful!</h2>
              <p className="text-slate-500 font-medium">Welcome back to Paisa Buddy. Redirecting...</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-rose-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Link Expired or Invalid</h2>
              <p className="text-slate-500 font-medium">Something went wrong. Please try sending a new magic link.</p>
            </div>
            <button 
              onClick={() => navigate("/auth")}
              className="w-full mt-4 py-4 bg-[#4F46E5] text-white rounded-2xl text-base font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
