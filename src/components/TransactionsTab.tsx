import React, { useState } from "react";
import { Plus, X, Upload, AlertTriangle } from "lucide-react";
import { Transaction } from "../types";

interface TransactionsTabProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  userSession: any;
  supabase: any;
  showAddTx: boolean;
  setShowAddTx: (show: boolean) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  triggerConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export default function TransactionsTab({
  transactions,
  setTransactions,
  userSession,
  supabase,
  showAddTx,
  setShowAddTx,
  showToast,
  triggerConfirm,
}: TransactionsTabProps) {
  // Local UI states
  const [showCsvHelp, setShowCsvHelp] = useState(false);
  const [csvContentText, setCsvContentText] = useState("");
  const [csvSuccessMsg, setCsvSuccessMsg] = useState("");

  const [newTx, setNewTx] = useState({
    type: "Dépense" as "Revenu" | "Dépense",
    categorie: "Alimentation",
    montant: "",
    description: "",
    date_transaction: new Date().toISOString().split("T")[0],
  });

  // Handle new transaction manual submission
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

    let offline = !navigator.onLine;
    if (userSession?.user && supabase && !offline) {
      try {
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
          console.warn("DB offline or error during tx save:", error);
          offline = true;
        }
      } catch (e) {
        offline = true;
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
    if (offline) {
      showToast("Transaction enregistrée localement (Mode hors-ligne) 💾", "info");
    } else {
      showToast("Transaction enregistrée avec succès !");
    }
  };

  // CSV Importer logic
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
      let offline = !navigator.onLine;
      if (userSession?.user && supabase && !offline) {
        try {
          const payload = importedTx.map(t => ({
            id: t.id,
            user_id: t.id ? userSession.user.id : null, // Prevent crash if missing t.id
            type: t.type,
            categorie: t.categorie,
            montant: t.montant,
            description: t.description,
            date_transaction: t.date_transaction
          }));
          const { error } = await supabase.from("transactions").insert(payload);
          if (error) {
            console.warn("DB offline during CSV import:", error);
            offline = true;
          }
        } catch (e) {
          offline = true;
        }
      }
      setTransactions((prev) => [...importedTx, ...prev]);
      setCsvSuccessMsg(`Succès! ${addedCount} transactions importées avec succès.`);
      setCsvContentText("");
      setTimeout(() => setCsvSuccessMsg(""), 4000);
      
      if (offline) {
        showToast(`${addedCount} transactions importées localement ! 💾`, "info");
      } else {
        showToast(`${addedCount} transactions importées !`);
      }
    } else {
      showToast("Aucune ligne CSV interprétable n'a été détectée.", "error");
    }
  };

  return (
    <div id="screen-transactions" className="flex flex-col gap-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display">Tous vos mouvements financiers</h2>
          <p className="text-xs text-slate-550">Ajoutez, filtrez vos dépenses ou importez vos données bancaires au format standard CSV.</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddTx(!showAddTx)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-100 shadow-sm transition-colors cursor-pointer"
          >
            {showAddTx ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddTx ? "Fermer le formulaire" : "Nouvelle Transaction"}
          </button>
          
          <button
            onClick={() => setShowCsvHelp(!showCsvHelp)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-750 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
            <button onClick={() => setShowCsvHelp(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
              className="px-3 py-1.5 text-slate-550 font-medium hover:text-slate-700 cursor-pointer"
            >
              Remplir l'exemple
            </button>
            <button 
              onClick={handleImportCsvText}
              className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 cursor-pointer"
            >
              Enregistrer l'import
            </button>
          </div>
        </div>
      )}

      {csvSuccessMsg && (
        <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 p-3 rounded-lg text-xs font-semibold animate-fadeIn animate-duration-300">
          {csvSuccessMsg}
        </div>
      )}

      {/* Add Transaction Drawer */}
      {showAddTx && (
        <form onSubmit={handleAddTxSubmit} className="bg-gradient-to-tr from-slate-50 to-white p-5 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm animate-fadeIn">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Ajouter un mouvement manuellement</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            
            {/* Form Field 1: Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Type</label>
              <select
                value={newTx.type}
                onChange={(e) => setNewTx({ ...newTx, type: e.target.value as "Revenu" | "Dépense" })}
                className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
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
                className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
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
                className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
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
                className="p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
              />
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setShowAddTx(false)}
              className="px-3.5 py-1.5 hover:bg-slate-100 text-slate-550 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-755 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
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
                        "bg-slate-100 text-slate-650"
                      }`}>
                        {t.categorie}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-black">
                      <span className={t.type === "Revenu" ? "text-emerald-600" : "text-rose-500"}>
                        {t.type === "Revenu" ? "+" : "-"}{t.montant.toFixed(2)} USD
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center animate-fadeIn">
                      <button
                        onClick={() => {
                          triggerConfirm(
                            "Supprimer la transaction",
                            "Êtes-vous sûr de vouloir supprimer définitivement cette transaction ?",
                            async () => {
                              let offline = !navigator.onLine;
                              if (userSession?.user && supabase && !offline) {
                                try {
                                  const { error } = await supabase.from("transactions").delete().eq("id", t.id);
                                  if (error) {
                                    console.warn("DB offline or error during delete:", error);
                                    offline = true;
                                  }
                                } catch (e) {
                                  offline = true;
                                }
                              }
                              setTransactions(transactions.filter((item) => item.id !== t.id));
                              if (offline && userSession?.user) {
                                showToast("Transaction effacée localement (Mode hors-ligne) 💾", "info");
                              } else {
                                showToast("Transaction effacée avec succès.");
                              }
                            }
                          );
                        }}
                        className="text-[10px] font-semibold text-rose-500 hover:text-rose-700 px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
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
                  let offline = !navigator.onLine;
                  if (userSession?.user && supabase && !offline) {
                    try {
                      const { error } = await supabase.from("transactions").delete().eq("user_id", userSession.user.id);
                      if (error) {
                        console.warn("DB offline or error during mass delete:", error);
                        offline = true;
                      }
                    } catch (e) {
                      offline = true;
                    }
                  }
                  setTransactions([]);
                  if (offline && userSession?.user) {
                    showToast("Registre complet réinitialisé localement ! 💾", "info");
                  } else {
                    showToast("Registre complet réinitialisé !", "info");
                  }
                }
              );
            }}
            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wider cursor-pointer"
          >
            Remise à zéro du registre complet
          </button>
        </div>
      </div>

    </div>
  );
}
