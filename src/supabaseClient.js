import { createSupabaseBrowserClient } from '@/lib/supabase/client';

let supabase = null;

try {
  supabase = createSupabaseBrowserClient();
} catch {
  supabase = null;
}

export { supabase };
