import React from "react";
import { Sparkles } from "lucide-react";
import { FinancialProfile } from "../types";

interface ProjectionsTabProps {
  profile: FinancialProfile;
  simulatorExtraSavings: number;
  setSimulatorExtraSavings: React.Dispatch<React.SetStateAction<number>>;
  handleSendMessage: (text: string) => void;
}

export default function ProjectionsTab({
  profile,
  simulatorExtraSavings,
  setSimulatorExtraSavings,
  handleSendMessage,
}: ProjectionsTabProps) {
  // Compute standard baseline
  const totalPlannedExpenses =
    Number(profile.loyer) +
    Number(profile.transport) +
    Number(profile.alimentation) +
    Number(profile.factures) +
    Number(profile.loisirs);

  const potentialMonthlySavings = Math.max(0, Number(profile.revenu_mensuel) - totalPlannedExpenses);

  return (
    <div id="screen-projections" className="flex flex-col gap-6 animate-fadeIn">
      
      <div>
        <h2 className="text-lg font-bold text-slate-900 font-display">Simulateur Prédictif d'Épargne</h2>
        <p className="text-xs text-slate-550">
          Projetez l'évolution de votre épargne sur les 12 prochains mois en fonction de vos efforts de réduction de dépenses.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        
        {/* Slider Control to simulate extra savings effort */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-700">Effort d'épargne mensuel supplémentaire :</span>
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg font-mono">
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
              className="w-full h-1.5 bg-slate-250 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
              <span>Frugalité Standard (0$)</span>
              <span>Effort Intense (+1000$)</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shrink-0 min-w-[170px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Nouvel Apport / mois :</span>
            <strong className="text-base text-slate-900 font-black">
              {(potentialMonthlySavings + simulatorExtraSavings).toLocaleString()} USD
            </strong>
          </div>
        </div>

        {/* SVG Line Graph representation */}
        <div className="mb-6 h-[220px] w-full border border-slate-100 rounded-lg p-2 bg-slate-50 relative">
          <span className="absolute top-2 left-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Trajectoire sur 12 Mois (Projection linéaire)
          </span>
          
          {/* SVG draw */}
          <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />
            
            {/* Standard trajectory line */}
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
                <React.Fragment>
                  {/* Target horizontal line for objective_montant */}
                  {profile.objectif_montant > profile.epargne && (
                    <React.Fragment>
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
                    </React.Fragment>
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
                </React.Fragment>
              );
            })()}
          </svg>

          {/* Timeline months footer label inside graph */}
          <div className="absolute bottom-1 w-full flex justify-between px-2 text-[9px] text-slate-455 font-mono font-bold">
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
                  <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                    <span className="text-slate-400">Vitesse standard :</span>
                    <span className="font-bold text-slate-800">{monthsStandard} mois</span>
                  </div>
                  <div className="flex justify-between text-xs text-indigo-700 font-semibold mb-1">
                    <span>Vitesse simulée :</span>
                    <span className="font-black text-indigo-600">{monthsOptimized} mois</span>
                  </div>
                  {gain > 0 && (
                    <div className="mt-2.5 px-2 py-1 bg-indigo-50 text-indigo-800 font-extrabold text-[10px] rounded inline-block">
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
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" /> Solliciter l'analyse du plan d'attaque ?
              </h4>
              <p className="text-[11px] text-slate-705 leading-relaxed mt-2 font-medium">
                Cliquez sur le bouton ci-dessous pour injecter cette simulation comme requête prioritaire auprès du chatbot intelligent.
              </p>
            </div>

            <button
              onClick={() => {
                const simPrompt = `J'ai fait une simulation d'épargne sur l'outil. Avec mon épargne standard de ${potentialMonthlySavings} USD et un effort additionnel de ${simulatorExtraSavings} USD, mon apport passe à ${potentialMonthlySavings + simulatorExtraSavings} USD par mois pour acquérir mon projet : "${profile.objectif_nom}" (${profile.objectif_montant} USD). Est-ce un plan réaliste par rapport à mes revenus ? Donne moi ton plan d'attaque !`;
                handleSendMessage(simPrompt);
              }}
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs tracking-wide transition-colors cursor-pointer"
            >
              Soumettre la simulation à l'IA
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
