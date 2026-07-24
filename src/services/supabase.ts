import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-public-key'

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('Supabase URL is undefined at runtime!')
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Supabase Anon Key is undefined at runtime!')
}

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})
