const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const forceLocalDemo = import.meta.env.VITE_FORCE_LOCAL_DEMO === '1';

function hasConfiguredValue(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value !== 'undefined' &&
    value !== 'null'
  );
}

export const isSupabaseConfigured =
  !forceLocalDemo &&
  hasConfiguredValue(supabaseUrl) && hasConfiguredValue(supabaseAnonKey);
export const isLocalDemoMode = !isSupabaseConfigured;
