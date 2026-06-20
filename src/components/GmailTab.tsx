import React from "react";
import { Mail, RefreshCw, Sparkles, X, CheckCircle, AlertTriangle } from "lucide-react";
import { Transaction } from "../types";

export interface GmailEmailPreview {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
}

interface GmailTabProps {
  googleUser: any;
  gmailError: string | null;
  scanLimit: number;
  setScanLimit: React.Dispatch<React.SetStateAction<number>>;
  emailsLoading: boolean;
  recentEmails: GmailEmailPreview[];
  emailToAnalyze: GmailEmailPreview | null;
  setEmailToAnalyze: React.Dispatch<React.SetStateAction<GmailEmailPreview | null>>;
  parsedCandidate: Transaction | null;
  setParsedCandidate: React.Dispatch<React.SetStateAction<Transaction | null>>;
  isParsingEmail: boolean;
  handleGoogleLogin: () => void;
  handleGoogleLogout: () => void;
  handleFetchGmailEmails: () => void;
  handleAnalyzeEmail: (email: GmailEmailPreview) => void;
  handleConfirmCandidateTransaction: () => void;
}

export default function GmailTab({
  googleUser,
  gmailError,
  scanLimit,
  setScanLimit,
  emailsLoading,
  recentEmails,
  emailToAnalyze,
  setEmailToAnalyze,
  parsedCandidate,
  setParsedCandidate,
  isParsingEmail,
  handleGoogleLogin,
  handleGoogleLogout,
  handleFetchGmailEmails,
  handleAnalyzeEmail,
  handleConfirmCandidateTransaction,
}: GmailTabProps) {
  return (
    <div id="screen-gmail" className="flex flex-col gap-6 animate-fadeIn text-slate-900">
      
      <div>
        <h2 className="text-lg font-bold text-slate-900 font-display">Synchronisation Intelligente Gmail API</h2>
        <p className="text-xs text-slate-550">Connectez vos courriels d'achats, fiches de paie ou factures d'abonnements pour que l'intelligence artificielle les répertorie automatiquement dans vos comptes.</p>
      </div>

      {!googleUser ? (
        <div id="screen-gmail-disconnected" className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-6 gap-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100">
            <Mail className="w-8 h-8 text-indigo-600" />
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
            className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-slate-50 text-slate-750 font-bold text-xs rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition-all cursor-pointer select-none outline-none font-sans"
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
            <div className="text-rose-500 text-xs font-semibold bg-rose-55 border border-rose-100 p-3 rounded-lg leading-normal">
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
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-750 border border-emerald-100 rounded-full">Gmail Connecté</span>
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
                  className="p-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-505 text-slate-700 font-semibold"
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
            <div className="p-4 bg-rose-50 border border-rose-105 rounded-xl text-rose-700 text-xs flex flex-col gap-2 font-sans font-medium">
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
                  <Mail className="w-4 h-4 text-indigo-550 animate-pulse" /> Boîte de Réception Récente ({recentEmails.length} messages)
                </h4>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Lecteur Intuitif</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                {recentEmails.map((email) => (
                  <div
                    key={email.id}
                    className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all flex flex-col justify-between gap-3 relative"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="text-[10px] text-indigo-600 font-black tracking-wide uppercase truncate block" title={email.from}>Expéditeur: {email.from}</span>
                        <h4 className="font-extrabold text-slate-850 text-xs leading-snug truncate" title={email.subject}>{email.subject}</h4>
                        <p className="text-[11px] text-slate-450 line-clamp-2 leading-relaxed h-[36px]">{email.snippet}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap self-start bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-center shrink-0">
                        {email.date ? new Date(email.date).toLocaleDateString("fr-FR") : ""}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-1 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono font-bold">ID: {email.id}</span>
                      <button
                        type="button"
                        onClick={() => handleAnalyzeEmail(email)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-850 font-bold text-[10px] rounded-lg border border-indigo-100 hover:border-indigo-200 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-650" /> Analyser par l'IA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Email analysis confirmation utility modal */}
      {emailToAnalyze && (
        <div id="email-parsing-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-250 shadow-2xl overflow-hidden animate-scaleIn pb-6 pointer-events-auto">
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 font-mono">Analyse du Courriel par IA</span>
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
                  <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-4 flex gap-3 text-emerald-800 animate-fadeIn animate-duration-300">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                    <div className="text-xs">
                      <strong className="block font-black text-emerald-950 mb-0.5">Transaction détectée avec succès !</strong>
                      <p className="text-[11px] text-emerald-700 leading-normal font-medium">
                        L'assistant IA a décodé les informations de l'e-mail. Vous pouvez les ajuster avant de valider l'importation.
                      </p>
                    </div>
                  </div>

                  {/* Editable Transaction Card Form */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 text-slate-750">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Description / Opération</label>
                      <input
                        type="text"
                        required
                        value={parsedCandidate.description}
                        onChange={(e) => setParsedCandidate({ ...parsedCandidate, description: e.target.value })}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
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
                          className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Date Transaction</label>
                        <input
                          type="date"
                          required
                          value={parsedCandidate.date_transaction}
                          onChange={(e) => setParsedCandidate({ ...parsedCandidate, date_transaction: e.target.value })}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
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
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg text-xs font-bold transition-colors cursor-pointer"
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

    </div>
  );
}
