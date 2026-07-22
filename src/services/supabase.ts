import { createClient } from '@supabase/supabase-js'

console.log('FULL ENV OBJECT:', import.meta.env)
console.log('SUPABASE URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('ANON KEY LOADED:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-public-key'

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('Supabase URL is undefined at runtime!')
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Supabase Anon Key is undefined at runtime!')
}

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey)
