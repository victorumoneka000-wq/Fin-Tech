import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  DollarSign,
  Sliders,
  TrendingUp,
  RefreshCw,
  LogOut,
  LogIn,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { FinancialProfile, Transaction, ChatMessage, ChatDiscussion } from "./types";
import { supabase, getSupabaseConfig } from "./supabaseClient";
import AuthInterface from "./components/AuthInterface";
import { motion, AnimatePresence } from "motion/react";

// Import modular components
import ConfirmModal from "./components/ConfirmModal";
import ToastNotifications, { Toast } from "./components/ToastNotifications";
import DashboardTab from "./components/DashboardTab";
import TransactionsTab from "./components/TransactionsTab";
import ProfileTab from "./components/ProfileTab";
import ProjectionsTab from "./components/ProjectionsTab";
import ChatSidebar from "./components/ChatSidebar";

// Default empty/zero state values
const DEFAULT_PROFILE: FinancialProfile = {
  name: "Utilisateur",
  revenu_mensuel: 0,
  loyer: 0,
  transport: 0,
  alimentation: 0,
  factures: 0,
  loisirs: 0,
  epargne: 0,
  objectif_nom: "Mon Épargne",
  objectif_montant: 0,
};

const DEFAULT_TRANSACTIONS: Transaction[] = [];

const STARTER_ASSISTANT_REPLY = `Bonjour et bienvenue dans votre **Assistant Financier Personnel** ! 👋\n\nComment puis-je vous aider aujourd'hui à gérer votre budget, enregistrer vos transactions ou planifier vos objectifs d'épargne ?`;

