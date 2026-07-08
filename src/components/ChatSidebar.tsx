import React from "react";
import { Sparkles, X, MessageSquare, History, Plus, Trash2 } from "lucide-react";
import { ChatMessage, ChatDiscussion } from "../types";
import { renderMarkdownText } from "../utils/markdown";
import { motion, AnimatePresence } from "motion/react";

interface ChatSidebarProps {
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  sidebarWidth: number;
  isResizing: boolean;
  startResizing: (e: React.MouseEvent) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isChatLoading: boolean;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (text?: string) => void;
  triggerConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  STARTER_ASSISTANT_REPLY: string;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  discussions: ChatDiscussion[];
  activeDiscussionId: string;
  setActiveDiscussionId: (id: string) => void;
  handleCreateNewDiscussion: () => void;
  handleDeleteDiscussion: (id: string) => void;
}

export default function ChatSidebar({
  showChat,
  setShowChat,
  sidebarWidth,
  isResizing,
  startResizing,
  messages,
  setMessages,
  isChatLoading,
  inputText,
  setInputText,
  handleSendMessage,
  triggerConfirm,
  showToast,
  STARTER_ASSISTANT_REPLY,
  chatEndRef,
  discussions,
  activeDiscussionId,
  setActiveDiscussionId,
  handleCreateNewDiscussion,
  handleDeleteDiscussion,
}: ChatSidebarProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<"chat" | "history">("chat");

  // Quick suggestions prompt shooter
  const handleQuickPromptClick = (topicPrompt: string) => {
    setActiveSubTab("chat");
    setInputText("");
    handleSendMessage(topicPrompt);
  };

  return (
    <AnimatePresence>
      {showChat && (
        <React.Fragment>
          {/* Background overlay on mobile screen bounds */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40"
            onClick={() => {
              setShowChat(false);
              localStorage.setItem("fintech_show_chat", "false");
            }}
          />

          <motion.aside 
            id="workspace-sidebar" 
            style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed md:relative inset-y-0 right-0 z-50 md:z-0 w-[calc(100%-56px)] md:w-[var(--sidebar-width)] max-w-full bg-white flex flex-col shrink-0 border-l border-slate-200 shadow-2xl md:shadow-none"
          >
        
        {/* Resize handle bar */}
        <div 
          onMouseDown={startResizing}
          className={`hidden md:block absolute top-0 left-0 bottom-0 w-2.5 cursor-col-resize hover:bg-indigo-500/20 transition-all z-50 ${isResizing ? "bg-indigo-700 w-3 shadow-[0_0_12px_rgba(79,70,229,0.5)]" : "bg-transparent hover:border-l hover:border-indigo-300"}`}
          title="Glissez vers la gauche ou la droite pour redimensionner le chat intelligent"
        />

        {/* Sidebar Chat Title Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 justify-between shrink-0 bg-slate-50/50 pl-8 md:pl-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-none text-slate-800">Conseiller IA Gemini</span>
              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Interactif</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                triggerConfirm(
                  "Réinitialiser la discussion",
                  "Voulez-vous supprimer tout l'historique d'échange de la discussion active ?",
                  () => {
                    setMessages([
                      {
                        id: "init-" + Date.now(),
                        role: "assistant",
                        content: STARTER_ASSISTANT_REPLY,
                        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                      },
                    ]);
                    showToast("Discussion active effacée.", "info");
                  }
                );
              }}
              className="text-[9px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded transition-all uppercase tracking-wider cursor-pointer font-sans"
              title="Vider l'historique de cette discussion"
            >
              Effacer
            </button>

            <button 
              onClick={() => {
                setShowChat(false);
                localStorage.setItem("fintech_show_chat", "false");
              }}
              className="p-1 px-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-all cursor-pointer"
              title="Masquer le conseiller IA"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Segmented Sub-Tabs for active chat and history */}
        <div className="flex border-b border-slate-200 bg-slate-50/20 p-2 gap-1.5 shrink-0 pl-8 md:pl-4 pr-4">
          <button
            onClick={() => setActiveSubTab("chat")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "chat"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-850 hover:bg-slate-100/70 border border-transparent"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Discussion Active
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-[11px] font-bold rounded-lg transition-all cursor-pointer relative ${
              activeSubTab === "history"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-850 hover:bg-slate-100/70 border border-transparent"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historique ({discussions.length})
            {discussions.length > 1 && (
              <span className="absolute -top-1 -right-1 bg-indigo-650 text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs">
                {discussions.length}
              </span>
            )}
          </button>
        </div>

        {activeSubTab === "chat" ? (
          <React.Fragment>
            {/* Quick Suggestions Bubbles */}
            <div className="bg-slate-50/70 p-3 border-b border-slate-150 flex flex-col gap-1.5 shrink-0 pl-8 md:pl-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest self-start font-mono">Raccourcis IA contextuels</span>
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => handleQuickPromptClick("Comment économiser $200 de plus sur mes enveloppes de budget ?")}
                  className="w-full text-left bg-white hover:bg-indigo-50/50 hover:text-indigo-700 hover:border-indigo-100 text-[10px] text-slate-700 p-2 rounded border border-slate-200 truncate font-semibold transition-all cursor-pointer font-sans"
                >
                  💡 Comment économiser $200 de plus ?
                </button>
                <button 
                  onClick={() => handleQuickPromptClick("Donne moi un diagnostic complet de ma situation financière actuelle")}
                  className="w-full text-left bg-white hover:bg-indigo-50/50 hover:text-indigo-700 hover:border-indigo-100 text-[10px] text-slate-700 p-2 rounded border border-slate-200 truncate font-semibold transition-all cursor-pointer font-sans"
                >
                  📊 Diagnostic financier complet
                </button>
                <button 
                  onClick={() => handleQuickPromptClick("Estime de façon mathématique le temps nécessaire pour atteindre mon objectif d'achat d'après mon solde et mon épargne réelle.")}
                  className="w-full text-left bg-white hover:bg-indigo-50/50 hover:text-indigo-700 hover:border-indigo-100 text-[10px] text-slate-700 p-2 rounded border border-slate-200 truncate font-semibold transition-all cursor-pointer font-sans"
                >
                  🎯 Analyse de l'objectif sur-mesure
                </button>
              </div>
            </div>

            {/* Chat Messages flow */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/30 pl-8 md:pl-4">
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
                <div className="flex items-center gap-2 self-start bg-white border border-slate-200 px-3.5 py-2 rounded-xl rounded-tl-none shadow-sm animate-pulse">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-[10px] font-bold text-slate-400 ml-1 font-mono">L'IA Gemini réfléchit...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input form base */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0 pl-8 md:pl-4">
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  disabled={isChatLoading}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isChatLoading) {
                      setActiveSubTab("chat");
                      handleSendMessage();
                    }
                  }}
                  placeholder={isChatLoading ? "IA en train de répondre..." : "Posez une question sur votre budget..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-11 text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none disabled:opacity-50 text-slate-800 placeholder:text-slate-400 font-sans font-medium"
                />
                <button
                  onClick={() => {
                    setActiveSubTab("chat");
                    handleSendMessage();
                  }}
                  disabled={isChatLoading || !inputText.trim()}
                  className="absolute right-1.5 top-1.5 w-9 h-9 bg-indigo-600 hover:bg-indigo-755 text-white rounded-lg flex items-center justify-center disabled:opacity-30 disabled:hover:bg-indigo-600 shadow-md shadow-indigo-100 transition-all cursor-pointer"
                  title="Poser la question"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-[9px] text-slate-400 text-center mt-3 tracking-wide font-mono">
                Moteur : <strong className="text-slate-500 font-black">gemini-1.5-flash</strong> • Données contextuelles actives
              </p>
            </div>
          </React.Fragment>
        ) : (
          /* Discussions History Screen */
          <div className="flex-1 overflow-y-auto bg-slate-50/20 flex flex-col">
            <div className="p-4 shrink-0">
              <button
                onClick={() => {
                  handleCreateNewDiscussion();
                  setActiveSubTab("chat");
                }}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
              >
                <Plus className="w-4.5 h-4.5" />
                Nouvelle discussion
              </button>
            </div>

            <div className="flex-1 px-4 pb-4 flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 font-mono">
                Historique des sessions ({discussions.length})
              </span>
              
              {discussions.length === 0 ? (
                <div className="text-center py-12 text-slate-450 text-xs italic bg-white rounded-xl border border-slate-150 p-4">
                  Aucune discussion disponible. Cliquez ci-dessus pour en commencer une nouvelle !
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {discussions.map((disc) => {
                    const isActive = disc.id === activeDiscussionId;
                    const messageCount = disc.messages.length;
                    return (
                      <div
                        key={disc.id}
                        onClick={() => {
                          setActiveDiscussionId(disc.id);
                          setActiveSubTab("chat");
                        }}
                        className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? "bg-indigo-50/40 border-indigo-200 shadow-xs"
                            : "bg-white hover:bg-slate-50/80 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-bold truncate pr-2 ${
                              isActive ? "text-indigo-950" : "text-slate-800"
                            }`}>
                              {disc.title || "Nouvelle discussion"}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400 font-mono font-medium">
                              <span>{disc.createdAt}</span>
                              <span>•</span>
                              <span className="font-bold text-slate-500">{messageCount} message{messageCount > 1 ? "s" : ""}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerConfirm(
                              "Supprimer la discussion",
                              `Voulez-vous vraiment supprimer définitivement cette discussion ("${disc.title || "Nouvelle discussion"}") ?`,
                              () => {
                                handleDeleteDiscussion(disc.id);
                              }
                            );
                          }}
                          className="p-1.5 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-70 group-hover:opacity-100 cursor-pointer"
                          title="Supprimer la discussion de l'historique"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </motion.aside>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
