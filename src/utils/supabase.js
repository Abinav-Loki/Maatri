import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url) => {
    if (!url || url.includes('YOUR_SUPABASE_URL')) return false;
    try {
        const testUrl = url.startsWith('http') ? url : `https://${url}`;
        new URL(testUrl);
        return true;
    } catch {
        return false;
    }
};

const finalUrl = supabaseUrl && isValidUrl(supabaseUrl)
    ? (supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`)
    : null;

if (!finalUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing or invalid. External storage will not work.');
}

// Complete mock to prevent crashes like "Cannot read properties of undefined (reading 'signUp')"
const mockSupabase = {
    auth: {
        signUp: async () => ({ data: { user: null }, error: new Error('Supabase not configured. Please check your .env file.') }),
        signInWithPassword: async () => ({ data: { user: null }, error: new Error('Supabase not configured.') }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
        select: () => ({
            single: () => ({ data: null, error: new Error('Supabase not configured.') }),
            eq: () => ({ single: () => ({ data: null, error: new Error('Supabase not configured.') }) }),
        }),
        insert: async () => ({ error: new Error('Supabase not configured.') }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: new Error('Supabase not configured.') }) }) }) }),
        delete: () => ({ eq: () => ({ error: new Error('Supabase not configured.') }) }),
    })
};

export const supabase = finalUrl
    ? createClient(finalUrl, supabaseAnonKey || '')
    : mockSupabase;
