import React from "react";
import {
  Award,
  Sliders,
  Sparkles,
  DollarSign,
  TrendingDown,
  Plus,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { FinancialProfile, Transaction } from "../types";

interface DashboardTabProps {
  profile: FinancialProfile;
  transactions: Transaction[];
  setActiveTab: (tab: "dashboard" | "transactions" | "profile" | "projections" | "gmail") => void;
  setShowAddTx: (show: boolean) => void;
  handleSendMessage: (text: string) => void;
}

export default function DashboardTab({
  profile,
  transactions,
  setActiveTab,
  setShowAddTx,
  handleSendMessage,
}: DashboardTabProps) {
  // Derive statistical aggregates
  const totalPlannedExpenses =
    Number(profile.loyer) +
    Number(profile.transport) +
    Number(profile.alimentation) +
    Number(profile.factures) +
    Number(profile.loisirs);

  const potentialMonthlySavings = Math.max(0, Number(profile.revenu_mensuel) - totalPlannedExpenses);

  const totalRevenuesReal = transactions
    .filter((t) => t.type === "Revenu")
    .reduce((sum, t) => sum + Number(t.montant), 0);

  const totalExpensesReal = transactions
    .filter((t) => t.type === "Dépense")
    .reduce((sum, t) => sum + Number(t.montant), 0);

  // Epargne Initiale + Revenus Réels - Dépenses Réelles
  const totalBalanceComputed = Number(profile.epargne) + totalRevenuesReal - totalExpensesReal;

  const actualCategoryExpenses = transactions
    .filter((t) => t.type === "Dépense")
    .reduce((acc: Record<string, number>, t) => {
      const idx = t.categorie.toLowerCase();
      acc[idx] = (acc[idx] || 0) + Number(t.montant);
      return acc;
    }, {});

  return (
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
            className="px-3 bg-white/10 hover:bg-white/20 text-slate-100 rounded-lg text-xs py-1.5 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" /> Ajuster les enveloppes budgets
          </button>
          <button
            onClick={() => {
              const confirmPrompt = "Analyse mon budget actuel, mes transactions, et propose moi 3 astuces pour dépenser moins.";
              handleSendMessage(confirmPrompt);
            }}
            className="px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs py-1.5 font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/10 cursor-pointer"
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
                <span className="text-slate-500">Calcul en temps réel :</span>
                <span className="font-mono text-emerald-600 font-bold">
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
                <h3 className="font-bold text-slate-800 text-sm font-display">Registre des Transactions</h3>
                <span className="text-[10px] text-slate-400 mt-0.5">Vos dernières entrées et sorties d'argent</span>
              </div>
              <button
                onClick={() => setActiveTab("transactions")}
                className="text-[10.5px] font-bold text-indigo-650 uppercase tracking-widest hover:underline cursor-pointer focus:outline-none"
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
                        t.type === "Revenu" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-700"
                      }`}>
                        {t.type === "Revenu" ? "R" : "D"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{t.description}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">{t.date_transaction}</span>
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
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Goal Progress and Budget Allocation Limits (Spans 5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Goal Progress Card */}
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
                <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-black">
                  {Math.round((profile.epargne / Math.max(1, profile.objectif_montant)) * 100)}%
                </span>
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
                const pctOfLimit = Math.round((realSpent / Math.max(1, item.planned)) * 105) || 0; // matching existing round
                const pctOfLimitDisplay = Math.round((realSpent / Math.max(1, item.planned)) * 100);
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
                        style={{ width: `${Math.min(100, pctOfLimitDisplay)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center mt-1 text-[9px] font-bold">
                      <span>Consommé : {pctOfLimitDisplay}%</span>
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
  );
}
