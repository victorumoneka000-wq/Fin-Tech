import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { FinancialProfile, Transaction } from "./types";

// Name of our tables
const PROFILES_TABLE = "profiles";
const TRANSACTIONS_TABLE = "transactions";

export interface UserSession {
  user: any | null;
  profile: FinancialProfile | null;
  isAuthenticated: boolean;
}

/**
 * Handle Supabase operations for User Profiles & Transactions.
 * Highly robust structure that fails gracefully with clear user instructions.
 */
export const supabaseService = {
  /**
   * Register a new user using Supabase Auth, then create their financial profile record
   */
  signUp: async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error(
        "Supabase n'est pas configuré. Veuillez copier et renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env."
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Échec de la création de l'utilisateur.");

    // Create default initial profile in profiles table with zeroed out numbers
    const defaultProfile: FinancialProfile = {
      name,
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

    // Try to insert profile. It might fail if tables aren't made yet.
    try {
      const { error: profileError } = await supabase
        .from(PROFILES_TABLE)
        .upsert({
          id: authData.user.id,
          ...defaultProfile,
        });

      if (profileError) {
        console.warn("Could not insert initial profile, table may not exist yet:", profileError);
      }
    } catch (e) {
      console.warn("Optional profiles insert failed:", e);
    }

    return authData.user;
  },

  /**
   * Log in an existing user
   */
  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error(
        "Supabase n'est pas configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env."
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.user;
  },

  /**
   * Sign out the active user
   */
  signOut: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  },

  /**
   * Fetch current authenticated user's profile
   */
  getProfile: async (userId: string): Promise<FinancialProfile | null> => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from(PROFILES_TABLE)
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Erreur chargement profil (la table 'profiles' n'existe peut-être pas) :", error.message);
        return null;
      }
      return data as FinancialProfile;
    } catch (e) {
      return null;
    }
  },

  /**
   * Save or update user profile details
   */
  saveProfile: async (userId: string, profile: FinancialProfile) => {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from(PROFILES_TABLE)
        .upsert({
          id: userId,
          ...profile,
        });

      if (error) throw error;
      return true;
    } catch (e: any) {
      console.error("Supabase Save Profile Error:", e.message);
      return false;
    }
  },

  /**
   * Load user transactions
   */
  getTransactions: async (userId: string): Promise<Transaction[]> => {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from(TRANSACTIONS_TABLE)
        .select("*")
        .eq("user_id", userId)
        .order("date_transaction", { ascending: false });

      if (error) {
        console.warn("Erreur chargement transactions (la table n'existe peut-être pas) :", error.message);
        return [];
      }

      // Convert Supabase rows back to interface
      return (data || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        categorie: t.categorie,
        montant: Number(t.montant),
        description: t.description || "",
        date_transaction: t.date_transaction || "",
      }));
    } catch (e) {
      return [];
    }
  },

  /**
   * Save unique transaction to database
   */
  saveTransaction: async (userId: string, tx: Transaction) => {
    if (!supabase) return false;

    try {
      const { error } = await supabase.from(TRANSACTIONS_TABLE).upsert({
        id: tx.id,
        user_id: userId,
        type: tx.type,
        categorie: tx.categorie,
        montant: tx.montant,
        description: tx.description,
        date_transaction: tx.date_transaction,
      });

      if (error) throw error;
      return true;
    } catch (e: any) {
      console.error("Supabase Error saving Transaction:", e.message);
      return false;
    }
  },

  /**
   * Delete transaction row
   */
  deleteTransaction: async (txId: string) => {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from(TRANSACTIONS_TABLE)
        .delete()
        .eq("id", txId);

      if (error) throw error;
      return true;
    } catch (e: any) {
      console.error("Supabase Error deleting Transaction:", e.message);
      return false;
    }
  },

  /**
   * Bulk push offline local state items into the cloud database
   */
  bulkSync: async (userId: string, localProfile: FinancialProfile, localTx: Transaction[]) => {
    if (!supabase) return false;

    try {
      // 1. Upsert profile
      await supabase.from(PROFILES_TABLE).upsert({
        id: userId,
        ...localProfile,
      });

      // 2. Format & batch upsert transactions
      if (localTx.length > 0) {
        const formatted = localTx.map((t) => ({
          id: t.id,
          user_id: userId,
          type: t.type,
          categorie: t.categorie,
          montant: t.montant,
          description: t.description,
          date_transaction: t.date_transaction,
        }));

        await supabase.from(TRANSACTIONS_TABLE).upsert(formatted);
      }
      return true;
    } catch (e) {
      console.error("Failed to batch sync offline records:", e);
      return false;
    }
  },
};
