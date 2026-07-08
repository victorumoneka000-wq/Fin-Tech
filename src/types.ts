export interface FinancialProfile {
  name: string;
  revenu_mensuel: number;
  loyer: number;
  transport: number;
  alimentation: number;
  factures: number;
  loisirs: number;
  epargne: number; // actual starting/current savings
  objectif_nom: string;
  objectif_montant: number;
}

export interface Transaction {
  id: string;
  type: "Revenu" | "Dépense";
  categorie: string;
  montant: number;
  description: string;
  date_transaction: string; // YYYY-MM-DD
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatDiscussion {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}
