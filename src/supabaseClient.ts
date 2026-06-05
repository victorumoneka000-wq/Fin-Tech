import { createClient } from "@supabase/supabase-js";

// Retrieve keys from env variables OR from local storage custom settings
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

const localUrl = localStorage.getItem("custom_supabase_url");
const localKey = localStorage.getItem("custom_supabase_anon_key");

// Check if they are configured and not just placeholder strings
const isValidVal = (val: string | undefined | null) => {
  return val && val.trim() !== "" && !val.includes("your-project") && !val.includes("your-anon-key");
};

export const getSupabaseConfig = () => {
  const url = isValidVal(envUrl) ? envUrl : (isValidVal(localUrl) ? localUrl : null);
  const anonKey = isValidVal(envKey) ? envKey : (isValidVal(localKey) ? localKey : null);
  
  return {
    url,
    anonKey,
    isConfigured: !!url && !!anonKey,
    isUsingEnv: isValidVal(envUrl) && isValidVal(envKey)
  };
};

export const isSupabaseConfigured = () => {
  return getSupabaseConfig().isConfigured;
};

const config = getSupabaseConfig();

export const supabase = config.isConfigured
  ? createClient(config.url!, config.anonKey!)
  : null;
