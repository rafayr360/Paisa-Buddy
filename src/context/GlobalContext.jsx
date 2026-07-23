import { createContext, useContext, useState, useEffect } from "react";
import { db, auth, storage } from "../lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy, setDoc, getDocs } from "firebase/firestore";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";

const GlobalContext = createContext();

export function useGlobal() {
  return useContext(GlobalContext);
}

export function GlobalProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // App State
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savings, setSavings] = useState([]);
  
  // Preferences (Defaulting to USD and Light theme)
  const [currency, setCurrency] = useState("USD");
  const [theme, setTheme] = useState("light");
  const [globalSearch, setGlobalSearch] = useState("");
  const [notificationPrefs, setNotificationPrefs] = useState({ budget: true, weekly: false, login: true });
  
  // Real-time Exchange Rates State
  const [exchangeRates, setExchangeRates] = useState(null);
  
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "PKR" ? "₨" : "₹";

  // Fetch Exchange Rates on Load
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setExchangeRates(data.rates);
        }
      })
      .catch(err => console.error("Failed to fetch exchange rates:", err));
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  // Sync data from Firestore when user logs in
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setBudgets([]);
      setSavings([]);
      return;
    }

    const qTrans = query(collection(db, `users/${user.uid}/transactions`), orderBy("date", "desc"));
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Perform secondary sort by createdAt on frontend to avoid Firestore Index requirement
      fetched.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
      setTransactions(fetched);
    });

    const qBudgets = query(collection(db, `users/${user.uid}/budgets`));
    const unsubBudgets = onSnapshot(qBudgets, (snapshot) => {
      setBudgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qSavings = query(collection(db, `users/${user.uid}/savings`));
    const unsubSavings = onSnapshot(qSavings, (snapshot) => {
      setSavings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProfile = onSnapshot(doc(db, `users/${user.uid}`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.currency) setCurrency(data.currency);
        if (data.theme) {
          setTheme(data.theme);
          if (data.theme === "dark") document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        }
        if (data.notificationPrefs) setNotificationPrefs(data.notificationPrefs);
      }
    });

    return () => {
      unsubTrans();
      unsubBudgets();
      unsubSavings();
      unsubProfile();
    };
  }, [user]);

  // --- Currency Conversion Helpers ---
  // Returns formatted string based on user's selected currency
  const formatAmount = (baseUsdAmount) => {
    const amount = Number(baseUsdAmount) || 0;
    if (!exchangeRates) return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const rate = exchangeRates[currency] || 1;
    return (amount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Converts a number to the formatted string representation
  const getConvertedAmount = (baseUsdAmount) => {
    const amount = Number(baseUsdAmount) || 0;
    if (!exchangeRates) return amount;
    const rate = exchangeRates[currency] || 1;
    return amount * rate;
  };

  // When user inputs an amount in their selected currency, convert it to Base (USD) before saving
  const parseAmountToBase = (inputAmount) => {
    const amount = Number(inputAmount) || 0;
    if (!exchangeRates) return amount;
    const rate = exchangeRates[currency] || 1;
    return amount / rate;
  };

  // --- Transaction Handlers ---
  const addTransaction = async (data) => {
    if (!user) return;
    const finalData = {
      ...data,
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, `users/${user.uid}/transactions`), finalData);
  };
  const updateTransaction = async (id, data) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/transactions`, id), data);
  };
  const deleteTransaction = async (id) => {
    if (!user) return;
    const t = transactions.find(tx => tx.id === id);
    if (t && t.category === "Savings Transfer") {
      const prefix = "Transfer to ";
      if (t.title.startsWith(prefix)) {
        const goalName = t.title.substring(prefix.length);
        const goal = savings.find(g => g.name === goalName);
        if (goal) {
          const newCurrent = Math.max(0, goal.current - t.amount);
          await updateDoc(doc(db, `users/${user.uid}/savings`, goal.id), { current: newCurrent });
        }
      }
    }
    await deleteDoc(doc(db, `users/${user.uid}/transactions`, id));
  };

  // --- Budget Handlers ---
  const addBudget = async (data) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/budgets`), data);
  };
  const updateBudget = async (id, data) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/budgets`, id), data);
  };
  const deleteBudget = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/budgets`, id));
  };

  // --- Savings Handlers ---
  const addSavingsGoal = async (data) => {
    if (!user) return;
    await addDoc(collection(db, `users/${user.uid}/savings`), data);
  };
  const updateSavingsGoal = async (id, data) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/savings`, id), data);
  };
  const deleteSavingsGoal = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/savings`, id));
  };

  // --- Preference Handlers ---
  const updateCurrency = async (newCurrency) => {
    if (!user) return;
    setCurrency(newCurrency);
    await setDoc(doc(db, `users/${user.uid}`), { currency: newCurrency }, { merge: true });
  };

  const updateTheme = async (newTheme) => {
    if (!user) return;
    setTheme(newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    await setDoc(doc(db, `users/${user.uid}`), { theme: newTheme }, { merge: true });
  };

  const saveNotificationPrefs = async (prefs) => {
    if (!user) return;
    setNotificationPrefs(prefs);
    await setDoc(doc(db, `users/${user.uid}`), { notificationPrefs: prefs }, { merge: true });
  };

  // --- Advanced Settings Handlers ---
  const updateUserProfile = async (displayName, photoURL) => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName, photoURL });
    setUser({ ...auth.currentUser }); 
  };

  const changeUserPassword = async (currentPassword, newPassword) => {
    if (!user) throw new Error("No user logged in.");
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  };

  const deleteUserAccount = async (currentPassword) => {
    if (!auth.currentUser) throw new Error("No user logged in.");
    
    // 1. Re-authenticate using auth.currentUser (not stale state)
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    const uid = auth.currentUser.uid;

    // 2. Delete all Firestore subcollections by READING directly from Firestore
    // Safer than relying on local state which might be incomplete/out-of-sync
    const collectionsToDelete = ["transactions", "budgets", "savings"];
    
    for (const collectionName of collectionsToDelete) {
      const colRef = collection(db, `users/${uid}/${collectionName}`);
      const snapshot = await getDocs(colRef);
      const batchDeletes = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(batchDeletes);
    }
    
    // 3. Delete the user profile document
    await deleteDoc(doc(db, `users/${uid}`));

    // 4. Delete Firebase Storage avatar if it exists
    if (auth.currentUser.photoURL && auth.currentUser.photoURL.includes("firebasestorage")) {
      try {
        const { ref: storageRef, deleteObject } = await import("firebase/storage");
        const avatarRef = storageRef(storage, auth.currentUser.photoURL);
        await deleteObject(avatarRef);
      } catch (storageErr) {
        // Non-critical: continue even if avatar deletion fails
        console.warn("Could not delete avatar from storage:", storageErr);
      }
    }
    
    // 5. Delete the Firebase Auth user — use auth.currentUser (live reference, not stale state)
    await deleteUser(auth.currentUser);
    
    // 6. Reset local state
    setUser(null);
  };

  // Auth Handlers
  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    setUser(res.user); // Immediately update context with fresh user data (including emailVerified)
    return res;
  };

  const signup = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(res.user, { displayName: name });
    }
    // Send email verification immediately after signup
    await sendEmailVerification(res.user);
    // Keep user logged in but they will be restricted by ProtectedRoute until verified
    return res;
  };

  const sendPasswordReset = async (email) => {
    return await sendPasswordResetEmail(auth, email);
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const sendLoginLink = async (email) => {
    const actionCodeSettings = {
      url: window.location.origin + "/auth-finish",
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  };

  const completeLinkLogin = async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      const result = await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      return result;
    }
  };

  const logout = async () => {
    return await signOut(auth);
  };

  const value = {
    user,
    loadingAuth,
    transactions,
    budgets,
    savings,
    currency,
    currencySymbol,
    theme,
    exchangeRates,
    globalSearch,
    setGlobalSearch,
    notificationPrefs,
    saveNotificationPrefs,
    formatAmount,
    getConvertedAmount,
    parseAmountToBase,
    updateCurrency,
    updateTheme,
    updateUserProfile,
    changeUserPassword,
    deleteUserAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    login,
    signup,
    sendLoginLink,
    completeLinkLogin,
    logout,
    sendPasswordReset,
    resendVerification
  };

  return (
    <GlobalContext.Provider value={value}>
      {loadingAuth ? (
        <div className="flex items-center justify-center h-screen w-full bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </GlobalContext.Provider>
  );
}
