import { useState, useRef } from "react";
import { 
  User, Bell, Shield, Palette, Database, Check, CreditCard, 
  Smartphone, Mail, Lock, Download, Trash2, Camera, Upload, AlertCircle, Loader2, CheckCircle2, Eye, EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "../components/ui/dialog";
import { useGlobal } from "../context/GlobalContext";
import { storage } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// --- Custom Toggle Component ---
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        checked ? "bg-emerald-500" : "bg-secondary"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
          checked ? "translate-x-6" : "translate-x-1"
        } shadow-sm`}
      />
    </button>
  );
}

// --- Custom Toast Component ---
function Toast({ show, message, type = "success" }) {
  if (!show) return null;
  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${
      type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
    }`}>
      {type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

export default function SettingsPage() {
  const { 
    user, currency, theme, updateCurrency, updateTheme, 
    updateUserProfile, changeUserPassword, deleteUserAccount,
    transactions, budgets, savings,
    notificationPrefs, saveNotificationPrefs
  } = useGlobal();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // Profile State
  const [profileName, setProfileName] = useState(user?.displayName || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Security State
  const [security, setSecurity] = useState({ currentPass: "", newPass: "", confirmPass: "" });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [deletePass, setDeletePass] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Preferences State - initialized from persisted context
  const [notifs, setNotifs] = useState(notificationPrefs);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(profileName, user?.photoURL);
      showToast("Profile updated successfully!");
    } catch (error) {
      showToast("Failed to update profile.", "error");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800000) {
      showToast("File too large. Max 800KB allowed.", "error");
      return;
    }

    setUploadingAvatar(true);
    setUploadProgress(0);

    try {
      const fileRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Firebase Storage Error:", error);
          let msg = "Upload failed.";
          if (error.code === 'storage/unauthorized') msg = "Permission denied (check storage rules).";
          else if (error.code === 'storage/canceled') msg = "Upload canceled.";
          else msg = error.message;
          
          showToast(msg, "error");
          setUploadingAvatar(false);
        }, 
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await updateUserProfile(user.displayName, url);
            showToast("Profile picture updated!");
          } catch (err) {
            console.error(err);
            showToast("Failed to finalize profile update.", "error");
          } finally {
            setUploadingAvatar(false);
          }
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Failed to initiate upload.", "error");
      setUploadingAvatar(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (window.confirm("Are you sure you want to remove your profile picture?")) {
      try {
        // Try with null first, then empty string if that's the issue
        await updateUserProfile(user.displayName, "");
        showToast("Profile picture removed!");
      } catch (error) {
        console.error("Remove Photo Error:", error);
        showToast(`Failed to remove photo: ${error.message}`, "error");
      }
    }
  };

  const handleChangePassword = async () => {
    if (!security.currentPass || !security.newPass) {
      showToast("Please fill all password fields.", "error");
      return;
    }
    if (security.newPass !== security.confirmPass) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (security.newPass.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setLoadingPass(true);
    try {
      await changeUserPassword(security.currentPass, security.newPass);
      showToast("Password changed successfully!");
      setSecurity({ currentPass: "", newPass: "", confirmPass: "" });
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential') {
        showToast("Incorrect current password.", "error");
      } else {
        showToast("Failed to change password. Make sure you logged in with email.", "error");
      }
    } finally {
      setLoadingPass(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await saveNotificationPrefs(notifs);
      showToast("Notification preferences saved!");
    } catch (error) {
      showToast("Failed to save preferences.", "error");
    }
  };

  const handleExportData = () => {
    const data = {
      transactions,
      budgets,
      savings,
      exportedAt: new Date().toISOString()
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `paisa_buddy_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Data export downloaded successfully.");
  };

  const handleDeleteAccount = async () => {
    if (!deletePass) {
      showToast("Please enter your password to confirm.", "error");
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteUserAccount(deletePass);
      // App will redirect automatically via Auth state change
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential') {
        showToast("Incorrect password. Please try again.", "error");
      } else if (error.code === 'auth/requires-recent-login') {
        showToast("Session expired. Please log out and log in again to delete your account.", "error");
      } else {
        showToast("An error occurred during account deletion.", "error");
      }
      setDeletingAccount(false);
    }
  };

  const TABS = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "data", label: "Data & Privacy", icon: Database },
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-24">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col gap-1">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-primary/10 text-primary shadow-sm border border-primary/20" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="shadow-sm border-border overflow-hidden">
                <CardHeader className="bg-secondary border-b border-border/50 pb-4">
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Update your avatar and personal details.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-24 h-24 rounded-full object-cover shadow-inner" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-bold shadow-inner uppercase">
                          {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                        </div>
                      )}
                      
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-full flex flex-col items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <span className="text-[10px] font-bold mt-1 text-primary">{Math.round(uploadProgress)}%</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute bottom-0 right-0 p-1.5 bg-card border border-border rounded-full shadow-sm text-muted-foreground hover:text-indigo-600 hover:border-indigo-500 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleAvatarChange} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif"
                      />
                    </div>
                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <p className="text-sm font-medium text-foreground">Upload a new photo</p>
                      <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 800KB.</p>
                      <div className="pt-2 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-card border border-border text-foreground rounded-lg text-xs font-semibold hover:bg-secondary transition-colors shadow-sm flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5" /> Choose File
                        </button>
                        {user?.photoURL && (
                          <button onClick={handleRemovePhoto} className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-lg text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors shadow-sm flex items-center gap-2">
                            <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Full Name</label>
                      <Input value={profileName} onChange={e => setProfileName(e.target.value)} className="bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Email Address (Read-only)</label>
                      <Input value={user?.email || ""} readOnly disabled className="bg-secondary cursor-not-allowed text-muted-foreground" />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button onClick={handleSaveProfile} className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                      Save Changes
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === "preferences" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="shadow-sm border-border">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle>App Preferences</CardTitle>
                  <CardDescription>Customize how Paisa Buddy looks and feels.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* Currency */}
                  <div className="max-w-md space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Primary Currency</label>
                    <p className="text-xs text-muted-foreground mb-2">Amounts are automatically converted using real-time exchange rates.</p>
                    <select 
                      value={currency}
                      onChange={e => { updateCurrency(e.target.value); showToast(`Currency updated to ${e.target.value}`); }}
                      className="w-full appearance-none px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="PKR">PKR (₨)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>

                  <hr className="border-border" />

                  {/* Theme Selector */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-4 max-w-md">
                      <button 
                        onClick={() => updateTheme("light")}
                        className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${theme === "light" ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30" : "border-border hover:border-indigo-500 bg-card"}`}
                      >
                        <div className="w-full h-20 rounded-lg bg-slate-100 p-2 flex flex-col gap-1.5">
                          <div className="w-full h-3 bg-white rounded shadow-sm"></div>
                          <div className="w-3/4 h-2 bg-slate-200 rounded"></div>
                          <div className="w-1/2 h-2 bg-slate-200 rounded"></div>
                        </div>
                        <span className="text-xs font-semibold text-foreground">Light</span>
                      </button>
                      
                      <button 
                        onClick={() => updateTheme("dark")}
                        className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${theme === "dark" ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30" : "border-border hover:border-indigo-500 bg-card"}`}
                      >
                        <div className="w-full h-20 rounded-lg bg-slate-900 p-2 flex flex-col gap-1.5">
                          <div className="w-full h-3 bg-slate-800 rounded shadow-sm"></div>
                          <div className="w-3/4 h-2 bg-slate-700 rounded"></div>
                          <div className="w-1/2 h-2 bg-slate-700 rounded"></div>
                        </div>
                        <span className="text-xs font-semibold text-foreground">Dark</span>
                      </button>

                      <button 
                        onClick={() => updateTheme("system")}
                        className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${theme === "system" ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30" : "border-border hover:border-indigo-500 bg-card"}`}
                      >
                        <div className="w-full h-20 rounded-lg flex overflow-hidden">
                           <div className="w-1/2 h-full bg-slate-100 p-2 flex flex-col gap-1.5">
                             <div className="w-full h-2 bg-white rounded"></div>
                             <div className="w-full h-2 bg-slate-200 rounded"></div>
                           </div>
                           <div className="w-1/2 h-full bg-slate-900 p-2 flex flex-col gap-1.5">
                             <div className="w-full h-2 bg-slate-800 rounded"></div>
                             <div className="w-full h-2 bg-slate-700 rounded"></div>
                           </div>
                        </div>
                        <span className="text-xs font-semibold text-foreground">System</span>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="shadow-sm border-border">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>Choose what we email you about.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    <div className="flex items-center justify-between p-6">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5"><CreditCard className="w-5 h-5 text-muted-foreground" /></div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Budget Limit Alerts</p>
                          <p className="text-xs text-muted-foreground">Get notified when you exceed 80% of your budget.</p>
                        </div>
                      </div>
                      <Toggle checked={notifs.budget} onChange={v => setNotifs({...notifs, budget: v})} />
                    </div>
                    <div className="flex items-center justify-between p-6">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5"><Mail className="w-5 h-5 text-muted-foreground" /></div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Weekly Summary</p>
                          <p className="text-xs text-muted-foreground">A weekly overview of your income and expenses.</p>
                        </div>
                      </div>
                      <Toggle checked={notifs.weekly} onChange={v => setNotifs({...notifs, weekly: v})} />
                    </div>
                    <div className="flex items-center justify-between p-6">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5"><Smartphone className="w-5 h-5 text-muted-foreground" /></div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">New Device Logins</p>
                          <p className="text-xs text-muted-foreground">Security alerts if your account is accessed from a new device.</p>
                        </div>
                      </div>
                      <Toggle checked={notifs.login} onChange={v => setNotifs({...notifs, login: v})} />
                    </div>
                    <div className="p-6 pt-2 border-t border-border/50 flex justify-end">
                      <button
                        onClick={handleSaveNotifications}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <Card className="shadow-sm border-border">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Ensure your account is using a long, random password.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5 max-w-md">
                    <label className="text-sm font-medium text-foreground">Current Password</label>
                    <div className="relative">
                      <Input 
                        type={showPass.current ? "text" : "password"} 
                        value={security.currentPass} 
                        onChange={e => setSecurity({...security, currentPass: e.target.value})} 
                        className="bg-background pr-10" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPass({...showPass, current: !showPass.current})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPass.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <div className="relative">
                      <Input 
                        type={showPass.new ? "text" : "password"} 
                        value={security.newPass} 
                        onChange={e => setSecurity({...security, newPass: e.target.value})} 
                        className="bg-background pr-10" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPass({...showPass, new: !showPass.new})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPass.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                    <div className="relative">
                      <Input 
                        type={showPass.confirm ? "text" : "password"} 
                        value={security.confirmPass} 
                        onChange={e => setSecurity({...security, confirmPass: e.target.value})} 
                        className="bg-background pr-10" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPass.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button 
                      onClick={handleChangePassword} 
                      disabled={loadingPass}
                      className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
                    >
                      {loadingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Update Password
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DATA TAB */}
          {activeTab === "data" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <Card className="shadow-sm border-border">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>Download all your transactions and budgets.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">You can request an export of your personal data in JSON format. This contains your full financial history.</p>
                  <button onClick={handleExportData} className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors shadow-sm">
                    <Download className="w-4 h-4" /> Download Backup
                  </button>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-rose-200/50 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10">
                <CardHeader className="border-b border-rose-100 dark:border-rose-900/50 pb-4">
                  <CardTitle className="text-rose-600 dark:text-rose-400">Danger Zone</CardTitle>
                  <CardDescription className="text-rose-600/70 dark:text-rose-400/60">Irreversible account actions.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2 mb-4">
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Delete Account Permanently</p>
                    <p className="text-xs text-rose-600 dark:text-rose-400/80">Once deleted, all your transactions, budgets, and savings goals will be lost forever. This action cannot be undone.</p>
                  </div>
                  <button 
                    onClick={() => setShowDeleteModal(true)} 
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Delete My Account
                  </button>
                </CardContent>
              </Card>

              {/* Deletion Modal */}
              <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                      <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <DialogTitle className="text-xl">Delete Account Permanently?</DialogTitle>
                    <DialogDescription className="pt-2 text-balance">
                      This will erase all your financial data and profile from <span className="font-bold text-foreground">Paisa Buddy</span>. 
                      You will not be able to recover this data later.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        To confirm, please enter your account password:
                      </label>
                      <Input 
                        type="password" 
                        placeholder="Your password" 
                        value={deletePass} 
                        onChange={e => setDeletePass(e.target.value)}
                        className="bg-background border-border"
                        disabled={deletingAccount}
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <button 
                      onClick={() => setShowDeleteModal(false)}
                      disabled={deletingAccount}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount || !deletePass}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      {deletingAccount ? "Deleting..." : "Confirm Delete"}
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
