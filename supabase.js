// ===============================
// SUPABASE CONFIG - OMEGAHUB
// Release 2.3
// ===============================

// URL del proyecto
const SUPABASE_URL = "https://qaslnhtzmquqcuktdkdd.supabase.co";

// Public Anon Key
const SUPABASE_KEY = "sb_publishable_n0zbjKrmY2bTtKFW_TsPzw_k6AGz9-N";

// Crear una única instancia global
window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Confirmación en consola
console.log("✅ Supabase inicializado correctamente");