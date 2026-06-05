import React, { useState } from "react";
import { supabaseService } from "../supabaseService";
import { isSupabaseConfigured } from "../supabaseClient";
import { Shield, Sparkles, Key, AlertCircle, Database, HelpCircle, Check, LogIn, UserPlus } from "lucide-react";

interface AuthInterfaceProps {
  onAuthSuccess: (session: { user: any; profile: any | null }) => void;
  onContinueOffline: () => void;
  customSupabaseConfig: { url: string; key: string } | null;
  onSaveCustomConfig: (url: string, key: string) => void;
}

export default function AuthInterface({
  onAuthSuccess,
  onContinueOffline,
  customSupabaseConfig,
  onSaveCustomConfig,
}: AuthInterfaceProps) {
  const [activeMode, setActiveMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Custom Supabase credential states
  const [showCustomConfigPanel, setShowCustomConfigPanel] = useState(false);
  const [customUrl, setCustomUrl] = useState(customSupabaseConfig?.url || "");
  const [customKey, setCustomKey] = useState(customSupabaseConfig?.key || "");
  const [configSuccess, setConfigSuccess] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const isConfigured = isSupabaseConfigured() || (customSupabaseConfig?.url && customSupabaseConfig?.key);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (activeMode === "signup") {
        if (!name.trim()) {
          throw new Error("Le nom complet est requis pour la création de compte.");
        }
        await supabaseService.signUp(email, password, name.trim());
        setSuccessMsg(
          "Compte créé avec succès ! Si optionnel, validez l'email ou connectez-vous directement ci-dessous."
        );
        setActiveMode("signin");
      } else {
        const user = await supabaseService.signIn(email, password);
        // Attempt to load associated profile
        const profile = await supabaseService.getProfile(user.id);
        onAuthSuccess({ user, profile });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Une erreur est survenue lors de l'authentification.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      setErrorMsg("Veuillez remplir les deux champs de configuration !");
      return;
    }
    onSaveCustomConfig(customUrl.trim(), customKey.trim());
    setConfigSuccess(true);
    setTimeout(() => {
      setConfigSuccess(false);
      setShowCustomConfigPanel(false);
    }, 1500);
  };

  return (
    <div id="auth-screen-overlay" className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-900 p-4 font-sans text-slate-100">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-850/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden z-10">
        
        {/* Brand Icon or decorative element */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center justify-center gap-1.5">
            Assistant Financier Personnel
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Organisez votre budget familial avec le soutien de l'IA Gemini et une base de données sécurisée.
          </p>
        </div>

        {/* Warning if Supabase is unconfigured in standard variables */}
        {!isConfigured && !showCustomConfigPanel && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-300 text-xs flex flex-col gap-2 mb-6">
            <div className="flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Mode Supabase Inactif</strong>
                Les clés d'environnement Supabase ne sont pas définies par défaut. Vous pouvez tester en mode démo local ou brancher votre propre projet.
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-1">
              <button
                type="button"
                onClick={() => setShowCustomConfigPanel(true)}
                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 rounded text-[10px] font-bold uppercase tracking-wide transition-colors"
              >
                ⚙️ Configurer mes clés
              </button>
            </div>
          </div>
        )}

        {/* Custom Supabase config pane */}
        {showCustomConfigPanel ? (
          <form onSubmit={handleSaveConfig} className="bg-slate-800/80 border border-slate-700/50 p-5 rounded-2xl flex flex-col gap-3.5 mb-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded tracking-widest flex items-center gap-1">
                <Database className="w-3 h-3" /> Vos Clés Supabase
              </h4>
              <button
                type="button"
                onClick={() => setShowCustomConfigPanel(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Retour
              </button>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              Collez vos clés d'API Supabase pour lier directement cette interface avec votre base de données en direct :
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Supabase Project URL</label>
              <input
                type="url"
                required
                placeholder="https://abc.supabase.co"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="p-2 bg-slate-900 border border-slate-750 rounded-lg text-xs outline-none focus:border-indigo-500 text-slate-300 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Supabase Anon Key</label>
              <input
                type="text"
                required
                placeholder="eyJhbGciOi..."
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="p-2 bg-slate-900 border border-slate-750 rounded-lg text-xs outline-none focus:border-indigo-500 text-slate-300 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={configSuccess}
              className={`w-full py-2 ${
                configSuccess ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-750"
              } text-white font-bold text-xs rounded-xl tracking-wide transition-all shadow-md flex items-center justify-center gap-1`}
            >
              {configSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Clés enregistrées en mémoire !
                </>
              ) : (
                "Sauvegarder et tester"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Account Tab Switcher */}
            <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 mb-2">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("signin");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeMode === "signin"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LogIn className="w-3 h-3" /> Se Connecter
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode("signup");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeMode === "signup"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Créer un Compte
              </button>
            </div>

            {errorMsg && (
              <div className="flex flex-col gap-3">
                {/* Default compact error message fallback */}
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>

                {/* Sub-guide 1: Email not confirmed */}
                {(errorMsg.toLowerCase().includes("email not confirmed") ||
                  errorMsg.toLowerCase().includes("email_not_confirmed") ||
                  errorMsg.toLowerCase().includes("confirmation d'email") ||
                  errorMsg.toLowerCase().includes("email confirmation")) && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs text-amber-200 flex flex-col gap-3 animate-fadeIn">
                    <div>
                      <strong className="text-amber-300 block mb-1">💡 Comment désactiver cette confirmation d'email :</strong>
                      <p className="leading-relaxed text-[11px] text-slate-300">
                        Votre projet Supabase exige actuellement de confirmer l'adresse email par défaut. Pour supprimer cette contrainte obligatoire de test :
                      </p>
                    </div>
                    
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-750 flex flex-col gap-1 text-[11px] text-slate-300 font-sans">
                      <div className="flex gap-1.5 items-start">
                        <span className="text-indigo-400 font-bold">1.</span>
                        <span>Allez sur votre <strong>Dashboard Supabase</strong>.</span>
                      </div>
                      <div className="flex gap-1.5 items-start">
                        <span className="text-indigo-400 font-bold">2.</span>
                        <span>Rendez-vous dans la rubrique <strong>Authentication</strong> &gt; <strong>Providers</strong> &gt; <strong>Email</strong>.</span>
                      </div>
                      <div className="flex gap-1.5 items-start">
                        <span className="text-indigo-400 font-bold">3.</span>
                        <span>Décochez ou désactivez l'option <strong>"Confirm email"</strong> (Confirmer l'adresse e-mail).</span>
                      </div>
                      <div className="flex gap-1.5 items-start">
                        <span className="text-indigo-400 font-bold">4.</span>
                        <span>Cliquez sur <strong>Save</strong> en bas.</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end mt-1">
                      <button
                        type="button"
                        onClick={onContinueOffline}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                      >
                        Passer en Démo Locale
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                      >
                        Réessayer
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-guide 2: Network error / Fetch Error (Adblocker warning) */}
                {(errorMsg.toLowerCase().includes("failed to fetch") ||
                  errorMsg.toLowerCase().includes("networkerror") ||
                  errorMsg.toLowerCase().includes("network error") ||
                  errorMsg.toLowerCase().includes("fetch resource") ||
                  errorMsg.toLowerCase().includes("load resource")) && (
                  <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-xl text-xs text-rose-200 flex flex-col gap-3 animate-fadeIn">
                    <div>
                      <strong className="text-rose-300 block mb-1">🌐 Diagnostics et résolution du problème :</strong>
                      <p className="leading-relaxed text-[11px] text-slate-300">
                        La requête réseau vers votre instance Supabase a échoué. Voici les points à vérifier :
                      </p>
                    </div>
                    
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-755 flex flex-col gap-2 text-[11px] text-slate-300 pointer-events-auto">
                      <div className="flex gap-2 items-start">
                        <span className="text-rose-400 text-xs">🛡️</span>
                        <span><strong>Désactivez votre bloqueur de pubs :</strong> Les extensions comme <em>uBlock Origin</em>, <em>AdBlock Plus</em> ou le bouclier <em>Brave Shield</em> bloquent régulièrement les requêtes sortantes vers <code>supabase.co</code> par mesure de confidentialité CDN. Désactivez-le temporairement pour ce site ou testez en navigation privée.</span>
                      </div>
                      <div className="flex gap-2 items-start">
                        <span className="text-rose-400 text-xs">🌍</span>
                        <span><strong>Réseau Restreint (ex: RDC) :</strong> Si vous testez depuis le Congo RDC, les fournisseurs de services bloquent parfois l'accès CDN de Supabase. Utilisez un VPN gratuit (ex: Proton VPN) raccordé en France ou en Belgique.</span>
                      </div>
                      <div className="flex gap-2 items-start">
                        <span className="text-rose-400 text-xs">🔗</span>
                        <span><strong>URL incorrecte :</strong> Assurez-vous que l'URL commence bien par <code>https://</code> et que la Anon Key est complète.</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end mt-1">
                      <button
                        type="button"
                        onClick={onContinueOffline}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                      >
                        Utiliser le mode Démo Local Fast ➔
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs p-3 rounded-xl flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {activeMode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nom Complet</label>
                <input
                  type="text"
                  required
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="p-3 bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs outline-none text-slate-100 placeholder:text-slate-500 font-medium font-sans"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adresse Email</label>
              <input
                type="email"
                required
                placeholder="jean.dupont@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-3 bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs outline-none text-slate-100 placeholder:text-slate-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-3 bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs outline-none text-slate-100 placeholder:text-slate-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!isConfigured && !customSupabaseConfig)}
              className="w-full bg-indigo-600 hover:bg-indigo-550 active:scale-98 disabled:opacity-50 disabled:active:scale-100 text-white font-bold text-xs py-3 rounded-xl tracking-wider transition-all shadow-lg shadow-indigo-600/10 mt-2 hover:shadow-indigo-600/20"
            >
              {loading
                ? "Traitement en cours..."
                : activeMode === "signup"
                ? "S'inscrire et générer le profil"
                : "Se Connecter"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col gap-3">
          <button
            type="button"
            onClick={onContinueOffline}
            className="w-full text-center text-slate-400 hover:text-slate-100 text-xs font-semibold py-1 hover:underline transition-all"
          >
            Continuer en Mode Hors-ligne / Bac à Sable ➔
          </button>
          
          <div className="text-[10px] text-slate-500 leading-normal text-center">
            🔒 Vos données sont sécurisées. En mode hors-ligne, tout est stocké de façon étanche sur votre navigateur (LocalStorage).
          </div>

          <div className="border-t border-slate-800/30 mt-2 pt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="w-full py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 font-bold text-[10px] rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" /> 
              {showSqlGuide ? "Masquer le script SQL" : "Code SQL : Créer la Base de Données"}
            </button>

            {showSqlGuide && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 animate-fadeIn max-h-[220px] overflow-y-auto font-sans leading-relaxed text-[11px] text-slate-300">
                <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-850">
                  <span className="font-bold text-[10px] uppercase text-indigo-300 tracking-wider">Script SQL Supabase d'initialisation</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sqlText = `-- 1. Table Profiles\n` +
                        `create table if not exists public.profiles (\n` +
                        `  id uuid references auth.users on delete cascade primary key,\n` +
                        `  name text not null,\n` +
                        `  revenu_mensuel numeric default 2000,\n` +
                        `  loyer numeric default 500,\n` +
                        `  transport numeric default 100,\n` +
                        `  alimentation numeric default 300,\n` +
                        `  factures numeric default 100,\n` +
                        `  loisirs numeric default 100,\n` +
                        `  epargne numeric default 1000,\n` +
                        `  objectif_nom text default 'Voyage',\n` +
                        `  objectif_montant numeric default 5000\n` +
                        `);\n\n` +
                        `alter table public.profiles enable row level security;\n\n` +
                        `create policy "Permettre la lecture individuelle" on public.profiles\n` +
                        `  for select using (auth.uid() = id);\n\n` +
                        `create policy "Permettre l'insertion individuelle" on public.profiles\n` +
                        `  for insert with check (auth.uid() = id);\n\n` +
                        `create policy "Permettre la modification individuelle" on public.profiles\n` +
                        `  for update using (auth.uid() = id);\n\n` +
                        `-- 2. Table Transactions\n` +
                        `create table if not exists public.transactions (\n` +
                        `  id text primary key,\n` +
                        `  user_id uuid references auth.users on delete cascade not null,\n` +
                        `  type text not null check (type in ('Revenu', 'Dépense')),\n` +
                        `  categorie text not null,\n` +
                        `  montant numeric not null,\n` +
                        `  description text,\n` +
                        `  date_transaction text not null\n` +
                        `);\n\n` +
                        `alter table public.transactions enable row level security;\n\n` +
                        `create policy "Lecture individuelle transactions" on public.transactions\n` +
                        `  for select using (auth.uid() = user_id);\n\n` +
                        `create policy "Insertion individuelle transactions" on public.transactions\n` +
                        `  for insert with check (auth.uid() = user_id);\n\n` +
                        `create policy "Suppression individuelle transactions" on public.transactions\n` +
                        `  for delete using (auth.uid() = user_id);\n\n` +
                        `create policy "Modification individuelle transactions" on public.transactions\n` +
                        `  for update using (auth.uid() = user_id);`;
                      navigator.clipboard.writeText(sqlText);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2000);
                    }}
                    className="px-2 py-1 bg-indigo-600 hover:bg-slate-800 text-white hover:text-indigo-400 font-extrabold text-[9px] rounded uppercase tracking-wider transition-all"
                  >
                    {copiedSql ? "Copié !" : "Copier"}
                  </button>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-normal">
                  Copiez le code ci-dessous et collez-le dans l'onglet <strong>SQL Editor</strong> de votre projet Supabase pour créer la structure et configurer la sécurité RLS.
                </p>

                <pre className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-normal pointer-events-auto select-all">
{`-- 1. Table Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  revenu_mensuel numeric default 3500,
  loyer numeric default 800,
  transport numeric default 150,
  alimentation numeric default 450,
  factures numeric default 200,
  loisirs numeric default 300,
  epargne numeric default 8400,
  objectif_nom text default 'Nouvelle Voiture Électrique',
  objectif_montant numeric default 18000
);

alter table public.profiles enable row level security;

create policy "Permettre la lecture individuelle" on public.profiles
  for select using (auth.uid() = id);

create policy "Permettre l'insertion individuelle" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Permettre la modification individuelle" on public.profiles
  for update using (auth.uid() = id);

-- 2. Table Transactions
create table if not exists public.transactions (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('Revenu', 'Dépense')),
  categorie text not null,
  montant numeric not null,
  description text,
  date_transaction text not null
);

alter table public.transactions enable row level security;

create policy "Lecture individuelle transactions" on public.transactions
  for select using (auth.uid() = user_id);

create policy "Insertion individuelle transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "Suppression individuelle transactions" on public.transactions
  for delete using (auth.uid() = user_id);

create policy "Modification individuelle transactions" on public.transactions
  for update using (auth.uid() = user_id);`}
                </pre>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="text-[10px] text-slate-600 mt-6 tracking-wide font-medium flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-slate-700 animate-pulse" /> Édit d'Assistant Financier Personnel • Supabase Enabled
      </div>

    </div>
  );
}
