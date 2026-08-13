// Joy Go Platform 會員系統設定
// 請只填 Supabase Project URL 與 anon public key；不要放 service_role key。
export const SUPABASE_URL = "https://kpwfkmkxtrwmlxhomaxy.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_0Dryz0sA-BS7Hw28vUb0oA_06N9hWqr";

export const isSupabaseConfigured = () =>
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_") &&
  SUPABASE_ANON_KEY.length > 40 &&
  !SUPABASE_ANON_KEY.includes("YOUR_");
