import { createClient } from '@supabase/supabase-js';

// Server-side Supabase admin client (service role — bypasses RLS)
// DO NOT import this in client components or pages with 'use client'
// Always call getSupabaseAdmin() inside functions, never at module level

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Legacy export for backward compatibility — use getSupabaseAdmin() instead
export const supabaseAdmin = {
  from: (table: string) => getSupabaseAdmin().from(table),
  auth: { admin: { generateLink: (...args: any[]) => getSupabaseAdmin().auth.admin.generateLink(...args) } },
  rpc: (fn: string, args?: any) => getSupabaseAdmin().rpc(fn, args),
};
