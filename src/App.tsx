import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  FileText,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Sliders,
  Calendar,
  Layers,
  Award,
  AlertTriangle,
  User,
  X,
  Upload,
  CheckCircle,
  HelpCircle,
  Clock,
  LogIn,
  LogOut,
  Key,
  Database,
  UserPlus,
  Mail
} from "lucide-react";
import { FinancialProfile, Transaction, ChatMessage } from "./types";
import { supabase, getSupabaseConfig } from "./supabaseClient";
import AuthInterface from "./components/AuthInterface";

// Import Gmail Client & Google Authentication helpers
import {
  initFirebaseAuth,
  googleSignIn,
  logoutGmail,
  listRecentEmails,
  getGmailAccessToken,
  GmailEmailPreview
} from "./gmailClient";

// Default mockup state values to avoid a blank layout
const DEFAULT_PROFILE: FinancialProfile = {
  name: "Jean Dupont",
  revenu_mensuel: 3500,
  loyer: 800,
  transport: 150,
  alimentation: 450,
  factures: 200,
  loisirs: 300,
  epargne: 8400,
  objectif_nom: "Nouvelle Voiture Électrique",
  objectif_montant: 18000,
};

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    type: "Revenu",
    categorie: "Salaire",
    montant: 3500,
    description: "Virement Salaire Mensuel",
    date_transaction: "2026-05-28",
  },
  {
    id: "tx-2",
    type: "Dépense",
    categorie: "Loyer",
    montant: 800,
    description: "Loyer Appartement T3",
    date_transaction: "2026-05-29",
  },
  {
    id: "tx-3",
    type: "Dépense",
    categorie: "Alimentation",
    montant: 185.5,
    description: "Courses Supermarché Central",
    date_transaction: "2026-05-30",
  },
  {
    id: "tx-4",
    type: "Dépense",
    categorie: "Loisirs",
    montant: 45.0,
    description: "Abonnements Streaming & Fitness",
    date_transaction: "2026-05-31",
  },
  {
    id: "tx-5",
    type: "Dépense",
    categorie: "Transport",
    montant: 65.2,
    description: "Recharge carte carburant",
    date_transaction: "2026-06-01",
  },
  {
    id: "tx-6",
    type: "Dépense",
    categorie: "Factures",
    montant: 120.0,
    description: "Facture d'eau et électricité",
    date_transaction: "2026-06-02",
  },
];

const STARTER_ASSISTANT_REPLY = `Bonjour et bienvenue dans votre **Assistant Financier Personnel**. 👋\n\nJ'ai analysé votre profil de budget mensuel :\n- **Revenu Mensuel** : 3 500 USD\n- **Charges fixes & courantes** : 1 900 USD prévus\n- **Épargne actuelle** : 8 400 USD\n\nVotre objectif est d'acquérir une **Nouvelle Voiture Électrique** d'une valeur de **18 000 USD** (progression actuelle : **46.7%**).\nAu rythme théorique de votre budget actuel, il vous reste environ **1 600 USD d'épargne résiduelle mensuelle**, ce qui vous permettra d'atteindre votre objectif dans précisément **6 mois** !\n\nPosez-moi vos questions ! Par exemple : \n* *"Comment puis-je accélérer mon épargne de 2 mois ?"*\n* *"Analyse mes dernières transactions pour voir mes dépassements"*`;

