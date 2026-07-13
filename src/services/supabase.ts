// Supabase client initialization placeholder.
// In the future, install @supabase/supabase-js and configure environment variables.
// Use:
// import { createClient } from '@supabase/supabase-js'
// export const supabase = createClient(supabaseUrl, supabaseKey)

export const SUPABASE_URL_PLACEHOLDER = 'https://your-supabase-project.supabase.co'
export const SUPABASE_ANON_KEY_PLACEHOLDER = 'your-anon-public-key'

// Dummy client interface for compilation and typing safety
export const supabasePlaceholder = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  }),
}