export default function App() {
  // Supabase states
  const [supabaseConfig] = useState(() => getSupabaseConfig());
  const [userSession, setUserSession] = useState<any>(null);
  const [bypassAuth, setBypassAuth] = useState(() => {
    return localStorage.getItem("fintech_bypass_auth") === "true";
  });

  // Core States with LocalStorage synchronization
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

  // Load and manage multiple chat discussions
  const [discussions, setDiscussions] = useState<ChatDiscussion[]>(() => {
    const savedDiscussions = localStorage.getItem("fintech_chat_discussions");
    if (savedDiscussions) {
      try {
        return JSON.parse(savedDiscussions);
      } catch (e) {}
    }
    
    // Fallback/Migration: check if old flat messages exist
    const savedOldChat = localStorage.getItem("fintech_chat");
    if (savedOldChat) {
      try {
        const oldMsgs = JSON.parse(savedOldChat);
        if (Array.isArray(oldMsgs) && oldMsgs.length > 0) {
          const firstUserMsg = oldMsgs.find(m => m.role === "user");
          const title = firstUserMsg 
            ? (firstUserMsg.content.substring(0, 32) + (firstUserMsg.content.length > 32 ? "..." : ""))
            : "Analyse de Budget Importée";
          const migratedDisc: ChatDiscussion = {
            id: "disc-migration",
            title: title,
            messages: oldMsgs,
            createdAt: new Date().toLocaleDateString("fr-FR")
          };
          return [migratedDisc];
        }
      } catch (e) {}
    }

    // Default first discussion
    return [{
      id: "disc-1",
      title: "Analyse Budgétaire Principale",
      messages: [
        {
          id: "init-1",
          role: "assistant",
          content: STARTER_ASSISTANT_REPLY,
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        }
      ],
      createdAt: new Date().toLocaleDateString("fr-FR")
    }];
  });

  const [activeDiscussionId, setActiveDiscussionId] = useState<string>(() => {
    const savedActiveId = localStorage.getItem("fintech_active_discussion_id");
    if (savedActiveId) return savedActiveId;
    return "disc-1";
  });

  // Derived active discussion & messages
  const activeDiscussion = discussions.find(d => d.id === activeDiscussionId) || discussions[0] || {
    id: "disc-1",
    title: "Analyse Budgétaire Principale",
    messages: [
      {
        id: "init-1",
        role: "assistant",
        content: STARTER_ASSISTANT_REPLY,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      }
    ],
    createdAt: new Date().toLocaleDateString("fr-FR")
  };

  const messages = activeDiscussion.messages;

  const setMessages = (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setDiscussions(prevDiscussions => {
      let hasActive = prevDiscussions.some(d => d.id === activeDiscussionId);
      const targetId = hasActive ? activeDiscussionId : (prevDiscussions[0]?.id || "disc-1");
      
      return prevDiscussions.map(d => {
        if (d.id === targetId) {
          const nextMsgs = typeof updater === "function" ? updater(d.messages) : updater;
          
          let nextTitle = d.title;
          if (d.title === "Nouvelle discussion" || d.title === "Analyse Budgétaire Principale") {
            const firstUserMsg = nextMsgs.find(m => m.role === "user");
            if (firstUserMsg) {
              nextTitle = firstUserMsg.content.substring(0, 32);
              if (firstUserMsg.content.length > 32) {
                nextTitle += "...";
              }
            }
          }

          return {
            ...d,
            title: nextTitle,
            messages: nextMsgs
          };
        }
        return d;
      });
    });
  };

  const handleCreateNewDiscussion = () => {
    const newId = "disc-" + Date.now();
    const newDisc: ChatDiscussion = {
      id: newId,
      title: "Nouvelle discussion",
      messages: [
        {
          id: "init-" + Date.now(),
          role: "assistant",
          content: STARTER_ASSISTANT_REPLY,
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        }
      ],
      createdAt: new Date().toLocaleDateString("fr-FR")
    };

    setDiscussions(prev => [newDisc, ...prev]);
    setActiveDiscussionId(newId);
    showToast("Nouvelle discussion démarrée ! 💬");
  };

  const handleDeleteDiscussion = (id: string) => {
    setDiscussions(prev => {
      const filtered = prev.filter(d => d.id !== id);
      if (filtered.length === 0) {
        return [{
          id: "disc-1",
          title: "Analyse Budgétaire Principale",
          messages: [
            {
              id: "init-1",
              role: "assistant",
              content: STARTER_ASSISTANT_REPLY,
              timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            }
          ],
          createdAt: new Date().toLocaleDateString("fr-FR")
        }];
      }
      return filtered;
    });

    if (activeDiscussionId === id) {
      const remaining = discussions.filter(d => d.id !== id);
      if (remaining.length > 0) {
        setActiveDiscussionId(remaining[0].id);
      } else {
        setActiveDiscussionId("disc-1");
      }
    }
    showToast("Discussion supprimée.", "info");
  };

  // UI Active tabs:
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "profile" | "projections">("dashboard");

  // Chat sidebar resizable & collapsible states
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem("fintech_sidebar_width");
    return saved ? parseInt(saved, 10) : 420;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(() => {
    const saved = localStorage.getItem("fintech_show_chat");
    return saved !== "false";
  });

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true);
    mouseDownEvent.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 280 && newWidth <= window.innerWidth * 0.75) {
        setSidebarWidth(newWidth);
        localStorage.setItem("fintech_sidebar_width", String(newWidth));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Custom non-blocking Toast notification state
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  // Form states (Add transaction)
  const [showAddTx, setShowAddTx] = useState(false);

  // Projection Simulator adjustments
  const [simulatorExtraSavings, setSimulatorExtraSavings] = useState(0);

  // Chat window anchor ref
  const chatEndRef = useRef<HTMLDivElement | null>(null);



  // Auth Effects and Syncload logic
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      if (session?.user) {
        setBypassAuth(false);
        handleFetchUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserSession(session);
      if (session?.user) {
        setBypassAuth(false);
        handleFetchUserData(session.user.id);
        
        if (event === "SIGNED_IN") {
          const userName = session.user.user_metadata?.full_name || "Utilisateur";
          const welcomeContent = `Bonjour et bienvenue, **${userName}** ! 👋\n\nComment puis-je vous aider aujourd'hui à gérer votre budget, enregistrer vos transactions ou planifier vos objectifs d'épargne ?`;
          const freshMessages: ChatMessage[] = [
            {
              id: "init-" + Date.now(),
              role: "assistant",
              content: welcomeContent,
              timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            },
          ];
          setMessages(freshMessages);
          localStorage.setItem("fintech_chat", JSON.stringify(freshMessages));
        }
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
      const { data: pData, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      const userName = userSession?.user?.user_metadata?.full_name || pData?.name || "Utilisateur";

      const zeroedProfile = {
        name: userName,
        revenu_mensuel: 0,
        loyer: 0,
        transport: 0,
        alimentation: 0,
        factures: 0,
        loisirs: 0,
        epargne: 0,
        objectif_nom: "Mon Épargne",
        objectif_montant: 0
      };

      let activeProfile = zeroedProfile;

      if (pError && pError.code === "PGRST116") {
        await supabase.from("profiles").insert([{ id: userId, ...zeroedProfile }]);
        activeProfile = zeroedProfile;
      } else if (pData) {
        activeProfile = {
          name: pData.name || userName,
          revenu_mensuel: typeof pData.revenu_mensuel === "number" ? pData.revenu_mensuel : 0,
          loyer: typeof pData.loyer === "number" ? pData.loyer : 0,
          transport: typeof pData.transport === "number" ? pData.transport : 0,
          alimentation: typeof pData.alimentation === "number" ? pData.alimentation : 0,
          factures: typeof pData.factures === "number" ? pData.factures : 0,
          loisirs: typeof pData.loisirs === "number" ? pData.loisirs : 0,
          epargne: typeof pData.epargne === "number" ? pData.epargne : 0,
          objectif_nom: pData.objectif_nom || "Mon Épargne",
          objectif_montant: typeof pData.objectif_montant === "number" ? pData.objectif_montant : 0,
        };
      }

      setProfile(activeProfile);
      localStorage.setItem("fintech_profile", JSON.stringify(activeProfile));

      const { data: tData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date_transaction", { ascending: false });

      const loadedTransactions = tData || [];
      setTransactions(loadedTransactions);
      localStorage.setItem("fintech_transactions", JSON.stringify(loadedTransactions));

    } catch (err) {
      console.error("Error loading user data from Supabase:", err);
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

    const freshMessages: ChatMessage[] = [
      {
        id: "init-" + Date.now(),
        role: "assistant",
        content: STARTER_ASSISTANT_REPLY,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    setMessages(freshMessages);
    localStorage.setItem("fintech_chat", JSON.stringify(freshMessages));
  };

  // Sync back to local storage (always auto-saves for offline and fallback support)
  useEffect(() => {
    localStorage.setItem("fintech_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("fintech_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("fintech_chat", JSON.stringify(messages));
    localStorage.setItem("fintech_chat_discussions", JSON.stringify(discussions));
    localStorage.setItem("fintech_active_discussion_id", activeDiscussionId);
  }, [messages, discussions, activeDiscussionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!customText) setInputText("");
    setIsChatLoading(true);

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
        const errorMsg = data.details 
          ? `${data.error} (Détails : ${data.details})` 
          : (data.error || "Une erreur est survenue lors de l'appel API.");
        throw new Error(errorMsg);
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
      setMessages((prev) => [
        ...prev,
        {
          id: "assistant-err-" + Date.now(),
          role: "assistant",
          content: `⚠️ **Problème de connexion avec l'IA.**\n\n**Détail de l'erreur** : ${err.message}\n\n*Note : Si vous êtes dans un pays avec des restrictions régionales (ex: RDC), l'API Google Gemini nécessite parfois un proxy pour fonctionner depuis certains environnements de développement.*`,
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
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
          name: userSession?.user?.user_metadata?.full_name || "Utilisateur",
          revenu_mensuel: 0,
          loyer: 0,
          transport: 0,
          alimentation: 0,
          factures: 0,
          loisirs: 0,
          epargne: 0,
          objectif_nom: "Mon Épargne",
          objectif_montant: 0,
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
            timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          },
        ] as ChatMessage[]);
        showToast("Toutes vos données ont été remises à zéro.", "info");
      }
    );
  };

  // Profile update handler
  const handleSaveProfile = async (updated: FinancialProfile) => {
    let offline = !navigator.onLine;
    if (userSession?.user && supabase && !offline) {
      try {
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
          console.warn("DB offline or error, setting locally:", error);
          offline = true;
        }
      } catch (e) {
        offline = true;
      }
    }
    setProfile(updated);
    if (offline) {
      showToast("Profil enregistré localement (Mode hors-ligne) 💾", "info");
    } else {
      showToast("Profil financier sauvegardé avec succès !");
    }
  };

  if (!userSession && !bypassAuth) {
    return (
      <AuthInterface
        onAuthSuccess={({ user, profile: fetchedProfile }) => {
          setUserSession({ user });
          setBypassAuth(false);
          localStorage.setItem("fintech_bypass_auth", "false");
          if (fetchedProfile) setProfile(fetchedProfile);
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
    <div id="financial-workspace" className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans pb-16 md:pb-0 relative">
      
      {/* Sidebar Navigation Container (Desktop) */}
      <nav id="left-nav" className="hidden md:flex w-[72px] bg-[#0F172A] flex-col items-center py-6 gap-8 border-r border-slate-205 shrink-0">
        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl font-display select-none">
          A
        </div>
        
        <div className="flex flex-col gap-6 flex-1 justify-center">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            title="Tableau de bord"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-slate-800 text-indigo-400 border-l-4 border-indigo-550"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-5 h-5" />
          </button>

          <button
            id="nav-tab-transactions"
            onClick={() => setActiveTab("transactions")}
            title="Transactions"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              activeTab === "transactions"
                ? "bg-slate-800 text-indigo-400 border-l-4 border-indigo-550"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <DollarSign className="w-5 h-5" />
          </button>

          <button
            id="nav-tab-profile"
            onClick={() => setActiveTab("profile")}
            title="Profil & Budgets"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-slate-800 text-indigo-400 border-l-4 border-indigo-550"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="w-5 h-5" />
          </button>

          <button
            id="nav-tab-projections"
            onClick={() => setActiveTab("projections")}
            title="Projections d'Épargne"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              activeTab === "projections"
                ? "bg-slate-800 text-indigo-400 border-l-4 border-indigo-550"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </button>


        </div>

        <div className="mt-auto flex flex-col gap-4 items-center">
          <button
            id="reset-state-btn"
            onClick={handleLoadDemoData}
            title="Charger données démo"
            className="w-10 h-10 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-300 font-bold text-xs select-none" title={profile.name}>
            {profile.name ? profile.name.split(" ").map((n) => n[0]).join("") : "U"}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation (only on small screens) */}
      <nav id="mobile-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0F172A] border-t border-slate-800 flex items-center justify-around px-4 z-40 shadow-xl pb-safe">
        <button
          onClick={() => {
            setActiveTab("dashboard");
            setShowChat(false);
          }}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "dashboard" && !showChat ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[9px] mt-1 font-medium font-sans">Tableau</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("transactions");
            setShowChat(false);
          }}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "transactions" && !showChat ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[9px] mt-1 font-medium font-sans">Dépenses</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("profile");
            setShowChat(false);
          }}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "profile" && !showChat ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[9px] mt-1 font-medium font-sans">Réglages</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("projections");
            setShowChat(false);
          }}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "projections" && !showChat ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px] mt-1 font-medium font-sans">Futur</span>
        </button>

        <button
          onClick={() => {
            setShowChat(prev => {
              const newVal = !prev;
              localStorage.setItem("fintech_show_chat", String(newVal));
              return newVal;
            });
          }}
          className={`flex flex-col items-center justify-center transition-all relative cursor-pointer ${
            showChat ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] mt-1 font-medium font-sans">IA Chat</span>
        </button>
      </nav>

      {/* Main Content Pane */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* Main Work Space Section */}
        <div id="workspace-center" className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
          
          {/* Top Status Header */}
          <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-205 shrink-0 select-none">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest font-black text-slate-400 font-mono">Finances</span>
              <span className="text-slate-300">/</span>
              <h1 className="text-sm font-bold text-slate-800">
                {activeTab === "dashboard" && "Tableau de Bord Global"}
                {activeTab === "transactions" && "Registre de Transactions"}
                {activeTab === "profile" && "Configuration des Budgets & Objectifs"}
                {activeTab === "projections" && "Simulation de Projections Financières"}
              </h1>
            </div>

            {/* Geographical helper + status checks */}
            <div className="flex items-center gap-4">
              {userSession?.user ? (
                <div id="logged-user-header" className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100 py-1.5 pl-3.5 pr-1.5 rounded-full leading-none shrink-0 animate-fadeIn animate-duration-300">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Connecté</span>
                    <span className="text-xs font-extrabold text-slate-850">{userSession.user.user_metadata?.full_name || profile.name || "Utilisateur"}</span>
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
                  <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider hidden sm:inline-block font-mono">
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

              {/* Bouton pour afficher/masquer le chat intelligent (Desktop/Tablette) */}
              <button
                id="toggle-chat-header"
                onClick={() => {
                  setShowChat(prev => {
                    const newVal = !prev;
                    localStorage.setItem("fintech_show_chat", String(newVal));
                    return newVal;
                  });
                }}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 cursor-pointer select-none ${
                  showChat 
                    ? "bg-indigo-50 text-indigo-750 border-indigo-200 hover:bg-indigo-100" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
                title={showChat ? "Masquer le conseiller IA" : "Afficher le conseiller IA"}
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>{showChat ? "Masquer l'IA" : "Discuter avec l'IA"}</span>
              </button>

              <div 
                id="api-status-pill"
                className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold shrink-0 font-mono select-none"
                title="Le serveur d'IA est connecté."
              >
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                IA CONNECTÉE
              </div>
            </div>
          </header>

          {/* Dynamic Router tab screens */}
          <main className="flex-grow overflow-y-auto p-6 flex flex-col gap-6 relative">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="flex flex-col gap-6"
                >
                  <DashboardTab
                    profile={profile}
                    transactions={transactions}
                    setActiveTab={setActiveTab}
                    setShowAddTx={setShowAddTx}
                    handleSendMessage={handleSendMessage}
                  />
                </motion.div>
              )}

              {activeTab === "transactions" && (
                <motion.div
                  key="transactions"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="flex flex-col gap-6"
                >
                  <TransactionsTab
                    transactions={transactions}
                    setTransactions={setTransactions}
                    userSession={userSession}
                    supabase={supabase}
                    showAddTx={showAddTx}
                    setShowAddTx={setShowAddTx}
                    showToast={showToast}
                    triggerConfirm={triggerConfirm}
                  />
                </motion.div>
              )}

              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="flex flex-col gap-6"
                >
                  <ProfileTab
                    profile={profile}
                    setProfile={setProfile}
                    handleResetAllData={handleResetAllData}
                    handleSaveProfile={handleSaveProfile}
                  />
                </motion.div>
              )}

              {activeTab === "projections" && (
                <motion.div
                  key="projections"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="flex flex-col gap-6"
                >
                  <ProjectionsTab
                    profile={profile}
                    simulatorExtraSavings={simulatorExtraSavings}
                    setSimulatorExtraSavings={setSimulatorExtraSavings}
                    handleSendMessage={handleSendMessage}
                  />
                </motion.div>
              )}
            </AnimatePresence>



            {/* Direct server connections explanation help */}
            <div id="footer-helper-area" className="mt-auto pt-4 border-t border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-400 text-[10px] shrink-0 font-medium font-sans">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Connexion Directe : Toutes les requêtes vers l'IA de Gemini passent par notre serveur d'application sécurisé. Aucun VPN n'est nécessaire.</span>
              </div>
              <div>
                <span>Généré de façon sécurisée (Localstorage Sandbox v1.1)</span>
              </div>
            </div>
          </main>

        </div>

        {/* AI Chatbot Sidebar Drawer */}
        <ChatSidebar
          showChat={showChat}
          setShowChat={setShowChat}
          sidebarWidth={sidebarWidth}
          isResizing={isResizing}
          startResizing={startResizing}
          messages={messages}
          setMessages={setMessages}
          isChatLoading={isChatLoading}
          inputText={inputText}
          setInputText={setInputText}
          handleSendMessage={handleSendMessage}
          triggerConfirm={triggerConfirm}
          showToast={showToast}
          STARTER_ASSISTANT_REPLY={STARTER_ASSISTANT_REPLY}
          chatEndRef={chatEndRef}
          discussions={discussions}
          activeDiscussionId={activeDiscussionId}
          setActiveDiscussionId={setActiveDiscussionId}
          handleCreateNewDiscussion={handleCreateNewDiscussion}
          handleDeleteDiscussion={handleDeleteDiscussion}
        />

      </div>

      {/* Popups & Dialog Modals */}
      <ToastNotifications toasts={toasts} setToasts={setToasts} />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
