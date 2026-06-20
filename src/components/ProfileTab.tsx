import React from "react";
import { User, Award } from "lucide-react";
import { FinancialProfile } from "../types";

interface ProfileTabProps {
  profile: FinancialProfile;
  setProfile: React.Dispatch<React.SetStateAction<FinancialProfile>>;
  handleResetAllData: () => void;
  handleSaveProfile: (updated: FinancialProfile) => void;
}

export default function ProfileTab({
  profile,
  setProfile,
  handleResetAllData,
  handleSaveProfile,
}: ProfileTabProps) {
  const totalPlannedExpenses =
    Number(profile.loyer) +
    Number(profile.transport) +
    Number(profile.alimentation) +
    Number(profile.factures) +
    Number(profile.loisirs);

  const potentialMonthlySavings = Math.max(0, Number(profile.revenu_mensuel) - totalPlannedExpenses);
  const savingsRate = Math.round((potentialMonthlySavings / Math.max(1, profile.revenu_mensuel)) * 100) || 0;

  return (
    <div id="screen-profile" className="flex flex-col gap-6 animate-fadeIn">
      <div>
        <h2 className="text-lg font-bold text-slate-900 font-display">Ajustement du profil financier</h2>
        <p className="text-xs text-slate-550">Mettez à jour vos revenus et configurez des enveloppes de limites budgétaires strictes pour guider les calculs de l'IA.</p>
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
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Revenu Mensuel Fixe (USD)</label>
              <input
                type="number"
                required
                value={profile.revenu_mensuel || ""}
                onChange={(e) => setProfile({ ...profile, revenu_mensuel: Number(e.target.value) })}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Loyer / Logement Mensuel</label>
              <input
                type="number"
                required
                value={profile.loyer || ""}
                onChange={(e) => setProfile({ ...profile, loyer: Number(e.target.value) })}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Alimentation Limite</label>
              <input
                type="number"
                required
                value={profile.alimentation || ""}
                onChange={(e) => setProfile({ ...profile, alimentation: Number(e.target.value) })}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Transport & Carburant</label>
              <input
                type="number"
                required
                value={profile.transport || ""}
                onChange={(e) => setProfile({ ...profile, transport: Number(e.target.value) })}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Factures & Abonnements</label>
              <input
                type="number"
                required
                value={profile.factures || ""}
                onChange={(e) => setProfile({ ...profile, factures: Number(e.target.value) })}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Budget Loisirs mensuel</label>
              <input
                type="number"
                required
                value={profile.loisirs || ""}
                onChange={(e) => setProfile({ ...profile, loisirs: Number(e.target.value) })}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Épargne Actuelle de Départ</label>
              <input
                type="number"
                required
                value={profile.epargne || ""}
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
                  className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Montant Requis (USD)</label>
                <input
                  type="number"
                  required
                  placeholder="ex: 15000..."
                  value={profile.objectif_montant || ""}
                  onChange={(e) => setProfile({ ...profile, objectif_montant: Number(e.target.value) })}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100 pb-1">
            <button 
              type="button"
              onClick={handleResetAllData}
              className="text-xs text-rose-500 font-bold hover:underline cursor-pointer"
            >
              Effacer tout
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 cursor-pointer transition-colors"
            >
              Enregistrer modifications
            </button>
          </div>
        </form>

        {/* Right sub-column: Budget rules summary explanation card */}
        <div className="md:col-span-5 flex flex-col gap-5">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Récapitulatif de vos charges fixes</h3>
            
            <div className="flex flex-col gap-2.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Revenu Mensuel :</span>
                <span className="font-mono font-bold text-slate-800">{profile.revenu_mensuel} USD</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span className="text-slate-500">Charges Globales Prévues :</span>
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
                {savingsRate}%
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">Taux d'Épargne Estimé</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">Sain si supérieur à 15%. La microfinance recommande 20%.</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-950 p-5 rounded-xl text-white shadow-sm relative overflow-hidden">
            <h3 className="font-bold font-display text-sm mb-2 text-indigo-300">Pourquoi ces données ?</h3>
            <p className="text-[11px] text-slate-200 leading-relaxed mb-3">
              Ces chiffres ne quittent pas votre session de stockage local React. L'enveloppe système sert de "Instruction Directe Contextuelle" pour le chatbot Gemini. L'IA sera ainsi en mesure de simuler un diagnostic immédiat en cas d'un écart sur vos achats ou impératifs familiaux RDC.
            </p>
            <span className="text-[9px] text-[#818CF8] uppercase tracking-widest font-bold font-mono">Protégé localement</span>
          </div>

        </div>

      </div>
    </div>
  );
}