export default function App() {
  // Supabase states
  const [supabaseConfig, setSupabaseConfig] = useState(() => getSupabaseConfig());
  const [userSession, setUserSession] = useState<any>(null);
  const [bypassAuth, setBypassAuth] = useState(() => {
    return localStorage.getItem("fintech_bypass_auth") === "true";
  });
  
  // Custom Supabase inputs for setup screen
  const [customUrlInput, setCustomUrlInput] = useState(() => localStorage.getItem("custom_supabase_url") || "");
  const [customKeyInput, setCustomKeyInput] = useState(() => localStorage.getItem("custom_supabase_anon_key") || "");
  
  // Authentication states
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // 1. Core States with LocalStorage synchronization
  const [profile, setProfile] = useState<FinancialProfile>(() => {
    const saved = localStorage.getItem("fintech_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("fintech_transactions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_TRANSACTIONS;
      }
    }
    return DEFAULT_TRANSACTIONS;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("fintech_chat");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to initial
      }
    }
    return [
      {
        id: "init-1",
        role: "assistant",
        content: STARTER_ASSISTANT_REPLY,
        timestamp: "12:00",
      },
    ];
  });

  // UI Active tabs:
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "profile" | "projections" | "gmail">("dashboard");

  // Gmail & Google Auth states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [recentEmails, setRecentEmails] = useState<GmailEmailPreview[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [emailToAnalyze, setEmailToAnalyze] = useState<GmailEmailPreview | null>(null);
  const [isParsingEmail, setIsParsingEmail] = useState(false);
  const [parsedCandidate, setParsedCandidate] = useState<Transaction | null>(null);
  const [candidateIsTransaction, setCandidateIsTransaction] = useState<boolean>(true);
  const [scanLimit, setScanLimit] = useState(10);

  // Custom non-blocking Toast notification state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Dialog & helpers state
  const [inputText, setInputText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Form states (Add transaction)
  const [showAddTx, setShowAddTx] = useState(false);
  const [newTx, setNewTx] = useState({
    type: "Dépense" as "Revenu" | "Dépense",
    categorie: "Alimentation",
    montant: "",
    description: "",
    date_transaction: new Date().toISOString().split("T")[0],
  });

  // CSV paste input fallback helper
  const [showCsvHelp, setShowCsvHelp] = useState(false);
  const [csvContentText, setCsvContentText] = useState("");
  const [csvSuccessMsg, setCsvSuccessMsg] = useState("");

  // Projection Simulator adjustments
  const [simulatorExtraSavings, setSimulatorExtraSavings] = useState(0); // modifier slider

  // Chat window anchor ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync back to local storage helper for Gmail
  const handleFetchGmailEmails = async (tokenToUse?: string) => {
    const activeToken = tokenToUse || gmailToken;
    if (!activeToken) return;
    setEmailsLoading(true);
    setGmailError(null);
    try {
      const fetched = await listRecentEmails(activeToken, scanLimit);
      setRecentEmails(fetched);
    } catch (err: any) {
      console.error("Gmail fetch error:", err);
      setGmailError(err.message || "Erreur lors de la récupération des e-mails. Veuillez vous reconnecter.");
    } finally {
      setEmailsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGmailError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGmailToken(result.accessToken);
        // Automatically fetch recent messages
        setEmailsLoading(true);
        try {
          const fetched = await listRecentEmails(result.accessToken, scanLimit);
          setRecentEmails(fetched);
        } catch (fErr) {
          console.error("Auto fetch error:", fErr);
        } finally {
          setEmailsLoading(false);
        }
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setGmailError(err.message || "La connexion avec Google a échoué.");
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutGmail();
      setGoogleUser(null);
      setGmailToken(null);
      setRecentEmails([]);
    } catch (err) {
      console.error("Google logout error:", err);
    }
  };

  const handleAnalyzeEmail = async (email: GmailEmailPreview) => {
    setEmailToAnalyze(email);
    setIsParsingEmail(true);
    setParsedCandidate(null);
    setGmailError(null);
    try {
      const response = await fetch("/api/parse-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: email.subject,
          from: email.from,
          date: email.date,
          body: email.body,
        }),
      });

      if (!response.ok) {
        throw new Error("Impossible de communiquer avec le service d'analyse de courriels.");
      }

      const result = await response.json();
      if (result.is_transaction) {
        setCandidateIsTransaction(true);
        setParsedCandidate({
          id: `gmail-tx-${email.id}`,
          type: result.type || "Dépense",
          categorie: result.categorie || "Alimentation",
          montant: Number(result.montant) || 0,
          description: result.description || email.subject,
          date_transaction: result.date_transaction || new Date().toISOString().split("T")[0],
        });
      } else {
        setCandidateIsTransaction(false);
        setParsedCandidate(null);
      }
    } catch (err: any) {
      console.error("Error analyzing email:", err);
      setGmailError("Une erreur est survenue pendant l'analyse de l'e-mail.");
    } finally {
      setIsParsingEmail(false);
    }
  };

  const handleConfirmCandidateTransaction = async () => {
    if (!parsedCandidate) return;
    
    const payload = {
      ...parsedCandidate,
    };

    setTransactions((prev) => {
      const updated = [payload, ...prev];
      localStorage.setItem("fintech_transactions", JSON.stringify(updated));
      return updated;
    });

    if (userSession?.user && supabase) {
      try {
        await supabase.from("transactions").insert({
          id: payload.id,
          user_id: userSession.user.id,
          type: payload.type,
          categorie: payload.categorie,
          montant: payload.montant,
          description: payload.description,
          date_transaction: payload.date_transaction,
        });
      } catch (err) {
        console.error("Error syncing transaction:", err);
      }
    }

    // Clear state
    setParsedCandidate(null);
    setEmailToAnalyze(null);
  };

  // Listen for Google Auth state from Firebase on mount
  useEffect(() => {
    const unsubscribeGmail = initFirebaseAuth(
      (user, token) => {
        setGoogleUser(user);
        setGmailToken(token);
        // fetch emails with this active token
        listRecentEmails(token, 10)
          .then((fetched) => setRecentEmails(fetched))
          .catch((err) => console.error("Auto fetch Gmail Error:", err));
      },
      () => {
        setGoogleUser(null);
        setGmailToken(null);
      }
    );
    return () => {
      unsubscribeGmail();
    };
  }, []);

  // Auth Effects and Syncload logic
  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      if (session?.user) {
        setBypassAuth(false);
        handleFetchUserData(session.user.id);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
      if (session?.user) {
        setBypassAuth(false);
        handleFetchUserData(session.user.id);
      } else {
        setUserSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseConfig]);

  const handleFetchUserData = async (userId: string) => {
    if (!supabase) return;
    try {
      // Fetch profile
      const { data: pData, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (pError && pError.code === "PGRST116") {
        // Create user profile
        const initialProfile = {
          name: userSession?.user?.user_metadata?.full_name || authName || "Utilisateur Supabase",
          revenu_mensuel: profile.revenu_mensuel,
          loyer: profile.loyer,
          transport: profile.transport,
          alimentation: profile.alimentation,
          factures: profile.factures,
          loisirs: profile.loisirs,
          epargne: profile.epargne,
          objectif_nom: profile.objectif_nom,
          objectif_montant: profile.objectif_montant
        };
        await supabase.from("profiles").insert([{ id: userId, ...initialProfile }]);
        setProfile(initialProfile);
      } else if (pData) {
        setProfile(pData);
      }

      // Fetch transactions
      const { data: tData, error: tError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date_transaction", { ascending: false });

      if (tData) {
        setTransactions(tData);
      }
    } catch (err) {
      console.error("Error loading user data from Supabase:", err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError("Le client Supabase n'est pas configuré. Veuillez entrer des accès valides.");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const email = authEmail.trim();
    const password = authPassword.trim();

    try {
      if (authMode === "signup") {
        if (!authName.trim()) {
          throw new Error("Veuillez saisir votre Nom complet.");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: authName
            }
          }
        });
        if (error) throw error;
        
        if (data.user) {
          const newProfile = {
            name: authName,
            revenu_mensuel: 3500,
            loyer: 800,
            transport: 150,
            alimentation: 450,
            factures: 200,
            loisirs: 300,
            epargne: 8400,
            objectif_nom: "Nouvelle Voiture Électrique",
            objectif_montant: 18000
          };
          const { error: insertErr } = await supabase.from("profiles").upsert({ id: data.user.id, ...newProfile });
          if (insertErr) console.error("Error inserting custom user stats profiles:", insertErr);
          
          setProfile(newProfile);
          setAuthSuccess("Félicitations, votre compte a été créé avec succès ! Connectez-vous maintenant.");
          // Automatically shift to signin so they can log in cleanly
          setAuthMode("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (data.user) {
          setUserSession(data.session);
          setBypassAuth(false);
          localStorage.setItem("fintech_bypass_auth", "false");
          setAuthSuccess("Connexion réussie ! Bon retour.");
          handleFetchUserData(data.user.id);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Erreur d'authentification Supabase.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUserSession(null);
    setBypassAuth(false);
    localStorage.setItem("fintech_bypass_auth", "false");
    setProfile(DEFAULT_PROFILE);
    setTransactions(DEFAULT_TRANSACTIONS);
  };

  const handleSaveCustomKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim() || !customKeyInput.trim()) {
      showToast("Veuillez remplir correctement les adresses et clés d'accès.", "error");
      return;
    }
    localStorage.setItem("custom_supabase_url", customUrlInput.trim());
    localStorage.setItem("custom_supabase_anon_key", customKeyInput.trim());
    localStorage.setItem("fintech_bypass_auth", "false");
    showToast("Informations de connexion enregistrées. Rechargement...");
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleClearCustomKeys = () => {
    localStorage.removeItem("custom_supabase_url");
    localStorage.removeItem("custom_supabase_anon_key");
    localStorage.removeItem("fintech_bypass_auth");
    showToast("Données d'authentification réinitialisées. Retour en mode local.", "info");
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Sync back to local storage (only as backup / non-logged-in sessions fallback)
  useEffect(() => {
    if (!userSession) {
      localStorage.setItem("fintech_profile", JSON.stringify(profile));
    }
  }, [profile, userSession]);

  useEffect(() => {
    if (!userSession) {
      localStorage.setItem("fintech_transactions", JSON.stringify(transactions));
    }
  }, [transactions, userSession]);

  useEffect(() => {
    localStorage.setItem("fintech_chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Calculated budgeting computations
  const totalPlannedExpenses =
    Number(profile.loyer) +
    Number(profile.transport) +
    Number(profile.alimentation) +
    Number(profile.factures) +
    Number(profile.loisirs);

  const potentialMonthlySavings = Math.max(0, Number(profile.revenu_mensuel) - totalPlannedExpenses);

  // Real transactions aggregate calculations
  const totalRevenuesReal = transactions
    .filter((t) => t.type === "Revenu")
    .reduce((sum, t) => sum + Number(t.montant), 0);

  const totalExpensesReal = transactions
    .filter((t) => t.type === "Dépense")
    .reduce((sum, t) => sum + Number(t.montant), 0);

  // Solde Net
  // Formula: Epargne Initiale + Revenus Réels - Dépenses Réelles
  const totalBalanceComputed = Number(profile.epargne) + totalRevenuesReal - totalExpensesReal;

  // Real category spending compared to planned budget for highlighting anomalies
  const actualCategoryExpenses = transactions
    .filter((t) => t.type === "Dépense")
    .reduce((acc: Record<string, number>, t) => {
      const idx = t.categorie.toLowerCase();
      acc[idx] = (acc[idx] || 0) + Number(t.montant);
      return acc;
    }, {});

  // Send message implementation to back/server.ts
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    // Update locally before invoking API
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!customText) setInputText("");
    setIsChatLoading(true);
    setChatError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          financialProfile: profile,
          transactions: transactions,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'appel API.");
      }

      const assistantMsg: ChatMessage = {
        id: "assistant-" + Date.now(),
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || "Impossible de joindre le service de l'IA.");
      // Add standard model fallback error message in the chat
      setMessages((prev) => [
        ...prev,
        {
          id: "assistant-err-" + Date.now(),
          role: "assistant",
          content: `⚠️ **Problème de connexion avec l'IA.**\n\n**Cause probable** : La clé d'API Google Gemini n'est pas encore définie dans vos variables d'environnement, ou votre service n'est pas configuré.\n\n*Note pour l'Afrique centrale (RDC, etc.) : Veillez à ce que le VPN Proton ou équivalent soit activé sur votre ordinateur si nécessaire.*`,
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Add item form validate & register
  const handleAddTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.montant || isNaN(Number(newTx.montant))) {
      showToast("Veuillez saisir un montant valide.", "error");
      return;
    }

    const created: Transaction = {
      id: "tx-" + Date.now(),
      type: newTx.type,
      categorie: newTx.categorie,
      montant: Number(newTx.montant),
      description: newTx.description.trim() || `${newTx.categorie} transaction`,
      date_transaction: newTx.date_transaction,
    };

    if (userSession?.user && supabase) {
      const { error } = await supabase.from("transactions").insert([{
        id: created.id,
        user_id: userSession.user.id,
        type: created.type,
        categorie: created.categorie,
        montant: created.montant,
        description: created.description,
        date_transaction: created.date_transaction
      }]);
      if (error) {
        showToast("Erreur de sauvegarde de la transaction dans Supabase: " + error.message, "error");
        return;
      }
    }

    setTransactions((prev) => [created, ...prev]);
    setNewTx({
      type: "Dépense",
      categorie: "Alimentation",
      montant: "",
      description: "",
      date_transaction: new Date().toISOString().split("T")[0],
    });
    setShowAddTx(false);
    showToast("Transaction enregistrée avec succès !");
  };

  // CSV Auto Importer parser
  const handleImportCsvText = async () => {
    if (!csvContentText.trim()) {
      showToast("Veuillez coller du texte CSV.", "error");
      return;
    }

    const rows = csvContentText.split("\n");
    let addedCount = 0;
    const importedTx: Transaction[] = [];

    rows.forEach((row) => {
      const cols = row.split(",").map((c) => c.trim());
      if (cols.length >= 4) {
        const date = cols[0];
        const typeRaw = cols[1];
        const type: "Revenu" | "Dépense" = typeRaw.match(/revenu/i) ? "Revenu" : "Dépense";
        const cat = cols[2];
        const amt = parseFloat(cols[3]);
        const desc = cols[4] || "";

        if (date && cat && !isNaN(amt)) {
          importedTx.push({
            id: `tx-csv-${Math.random().toString(36).substr(2, 9)}`,
            type,
            categorie: cat,
            montant: amt,
            description: desc,
            date_transaction: date,
          });
          addedCount++;
        }
      }
    });

    if (importedTx.length > 0) {
      if (userSession?.user && supabase) {
        const payload = importedTx.map(t => ({
          id: t.id,
          user_id: userSession.user.id,
          type: t.type,
          categorie: t.categorie,
          montant: t.montant,
          description: t.description,
          date_transaction: t.date_transaction
        }));
        const { error } = await supabase.from("transactions").insert(payload);
        if (error) {
          showToast("Erreur d'import des transactions dans Supabase: " + error.message, "error");
          return;
        }
      }
      setTransactions((prev) => [...importedTx, ...prev]);
      setCsvSuccessMsg(`Succès! ${addedCount} transactions importées avec succès.`);
      setCsvContentText("");
      setTimeout(() => setCsvSuccessMsg(""), 4000);
      showToast(`${addedCount} transactions importées !`);
    } else {
      showToast("Aucune ligne CSV interprétable n'a été détectée.", "error");
    }
  };

  // Reset demo transactions helper
  const handleLoadDemoData = () => {
    triggerConfirm(
      "Charger les données de test",
      "Voulez-vous réinitialiser votre profil et charger les transactions financières de démonstration ?",
      async () => {
        if (userSession?.user && supabase) {
          const { error: pError } = await supabase.from("profiles").upsert({
            id: userSession.user.id,
            name: userSession.user.user_metadata?.full_name || "Jean Dupont",
            revenu_mensuel: DEFAULT_PROFILE.revenu_mensuel,
            loyer: DEFAULT_PROFILE.loyer,
            transport: DEFAULT_PROFILE.transport,
            alimentation: DEFAULT_PROFILE.alimentation,
            factures: DEFAULT_PROFILE.factures,
            loisirs: DEFAULT_PROFILE.loisirs,
            epargne: DEFAULT_PROFILE.epargne,
            objectif_nom: DEFAULT_PROFILE.objectif_nom,
            objectif_montant: DEFAULT_PROFILE.objectif_montant
          });

          if (pError) {
            showToast("Erreur d'initialisation du profil démo sur Supabase: " + pError.message, "error");
            return;
          }

          await supabase.from("transactions").delete().eq("user_id", userSession.user.id);
          const payload = DEFAULT_TRANSACTIONS.map(t => ({
            id: t.id,
            user_id: userSession.user.id,
            type: t.type,
            categorie: t.categorie,
            montant: t.montant,
            description: t.description,
            date_transaction: t.date_transaction
          }));
          const { error: tError } = await supabase.from("transactions").insert(payload);
          if (tError) {
            showToast("Erreur d'insertion des transactions démo: " + tError.message, "error");
            return;
          }
        }
        setProfile(DEFAULT_PROFILE);
        setTransactions(DEFAULT_TRANSACTIONS);
        showToast("Données financières de simulation chargées !");
      }
    );
  };

  // Clean all records
  const handleResetAllData = () => {
    triggerConfirm(
      "Remise à zéro complète",
      "Cette action va effacer définitivement toutes vos transactions enregistrées et réinitialiser vos enveloppes budgétaires.",
      async () => {
        const resetProfile = {
          name: "Nouvel Utilisateur",
          revenu_mensuel: 2000,
          loyer: 500,
          transport: 100,
          alimentation: 300,
          factures: 100,
          loisirs: 100,
          epargne: 1000,
          objectif_nom: "Voyage",
          objectif_montant: 5000,
        };

        if (userSession?.user && supabase) {
          const { error: pError } = await supabase.from("profiles").upsert({
            id: userSession.user.id,
            ...resetProfile
          });
          if (pError) console.error("Error resetting profile on Supabase:", pError);

          const { error: tError } = await supabase.from("transactions").delete().eq("user_id", userSession.user.id);
          if (tError) console.error("Error resetting transactions on Supabase:", tError);
        }

        setProfile(resetProfile);
        setTransactions([]);
        setMessages([
          {
            id: "init-empty",
            role: "assistant",
            content: "Données locales remises à zéro ! Comment puis-je vous aider à structurer vos nouveaux objectifs ?",
            timestamp: "12:00",
          },
        ]);
        showToast("Toutes vos données ont été remises à zéro.", "info");
      }
    );
  };

  // Profile update handler
  const handleSaveProfile = async (updated: FinancialProfile) => {
    if (userSession?.user && supabase) {
      const { error } = await supabase.from("profiles").upsert({
        id: userSession.user.id,
        name: updated.name,
        revenu_mensuel: updated.revenu_mensuel,
        loyer: updated.loyer,
        transport: updated.transport,
        alimentation: updated.alimentation,
        factures: updated.factures,
        loisirs: updated.loisirs,
        epargne: updated.epargne,
        objectif_nom: updated.objectif_nom,
        objectif_montant: updated.objectif_montant
      });
      if (error) {
        showToast("Erreur de mise à jour du profil Supabase: " + error.message, "error");
        return;
      }
    }
    setProfile(updated);
    showToast("Profil financier sauvegardé avec succès !");
  };

  // Quick suggestions prompt shooter
  const handleQuickPromptClick = (topicPrompt: string) => {
    setInputText("");
    handleSendMessage(topicPrompt);
  };

  // Simple custom Markdown previewer helper
  const renderMarkdownText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      // List pattern bullet
      const isBullet = content.trim().startsWith("*") || content.trim().startsWith("-");
      if (isBullet) {
        content = content.replace(/^(\s*[*|-]\s*)/, "");
      }

      // Bold pattern replace **text** with <strong>text</strong>
      const parts = content.split(/\*\*([^*]+)\*\*/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-bold text-slate-900 border-b border-indigo-100">{part}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed my-1">
            {renderedParts}
          </li>
        );
      }

      if (line.startsWith("###")) {
        return (
          <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-indigo-700 mt-4 mb-2">
            {content.slice(3).trim()}
          </h4>
        );
      }

      if (line.trim() === "") {
        return <div key={idx} className="h-2"></div>;
      }

      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed my-1">
          {renderedParts}
        </p>
      );
    });
  };

  if (!userSession && !bypassAuth) {
    return (
      <AuthInterface
        onAuthSuccess={({ user, profile }) => {
          setUserSession({ user });
          setBypassAuth(false);
          localStorage.setItem("fintech_bypass_auth", "false");
          if (profile) setProfile(profile);
        }}
        onContinueOffline={() => {
          setBypassAuth(true);
          localStorage.setItem("fintech_bypass_auth", "true");
        }}
        customSupabaseConfig={
          supabaseConfig.url && supabaseConfig.anonKey
            ? { url: supabaseConfig.url, key: supabaseConfig.anonKey }
            : null
        }
        onSaveCustomConfig={(url, key) => {
          localStorage.setItem("custom_supabase_url", url);
          localStorage.setItem("custom_supabase_anon_key", key);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div id="financial-workspace" className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans">
      
      {/* 3. Sidebar Navigation Container */}
      <nav id="left-nav" className="w-[72px] bg-[#0F172A] flex flex-col items-center py-6 gap-8 border-r border-slate-200 shrink-0">
        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl font-display">
          A
        </div>
        
        <div className="flex flex-col gap-6 flex-1 justify-center">
          {/* Dashboard Icon */}
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            title="Tableau de bord"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              activeTab === "dashboard"
                ? "bg-slate-800 text-indigo-400 border-l-4 border-indigo-500"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Transactions Manager Icon */}
          <button
            id="nav-tab-transactions"
            onClick={() => setActiveTab("transactions")}
            title="Transactions"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              activeTab === "transactions"
                ? "bg-slate-800 text-indigo-400 border-l-4 border-indigo-500"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <DollarSign className="w-5 h-5" />
          </button>

          {/* Configuration Form Icon */}
          <button
            id="nav-tab-profile"
            onClick={() => setActiveTab("profile")}
            title="Profil & Budgets"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              activeTab === "profile"
                ? "bg-slate-800 text-indigo-400 border-l-4 border-indigo-500"
                 : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="w-5 h-5" />
          </button>

          {/* Forecast Predictions Icon */}
          <button
            id="nav-tab-projections"
            onClick={() => setActiveTab("projections")}
            title="Projections d'Épargne"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              activeTab === "projections"
                ? "bg-slate-800 text-indigo-400 border-l-4 border-indigo-500"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </button>

          {/* Gmail Smart Import */}
          <button
            id="nav-tab-gmail"
            onClick={() => setActiveTab("gmail")}
            title="Sycnhronisation Gmail (IA)"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              activeTab === "gmail"
                ? "bg-slate-800 text-indigo-400 border-l-4 border-indigo-500"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Mail className="w-5 h-5" />
          </button>
        </div>

        {/* Global Reset and Info indicators */}
        <div className="mt-auto flex flex-col gap-4 items-center">
          <button
            id="reset-state-btn"
            onClick={handleLoadDemoData}
            title="Charger données démo"
            className="w-10 h-10 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* User profile initial avatar */}
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-300 font-bold text-xs" title={profile.name}>
            {profile.name ? profile.name.split(" ").map((n) => n[0]).join("") : "JD"}
          </div>
        </div>
      </nav>

      {/* Main Content Pane */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Work Space Section */}
        <div id="workspace-center" className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
          
          {/* Top Status Header */}
          <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest font-black text-slate-400">Finances Personnelles</span>
              <span className="text-slate-300">/</span>
              <h1 className="text-base font-bold text-slate-800">
                {activeTab === "dashboard" && "Tableau de Bord Global"}
                {activeTab === "transactions" && "Registre de Transactions"}
                {activeTab === "profile" && "Configuration des Budgets & Objectifs"}
                {activeTab === "projections" && "Simulation de Projections Financières"}
                {activeTab === "gmail" && "Synchronisation Intelligente Gmail"}
              </h1>
            </div>

            {/* Geographical helper + status checks */}
            <div className="flex items-center gap-4">
              {userSession?.user ? (
                <div id="logged-user-header" className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100 py-1.5 pl-3.5 pr-1.5 rounded-full leading-none shrink-0 animate-fadeIn">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Connecté</span>
                    <span className="text-xs font-extrabold text-slate-800">{userSession.user.user_metadata?.full_name || profile.name || "Utilisateur"}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    title="Se déconnecter de Supabase"
                    className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-full transition-colors border border-slate-200 shadow-sm flex items-center justify-center cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div id="unlogged-user-header" className="flex items-center gap-3">
                  <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                    Mode Démo Local
                  </span>
                  <button
                    onClick={() => {
                      setBypassAuth(false);
                      localStorage.setItem("fintech_bypass_auth", "false");
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-slate-900 border border-indigo-500/10 text-white rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/10 cursor-pointer uppercase tracking-wider"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Connexion / S'inscrire
                  </button>
                </div>
              )}

              <div 
                id="api-status-pill"
                className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold shrink-0"
                title="Service local ou Proton VPN requis pour la République Démocratique du Congo."
              >
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                IA CONNECTÉE
              </div>
            </div>
          </header>

          {/* Dynamic Screen router */}
          <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
            {/* Screen 1: Dashboard View */}
            {activeTab === "dashboard" && (
              <div id="screen-dashboard" className="flex flex-col gap-6">
                
                {/* Greeting banner with overview parameters */}
                <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/10">
                    <Award className="w-64 h-64 text-indigo-200" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Aperçu du Budget Familial</span>
                  <h2 className="text-xl font-bold mt-1 font-display">Bienvenue, {profile.name} !</h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Votre budget mensuel est actuellement réglé sur <strong className="text-slate-100">{profile.revenu_mensuel} USD</strong> de revenus fixes. Vos dépenses courantes déclarées consomment environ <strong className="text-slate-100">{totalPlannedExpenses} USD</strong> de ce total par mois, laissant une épargne résiduelle planifiée de <strong className="text-indigo-300 font-semibold">{potentialMonthlySavings} USD</strong>.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      onClick={() => setActiveTab("profile")}
                      className="px-3 bg-white/10 hover:bg-white/20 text-slate-100 rounded-lg text-xs py-1.5 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Ajuster les enveloppes budgets
                    </button>
                    <button
                      onClick={() => {
                        const confirmPrompt = "Analyse mon budget actuel, mes transactions, et propose moi 3 astuces pour dépenser moins.";
                        handleSendMessage(confirmPrompt);
                      }}
                      className="px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs py-1.5 font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/10"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Demander une analyse IA
                    </button>
                  </div>
                </div>

                {/* Main Asymmetric Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* LEFT COLUMN: Estimated Balances and Transactions Ledger (Spans 7/12) */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    
                    {/* Compact KPI side-by-side inside left area */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
                      {/* KPI 1 : Solde Actuel */}
                      <div id="card-solde" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Solde Total Estimé</p>
                            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                              <DollarSign className="w-4 h-4" />
                            </div>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 mt-2 font-display">
                            {totalBalanceComputed.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD
                          </h3>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-550">Calcul en temps réel :</span>
                          <span className="font-mono text-emerald-605 font-bold">
                            {profile.epargne} + {totalRevenuesReal} - {totalExpensesReal}
                          </span>
                        </div>
                      </div>

                      {/* KPI 2 : Dépenses Réelles */}
                      <div id="card-depenses" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dépenses Réelles</p>
                            <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                              <TrendingDown className="w-4 h-4" />
                            </div>
                          </div>
                          <h3 className="text-xl font-black text-slate-900 mt-2 font-display">
                            {totalExpensesReal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD
                          </h3>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                          Total théorique alloué : <strong className="text-slate-700">{totalPlannedExpenses} USD</strong>
                        </div>
                      </div>

                    </div>

                    {/* Transaction Ledger Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                          <h3 className="font-bold text-slate-805 text-sm font-display">Registre des Transactions</h3>
                          <span className="text-[10px] text-slate-400 mt-0.5">Vos dernières entrées et sorties d'argent</span>
                        </div>
                        <button 
                          onClick={() => setActiveTab("transactions")}
                          className="text-[10.5px] font-bold text-indigo-650 uppercase tracking-widest hover:underline"
                        >
                          Gérer ({transactions.length})
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100 flex-1 max-h-[350px] overflow-y-auto">
                        {transactions.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                            Aucune transaction n'a encore été enregistrée. Chargez les données démo !
                          </div>
                        ) : (
                          transactions.slice(0, 5).map((t) => (
                            <div key={t.id} className="p-4 hover:bg-slate-50/50 flex items-center justify-between transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold leading-none ${
                                  t.type === "Revenu" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-705"
                                }`}>
                                  {t.type === "Revenu" ? "R" : "D"}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{t.description}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {t.date_transaction}
                                    </span>
                                    <span className="text-slate-350">•</span>
                                    <span className="text-[10px] text-slate-500 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                      {t.categorie}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className={`text-xs font-black shrink-0 ml-4 ${
                                t.type === "Revenu" ? "text-emerald-650" : "text-rose-500"
                              }`}>
                                {t.type === "Revenu" ? "+" : "-"}{t.montant} USD
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-5 py-4 bg-slate-50/80 border-t border-slate-150 flex justify-between items-center shrink-0">
                        <span className="text-[11px] text-slate-550 font-medium">Besoin de saisir un mouvement manuellement ?</span>
                        <button 
                          onClick={() => {
                            setActiveTab("transactions");
                            setShowAddTx(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Ajouter
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN: Goal Progress and Budget Allocation Limits (Spans 5/12) */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    
                    {/* Goal Progress Card relocated beautifully */}
                    <div id="card-epargne" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Suivi d'Épargne & Progrès</span>
                            <h4 className="font-extrabold text-slate-800 text-sm font-display mt-0.5">Disponibilité Initiale</h4>
                          </div>
                          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-650 shrink-0">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">
                          {profile.epargne.toLocaleString("fr-FR")} USD
                        </h3>
                      </div>
                      
                      <div className="mt-3.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                          <span className="truncate max-w-[150px]">Cible : {profile.objectif_nom || "Non défini"}</span>
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-black">{Math.round((profile.epargne / Math.max(1, profile.objectif_montant)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.round((profile.epargne / Math.max(1, profile.objectif_montant)) * 100))}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1.5 text-right font-semibold">
                          Objectif final : {profile.objectif_montant} USD
                        </span>
                      </div>
                    </div>

                    {/* Category Budget Envelope list */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                      <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2 font-display">
                        <CheckCircle className="w-4 h-4 text-indigo-550" /> Allocation vs Dépenses Réelles
                      </h3>

                      <div className="flex flex-col gap-4 flex-1">
                        
                        {[
                          { label: "Loyer", key: "loyer", planned: profile.loyer, color: "indigo" },
                          { label: "Alimentation", key: "alimentation", planned: profile.alimentation, color: "amber" },
                          { label: "Transport", key: "transport", planned: profile.transport, color: "slate" },
                          { label: "Factures", key: "factures", planned: profile.factures, color: "purple" },
                          { label: "Loisirs", key: "loisirs", planned: profile.loisirs, color: "blue" },
                        ].map((item) => {
                          const realSpent = actualCategoryExpenses[item.label.toLowerCase()] || 0;
                          const pctOfLimit = Math.round((realSpent / Math.max(1, item.planned)) * 100);
                          const isExceeded = realSpent > item.planned;

                          return (
                            <div key={item.key} className="text-xs">
                              <div className="flex justify-between items-center mb-1 font-medium">
                                <span className="text-slate-700 font-semibold">{item.label}</span>
                                <span className="font-semibold text-slate-900">
                                  {realSpent} USD <span className="text-slate-400 font-normal">/ {item.planned} USD</span>
                                </span>
                              </div>
                              
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isExceeded ? "bg-red-500" : "bg-indigo-500"
                                  }`}
                                  style={{ width: `${Math.min(100, pctOfLimit)}%` }}
                                ></div>
                              </div>

                              <div className="flex justify-between items-center mt-1 text-[9px] font-bold">
                                <span>Consommé : {pctOfLimit}%</span>
                                {isExceeded ? (
                                  <span className="text-red-500 flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" /> Budget Dépassé !
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium">Reste : {(item.planned - realSpent).toFixed(1)} USD</span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      </div>

                      <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-500 leading-relaxed font-sans">
                        💡 <strong>Indicateur d'analyse :</strong> Les dépassements budgétaires d'enveloppes affectent de manière prédictive vos capacités d'atteinte d'objectifs d'épargne finale.
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* Screen 2: Transactions view with filter, CSV input, and table */}
            {activeTab === "transactions" && (
              <div id="screen-transactions" className="flex flex-col gap-6">
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-display">Tous vos mouvements financiers</h2>
                    <p className="text-xs text-slate-500">Ajoutez, filtrez vos dépenses ou importez vos données bancaires au format standard CSV.</p>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAddTx(!showAddTx)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-100 shadow-sm transition-colors"
                    >
                      {showAddTx ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {showAddTx ? "Fermer le formulaire" : "Nouvelle Transaction"}
                    </button>
                    
                    <button
                      onClick={() => setShowCsvHelp(!showCsvHelp)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Importer CSV
                    </button>
                  </div>
                </div>

                {/* CSV Importer Drawer section */}
                {showCsvHelp && (
                  <div className="bg-white border border-slate-200 p-5 rounded-xl text-xs flex flex-col gap-3 shadow-md animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">Zone d'import CSV instantanée</h4>
                      <button onClick={() => setShowCsvHelp(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-slate-500">
                      Collez vos lignes de transactions ci-dessous au format brut pour alimenter votre tableau de bord.
                      <br /><strong>Format exigé :</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">Date,Type(Revenu/Dépense),Catégorie,Montant,Description</code>
                    </p>

                    <div className="text-[10px] text-slate-400 font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                      Exemple :
                      <br />2026-06-03, Dépense, Alimentation, 42.50, Achat épicerie bio
                      <br />2026-06-04, Revenu, Autre, 150.00, Remboursement mutuelle
                    </div>

                    <textarea
                      placeholder="Collez vos lignes CSV ici..."
                      value={csvContentText}
                      onChange={(e) => setCsvContentText(e.target.value)}
                      rows={4}
                      className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setCsvContentText(`2026-06-03, Dépense, Alimentation, 42.50, Achat épicerie bio\n2026-06-04, Revenu, Autre, 150.00, Remboursement mutuelle`)}
                        className="px-3 py-1.5 text-slate-500 font-medium hover:text-slate-700"
                      >
                        Remplir l'exemple
                      </button>
                      <button 
                        onClick={handleImportCsvText}
                        className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                      >
                        Enregistrer l'import
                      </button>
                    </div>
                  </div>
                )}

                {csvSuccessMsg && (
                  <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 p-3 rounded-lg text-xs font-semibold">
                    {csvSuccessMsg}
                  </div>
                )}

                {/* Add Transaction Drawer */}
                {showAddTx && (
                  <form onSubmit={handleAddTxSubmit} className="bg-gradient-to-tr from-slate-50 to-white p-5 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Ajouter un mouvement manuellement</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      
                      {/* Form Field 1: Type */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Type</label>
                        <select
                          value={newTx.type}
                          onChange={(e) => setNewTx({ ...newTx, type: e.target.value as "Revenu" | "Dépense" })}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Dépense">Dépense (Débit)</option>
                          <option value="Revenu">Revenu (Crédit)</option>
                        </select>
                      </div>

                      {/* Form Field 2: Categorie */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Catégorie</label>
                        <select
                          value={newTx.categorie}
                          onChange={(e) => setNewTx({ ...newTx, categorie: e.target.value })}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          {newTx.type === "Revenu" ? (
                            <>
                              <option value="Salaire">Salaire</option>
                              <option value="Investissement">Investissement</option>
                              <option value="Autre">Autre</option>
                            </>
                          ) : (
                            <>
                              <option value="Alimentation">Alimentation</option>
                              <option value="Loyer">Loyer</option>
                              <option value="Transport">Transport</option>
                              <option value="Factures">Factures</option>
                              <option value="Loisirs">Loisirs</option>
                              <option value="Autre">Autre</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Form Field 3: Montant */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Montant (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Donnez la somme..."
                          value={newTx.montant}
                          onChange={(e) => setNewTx({ ...newTx, montant: e.target.value })}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      {/* Form Field 4: Description */}
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Description / Destinataire</label>
                        <input
                          type="text"
                          required
                          placeholder="ex: Courses Leclerc, Virement mutuelle..."
                          value={newTx.description}
                          onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setShowAddTx(false)}
                        className="px-3.5 py-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold"
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit"
                        className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-semibold shadow-sm"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                )}

                {/* Main Table Content */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Registre des Bilans</span>
                    <span className="text-[10px] font-bold text-slate-400">Total : {transactions.length} transactions</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                          <th className="py-3 px-6">Date</th>
                          <th className="py-3 px-6">Bénéficiaire / Description</th>
                          <th className="py-3 px-6">Type</th>
                          <th className="py-3 px-6">Catégorie</th>
                          <th className="py-3 px-6 text-right">Montant</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-slate-100">
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                              Aucune transaction dans vos registres. Cliquez sur "Charger données démo" ou "Nouvelle Transaction".
                            </td>
                          </tr>
                        ) : (
                          transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-6 font-mono text-slate-500 whitespace-nowrap">
                                {t.date_transaction}
                              </td>
                              <td className="py-3.5 px-6 font-bold text-slate-800">
                                {t.description}
                              </td>
                              <td className="py-3.5 px-6">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  t.type === "Revenu" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                                }`}>
                                  {t.type === "Revenu" ? "Revenu" : "Dépense"}
                                </span>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  t.categorie === "Alimentation" ? "bg-amber-50 text-amber-600" :
                                  t.categorie === "Salaire" || t.categorie === "Revenu" ? "bg-emerald-50 text-emerald-600" :
                                  t.categorie === "Loisirs" ? "bg-blue-50 text-blue-600" :
                                  t.categorie === "Factures" ? "bg-purple-50 text-purple-600" :
                                  t.categorie === "Loyer" ? "bg-indigo-50 text-indigo-600" :
                                  "bg-slate-100 text-slate-600"
                                }`}>
                                  {t.categorie}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-right font-black">
                                <span className={t.type === "Revenu" ? "text-emerald-600" : "text-rose-500"}>
                                  {t.type === "Revenu" ? "+" : "-"}{t.montant.toFixed(2)} USD
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => {
                                    triggerConfirm(
                                      "Supprimer la transaction",
                                      "Êtes-vous sûr de vouloir supprimer définitivement cette transaction ?",
                                      async () => {
                                        if (userSession?.user && supabase) {
                                          const { error } = await supabase.from("transactions").delete().eq("id", t.id);
                                          if (error) {
                                            showToast("Erreur lors de la suppression de la transaction sur Supabase: " + error.message, "error");
                                            return;
                                          }
                                        }
                                        setTransactions(transactions.filter((item) => item.id !== t.id));
                                        showToast("Transaction effacée avec succès.");
                                      }
                                    );
                                  }}
                                  className="text-[10px] font-semibold text-rose-500 hover:text-rose-700 px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                                >
                                  Effacer
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                    <button 
                      onClick={() => {
                        triggerConfirm(
                          "Remise à zéro complète",
                          "Attention: cela effacera définitivement toutes vos transactions du registre.",
                          async () => {
                            if (userSession?.user && supabase) {
                              const { error } = await supabase.from("transactions").delete().eq("user_id", userSession.user.id);
                              if (error) {
                                showToast("Erreur Supabase lors de la suppression : " + error.message, "error");
                                return;
                              }
                            }
                            setTransactions([]);
                            showToast("Registre complet réinitialisé !", "info");
                          }
                        );
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wider"
                    >
                      Remise à zéro du registre complet
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Screen 3: Financial settings / interactive custom forms */}
            {activeTab === "profile" && (
              <div id="screen-profile" className="flex flex-col gap-6">
                
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">Ajustement du profil financier</h2>
                  <p className="text-xs text-slate-500">Mettez à jour vos revenus et configurez des enveloppes de limites budgétaires strictes pour guider les calculs de l'IA.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left sub-column: Budget form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveProfile(profile);
                    }}
                    className="md:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-5"
                  >
                    <h3 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-500" /> Éléments de Budget Actifs
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Votre Nom Complet</label>
                        <input
                          type="text"
                          required
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Revenu Mensuel Fixe (USD)</label>
                        <input
                          type="number"
                          required
                          value={profile.revenu_mensuel}
                          onChange={(e) => setProfile({ ...profile, revenu_mensuel: Number(e.target.value) })}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Loyer / Logement Mensuel</label>
                        <input
                          type="number"
                          required
                          value={profile.loyer}
                          onChange={(e) => setProfile({ ...profile, loyer: Number(e.target.value) })}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Alimentation Limite</label>
                        <input
                          type="number"
                          required
                          value={profile.alimentation}
                          onChange={(e) => setProfile({ ...profile, alimentation: Number(e.target.value) })}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Transport & Carburant</label>
                        <input
                          type="number"
                          required
                          value={profile.transport}
                          onChange={(e) => setProfile({ ...profile, transport: Number(e.target.value) })}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Factures & Abonnements</label>
                        <input
                          type="number"
                          required
                          value={profile.factures}
                          onChange={(e) => setProfile({ ...profile, factures: Number(e.target.value) })}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Budget Loisirs mensuel</label>
                        <input
                          type="number"
                          required
                          value={profile.loisirs}
                          onChange={(e) => setProfile({ ...profile, loisirs: Number(e.target.value) })}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Épargne Actuelle de Départ</label>
                        <input
                          type="number"
                          required
                          value={profile.epargne}
                          onChange={(e) => setProfile({ ...profile, epargne: Number(e.target.value) })}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                        />
                      </div>

                    </div>

                    {/* Goal detail sub-section */}
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex flex-col gap-3 mt-2">
                      <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wide flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-indigo-600" /> Objectif Personnel Principal
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Nom de l'objectif</label>
                          <input
                            type="text"
                            required
                            placeholder="ex: Apport Immobilier, Vacances..."
                            value={profile.objectif_nom}
                            onChange={(e) => setProfile({ ...profile, objectif_nom: e.target.value })}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Montant Requis (USD)</label>
                          <input
                            type="number"
                            required
                            placeholder="ex: 15000..."
                            value={profile.objectif_montant}
                            onChange={(e) => setProfile({ ...profile, objectif_montant: Number(e.target.value) })}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <button 
                        type="button"
                        onClick={handleResetAllData}
                        className="text-xs text-rose-500 font-bold hover:underline"
                      >
                        Effacer tout
                      </button>
                      <button 
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100"
                      >
                        Enregistrer modifications
                      </button>
                    </div>
                  </form>

                  {/* Right sub-column: Budget rules summary explanation card */}
                  <div className="md:col-span-5 flex flex-col gap-5">
                    
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Récapitulatif de vos charges fixes</h3>
                      
                      <div className="flex flex-col gap-2.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Revenu Mensuel :</span>
                          <span className="font-mono font-bold text-slate-800">{profile.revenu_mensuel} USD</span>
                        </div>
                        <div className="flex justify-between text-rose-600">
                          <span>Charges Globales Prévues :</span>
                          <span className="font-mono font-bold">-{totalPlannedExpenses} USD</span>
                        </div>
                        <hr className="border-slate-100 my-1" />
                        <div className="flex justify-between font-bold text-emerald-600 text-sm">
                          <span>Épargne Théorique / Mois :</span>
                          <span className="font-mono">{potentialMonthlySavings} USD</span>
                        </div>
                      </div>

                      {/* Diagnostic score widget */}
                      <div className="mt-5 p-4.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 flex items-center justify-center font-bold text-indigo-700 font-display shrink-0">
                          {Math.round((potentialMonthlySavings / Math.max(1, profile.revenu_mensuel)) * 100)}%
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">Taux d'Épargne Estimé</h4>
                          <p className="text-[11px] text-slate-500 mt-1">Sain si supérieur à 15%. La microfinance recommande 20%.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-950 p-5 rounded-xl text-white shadow-sm relative overflow-hidden">
                      <h3 className="font-bold font-display text-sm mb-2 text-indigo-300">Pourquoi ces données ?</h3>
                      <p className="text-[11px] text-slate-200 leading-relaxed mb-3">
                        Ces chiffres ne quittent pas votre session de stockage local React. L'enveloppe système sert de "Instruction Directe Contextuelle" pour le chatbot Gemini. L'IA sera ainsi en mesure de simuler un diagnostic immédiat en cas d'un écart sur vos achats ou impératifs familiaux RDC.
                      </p>
                      <span className="text-[9px] text-[#818CF8] uppercase tracking-widest font-bold">Protégé localement</span>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* Screen 4: Forecast SVG interactive projections */}
            {activeTab === "projections" && (
              <div id="screen-projections" className="flex flex-col gap-6">
                
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">Simulateur Prédictif d'Épargne</h2>
                  <p className="text-xs text-slate-500">
                    Projetez l'évolution de votre épargne sur les 12 prochains mois en fonction de vos efforts de réduction de dépenses.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  
                  {/* Slider Control to simulate extra savings effort */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-700">Effort d'épargne mensuel supplémentaire :</span>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                          +{simulatorExtraSavings} USD / mois
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        step="50"
                        value={simulatorExtraSavings}
                        onChange={(e) => setSimulatorExtraSavings(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Frugalité Standard (0$)</span>
                        <span>Effort Intense (+1000$)</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shrink-0 min-w-[170px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Nouvel Apport / mois :</span>
                      <strong className="text-base text-slate-900 font-black">
                        {(potentialMonthlySavings + simulatorExtraSavings).toLocaleString()} USD
                      </strong>
                    </div>
                  </div>

                  {/* SVG Line Graph representation */}
                  <div className="mb-6 h-[220px] w-full border border-slate-100 rounded-lg p-2 bg-slate-50 relative">
                    <span className="absolute top-2 left-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trajectoire sur 12 Mois (Projection linéaire)</span>
                    
                    {/* SVG draw */}
                    <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                      
                      {/* Standard trajectory line (saving rate potentialMonthlySavings) */}
                      {(() => {
                        const points: string[] = [];
                        const optimizedPoints: string[] = [];
                        const stepX = 500 / 12;
                        
                        // Scale logic
                        const maxVal = Math.max(10000, profile.epargne + (potentialMonthlySavings + 1000) * 12);
                        const minVal = profile.epargne;
                        const calculateY = (val: number) => {
                          const range = maxVal - minVal;
                          const pct = (val - minVal) / (range || 1);
                          return 180 - pct * 150; // clamp inside canvas with safety margin
                        };

                        for (let m = 0; m <= 12; m++) {
                          const valStandard = profile.epargne + potentialMonthlySavings * m;
                          const valOptimized = profile.epargne + (potentialMonthlySavings + simulatorExtraSavings) * m;
                          
                          const x = m * stepX;
                          points.push(`${x},${calculateY(valStandard)}`);
                          optimizedPoints.push(`${x},${calculateY(valOptimized)}`);
                        }

                        return (
                          <>
                            {/* Target horizontal line for objective_montant */}
                            {profile.objectif_montant > profile.epargne && (
                              <>
                                <line 
                                  x1="0" 
                                  y1={calculateY(profile.objectif_montant)} 
                                  x2="500" 
                                  y2={calculateY(profile.objectif_montant)} 
                                  stroke="#818CF8" 
                                  strokeWidth="1.5" 
                                  strokeDasharray="4,4" 
                                />
                                <text 
                                  x="10" 
                                  y={calculateY(profile.objectif_montant) - 4} 
                                  fill="#4F46E5" 
                                  className="text-[8px] font-bold"
                                >
                                  Cible : {profile.objectif_montant} USD
                                </text>
                              </>
                            )}

                            {/* Line Standard (Dotted grey) */}
                            <polyline
                              fill="none"
                              stroke="#cbd5e1"
                              strokeWidth="2"
                              strokeDasharray="2,2"
                              points={points.join(" ")}
                            />

                            {/* Line Optimized (Solid blue/indigo) */}
                            <polyline
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth="3.5"
                              points={optimizedPoints.join(" ")}
                            />

                            {/* Area fill for optimized */}
                            <polygon
                              fill="rgba(99, 102, 241, 0.05)"
                              points={`0,180 ${optimizedPoints.join(" ")} 500,180`}
                            />
                          </>
                        );
                      })()}
                    </svg>

                    {/* Timeline months footer label inside graph */}
                    <div className="absolute bottom-1 w-full flex justify-between px-2 text-[9px] text-slate-400 font-mono">
                      <span>Mois 0 (Actuel)</span>
                      <span>Mois 3</span>
                      <span>Mois 6</span>
                      <span>Mois 9</span>
                      <span>Mois 12</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Durée estimée d'acquisition</h4>
                      
                      {(() => {
                        const targetRemaining = Math.max(0, profile.objectif_montant - profile.epargne);
                        const rateStandard = potentialMonthlySavings || 1;
                        const rateOptimized = potentialMonthlySavings + simulatorExtraSavings || 1;

                        const monthsStandard = Math.ceil(targetRemaining / rateStandard);
                        const monthsOptimized = Math.ceil(targetRemaining / rateOptimized);

                        const gain = Math.max(0, monthsStandard - monthsOptimized);

                        return (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                              <span>Vitesse standard :</span>
                              <span className="font-bold text-slate-800">{monthsStandard} mois</span>
                            </div>
                            <div className="flex justify-between text-xs text-indigo-700 font-semibold mb-1">
                              <span>Vitesse simulée :</span>
                              <span className="font-black text-indigo-600">{monthsOptimized} mois</span>
                            </div>
                            {gain > 0 && (
                              <div className="mt-2.5 px-2 py-1 bg-indigo-50 text-indigo-800 font-black text-[10px] rounded inline-block">
                                🎉 Gain de temps estimé : {gain} mois !
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="p-4 bg-indigo-50 text-indigo-950 rounded-xl flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                          <Sparkles className="w-4 h-4" /> Solliciter l'analyse du plan d'attaque ?
                        </h4>
                        <p className="text-[11px] text-slate-700 leading-relaxed mt-2">
                          Cliquez sur le bouton ci-dessous pour injecter cette simulation comme requête prioritaire auprès du chatbot intelligent.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          const simPrompt = `J'ai fait une simulation d'épargne sur l'outil. Avec mon épargne standard de ${potentialMonthlySavings} USD et un effort additionnel de ${simulatorExtraSavings} USD, mon apport passe à ${potentialMonthlySavings + simulatorExtraSavings} USD par mois pour acquérir mon projet : "${profile.objectif_nom}" (${profile.objectif_montant} USD). Est-ce un plan réaliste par rapport à mes revenus ? Donne moi ton plan d'attaque !`;
                          handleSendMessage(simPrompt);
                        }}
                        className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs tracking-wide transition-colors"
                      >
                        Soumettre la simulation à l'IA
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* Screen 5: Gmail Smart Import */}
            {activeTab === "gmail" && (
              <div id="screen-gmail" className="flex flex-col gap-6 animate-fadeIn text-slate-900">
                
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">Synchronisation Intelligente Gmail API</h2>
                  <p className="text-xs text-slate-500">Connectez vos courriels d'achats, fiches de paie ou factures d'abonnements pour que l'intelligence artificielle les répertorie automatiquement dans vos comptes.</p>
                </div>

                {!googleUser ? (
                  <div id="screen-gmail-disconnected" className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-6 gap-6">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100">
                      <Mail className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 font-display">Connecter votre boîte Gmail</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
                        Associez temporairement votre compte Gmail pour scanner directement vos factures et virement reçus. Vos courriels sont décodés en mémoire vive de façon confidentielle sans aucun stockage sur des serveurs distants.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition-all cursor-pointer select-none outline-none font-sans"
                    >
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0" style={{ display: "block" }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                      <span>Activer l'importation par Gmail</span>
                    </button>

                    {gmailError && (
                      <div className="text-rose-500 text-xs font-semibold bg-rose-50 border border-rose-100 p-3 rounded-lg leading-normal">
                        ⚠️ {gmailError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div id="gmail-session-header" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {googleUser.photoURL ? (
                          <img src={googleUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-205" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 bg-indigo-500 text-white font-bold rounded-full flex items-center justify-center">
                            {googleUser.displayName ? googleUser.displayName[0] : "G"}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 text-sm">{googleUser.displayName || "Utilisateur Google"}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">Gmail Connecté</span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono mt-0.5">{googleUser.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-400 font-bold whitespace-nowrap">Scan :</label>
                          <select
                            value={scanLimit}
                            onChange={(e) => {
                              const limit = Number(e.target.value);
                              setScanLimit(limit);
                            }}
                            className="p-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-semibold"
                          >
                            <option value="5">5 récents</option>
                            <option value="10">10 récents</option>
                            <option value="15">15 récents</option>
                            <option value="20">20 récents</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleFetchGmailEmails()}
                          disabled={emailsLoading}
                          title="Rafraîchir les courriels"
                          className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${emailsLoading ? "animate-spin" : ""}`} />
                        </button>

                        <button
                          type="button"
                          onClick={handleGoogleLogout}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold font-sans transition-colors cursor-pointer"
                        >
                          Déconnecter
                        </button>
                      </div>
                    </div>

                    {emailsLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="text-xs text-slate-550 font-semibold">Récupération de vos courriels récents depuis l'API Gmail...</span>
                      </div>
                    ) : gmailError ? (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex flex-col gap-2 font-sans font-medium">
                        <p className="font-bold">⚠️ Erreur lors de l'accès à Gmail API :</p>
                        <p>{gmailError}</p>
                        <button
                          type="button"
                          onClick={() => handleFetchGmailEmails()}
                          className="self-start mt-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-[10px] transition-colors"
                        >
                          Réessayer la requête
                        </button>
                      </div>
                    ) : recentEmails.length === 0 ? (
                      <div className="bg-white py-14 px-6 border border-slate-200 rounded-xl text-center text-slate-400 text-xs shadow-sm font-sans font-medium">
                        📬 Aucun e-mail récent trouvé dans votre boîte de réception. N'hésitez pas à rafraîchir.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 font-sans font-medium">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h4 className="font-bold font-display text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-indigo-500" /> Boîte de Réception Récente ({recentEmails.length} messages)
                          </h4>
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Lecteur Intuitif</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                          {recentEmails.map((email) => (
                            <div
                              key={email.id}
                              className="p-4 bg-white hover:bg-slate-55 border border-slate-200 rounded-xl shadow-sm transition-all flex flex-col justify-between gap-3 relative"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex flex-col gap-1.5 min-w-0">
                                  <span className="text-[10px] text-indigo-600 font-black tracking-wide uppercase truncate block" title={email.from}>Expéditeur: {email.from}</span>
                                  <h4 className="font-extrabold text-slate-800 text-xs leading-snug truncate" title={email.subject}>{email.subject}</h4>
                                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed h-[36px]">{email.snippet}</p>
                                </div>
                                <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap self-start bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-center shrink-0">
                                  {email.date ? new Date(email.date).toLocaleDateString("fr-FR") : ""}
                                </span>
                              </div>

                              <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-1 shrink-0">
                                <span className="text-[10px] text-slate-400 font-mono">ID: {email.id}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAnalyzeEmail(email)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-850 font-bold text-[10px] rounded-lg border border-indigo-100 hover:border-indigo-200 transition-all cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3" /> Analyser par l'IA
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Email analysis confirmation utility modal */}
            {emailToAnalyze && (
              <div id="email-parsing-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white w-full max-w-md rounded-2xl border border-slate-250 shadow-2xl overflow-hidden animate-scaleIn pb-6">
                  
                  {/* Header */}
                  <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">Analyse du Courriel par IA</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailToAnalyze(null)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 font-sans">
                    {isParsingEmail ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Parsing en cours...</h4>
                          <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs leading-relaxed mx-auto">
                            L'intelligence artificielle analyse le courriel afin d'identifier les dépenses d'abonnements, factures ou facturations régulières.
                          </p>
                        </div>
                      </div>
                    ) : parsedCandidate ? (
                      <div className="flex flex-col gap-4">
                        <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-4 flex gap-3 text-emerald-800 animate-fadeIn">
                          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                          <div className="text-xs">
                            <strong className="block font-black text-emerald-900 mb-0.5">Transaction détectée avec succès !</strong>
                            <p className="text-[11px] text-emerald-700 leading-normal">
                              L'assistant IA a décodé les informations de l'e-mail. Vous pouvez les ajuster avant de valider l'importation.
                            </p>
                          </div>
                        </div>

                        {/* Editable Transaction Card Form */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 text-slate-700">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Description / Opération</label>
                            <input
                              type="text"
                              required
                              value={parsedCandidate.description}
                              onChange={(e) => setParsedCandidate({ ...parsedCandidate, description: e.target.value })}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Montant (USD)</label>
                              <input
                                type="number"
                                step="any"
                                required
                                value={parsedCandidate.montant}
                                onChange={(e) => setParsedCandidate({ ...parsedCandidate, montant: Number(e.target.value) })}
                                className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Date Transaction</label>
                              <input
                                type="date"
                                required
                                value={parsedCandidate.date_transaction}
                                onChange={(e) => setParsedCandidate({ ...parsedCandidate, date_transaction: e.target.value })}
                                className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Type</label>
                              <select
                                value={parsedCandidate.type}
                                onChange={(e) => setParsedCandidate({ ...parsedCandidate, type: e.target.value as "Revenu" | "Dépense" })}
                                className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                              >
                                <option value="Dépense">🔴 Dépense</option>
                                <option value="Revenu">🟢 Revenu</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Catégorie</label>
                              <select
                                value={parsedCandidate.categorie}
                                onChange={(e) => setParsedCandidate({ ...parsedCandidate, categorie: e.target.value })}
                                className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                              >
                                <option value="Salaire">Salaire</option>
                                <option value="Loyer">Loyer</option>
                                <option value="Transport">Transport</option>
                                <option value="Alimentation">Alimentation</option>
                                <option value="Factures">Factures</option>
                                <option value="Loisirs">Loisirs</option>
                                <option value="Épargne">Épargne</option>
                                <option value="Autre">Autre</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-2 border-t border-slate-100 pt-4">
                          <button
                            type="button"
                            onClick={() => setEmailToAnalyze(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Rejeter
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmCandidateTransaction}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100 transition-colors cursor-pointer"
                          >
                            Importer au Registre
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                          <AlertTriangle className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Aucune transaction décodée</h4>
                          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
                            L'IA a scanné ce message mais n'y a décelé aucun paiement, facture acquittée d'achat ou reçu bancaire standard.
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 mt-4 text-left p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[9px] text-slate-400 uppercase font-black">Objet du courriel :</span>
                          <span className="text-xs text-slate-700 font-bold">{emailToAnalyze.subject}</span>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                          <button
                            type="button"
                            onClick={() => setEmailToAnalyze(null)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
                          >
                            Fermer la fenêtre
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* General instruction manual for DRC VPN access */}
            <div id="footer-helper-area" className="mt-auto pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-400 text-[10px] shrink-0">
              <div className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Geographic Workaround (DRC/RDC) : Proton VPN en mode "Gratuit" connecté sur Pays-Bas ou USA requis si l'IA refuse de répondre.</span>
              </div>
              <div>
                <span>Généré de façon sécurisée (Localstorage Sandbox v1.0)</span>
              </div>
            </div>

          </main>
        </div>

        {/* Permanent Right AI Chatbot Pane */}
        <aside id="workspace-sidebar" className="w-[340px] bg-white flex flex-col shrink-0 border-l border-slate-200">
          
          {/* Sidebar Chat Title Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-200 justify-between shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-none text-slate-800">Conseiller IA Gemini</span>
                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Interactif</span>
              </div>
            </div>

            <button 
              onClick={() => {
                triggerConfirm(
                  "Réinitialiser la discussion",
                  "Voulez-vous supprimer tout l'historique d'échange avec le chatbot ?",
                  () => {
                    setMessages([
                      {
                        id: "init-" + Date.now(),
                        role: "assistant",
                        content: STARTER_ASSISTANT_REPLY,
                        timestamp: "12:00",
                      },
                    ]);
                    showToast("Historique de discussion effacé.", "info");
                  }
                );
              }}
              className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
              title="Vider l'historique"
            >
              Effacer
            </button>
          </div>

          {/* Quick Suggestions Bubbles */}
          <div className="bg-slate-50/70 p-3 border-b border-slate-150 flex flex-col gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest self-start">Raccourcis IA contextuels</span>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleQuickPromptClick("Comment économiser $200 de plus sur mes enveloppes de budget ?")}
                className="w-full text-left bg-white hover:bg-slate-100 text-[10px] text-slate-700 p-2 rounded border border-slate-200 truncate font-semibold"
              >
                💡 Comment économiser $200 de plus ?
              </button>
              <button 
                onClick={() => handleQuickPromptClick("Donne moi un diagnostic complet de ma situation financière actuelle")}
                className="w-full text-left bg-white hover:bg-slate-100 text-[10px] text-slate-700 p-2 rounded border border-slate-200 truncate font-semibold"
              >
                📊 Diagnostic financier complet
              </button>
              <button 
                onClick={() => handleQuickPromptClick("Estime de façon mathématique le temps nécessaire pour atteindre mon objectif d'achat d'après mon solde et mon épargne réelle.")}
                className="w-full text-left bg-white hover:bg-slate-100 text-[10px] text-slate-700 p-2 rounded border border-slate-200 truncate font-semibold"
              >
                🎯 Analyse de l'objectif sur-mesure
              </button>
            </div>
          </div>

          {/* Chat Messages flow */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/30">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex flex-col max-w-[90%] gap-1 ${
                  m.role === "user" ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div 
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    m.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-sm font-sans" 
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm"
                  }`}
                >
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="space-y-1">
                      {renderMarkdownText(m.content)}
                    </div>
                  )}
                </div>
                <span className="text-[8px] text-slate-400 font-mono font-bold mt-0.5 px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex items-center gap-2 self-start bg-white border border-slate-200 px-3.5 py-2 rounded-xl rounded-tl-none shadow-sm">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-[10px] font-bold text-slate-400 ml-1">L'IA Gemini réfléchit...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input form base */}
          <div className="p-4 border-t border-slate-200 bg-white shrink-0">
            <div className="relative">
              <input
                type="text"
                value={inputText}
                disabled={isChatLoading}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isChatLoading) {
                    handleSendMessage();
                  }
                }}
                placeholder={isChatLoading ? "IA en train de répondre..." : "Posez une question sur votre budget..."}
                className="w-full bg-slate-55 border border-slate-200 rounded-xl py-3 pl-4 pr-11 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none disabled:opacity-50 text-slate-800 placeholder:text-slate-400 font-sans font-medium"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isChatLoading || !inputText.trim()}
                className="absolute right-1.5 top-1.5 w-9 h-9 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg flex items-center justify-center disabled:opacity-30 disabled:hover:bg-indigo-600 shadow-md shadow-indigo-100 transition-all"
                title="Poser la question"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[9px] text-slate-400 text-center mt-3 tracking-wide">
              Moteur : <strong className="text-slate-500 font-black">gemini-3.5-flash</strong> • Données contextuelles actives
            </p>
          </div>

        </aside>

      </div>

      {/* Toast notifications portal */}
      <div id="toast-portal" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border animate-fadeIn pointer-events-auto text-xs font-semibold text-white ${
              toast.type === "error"
                ? "bg-rose-600 border-rose-700"
                : toast.type === "info"
                ? "bg-slate-800 border-slate-900"
                : "bg-emerald-600 border-emerald-700"
            }`}
          >
            {toast.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {toast.type === "info" && <Clock className="w-4 h-4 shrink-0" />}
            {toast.type === "success" && <CheckCircle className="w-4 h-4 shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-white hover:text-slate-200 transition-colors shrink-0 ml-1.5 font-bold"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div id="confirm-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-slate-900 font-display">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{confirmModal.message}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.onCancel) confirmModal.onCancel();
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-colors shadow-md shadow-indigo-100"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
