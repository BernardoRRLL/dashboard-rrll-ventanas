import { createClient } from '@supabase/supabase-js';

// Tus llaves de conexión oficiales
const supabaseUrl = 'https://junonlrrbohcsvyhejkv.supabase.co';
const supabaseKey = 'sb_publishable_80Rv77E5TIordn2knqqRWg_UKxYd4Vz';

export const supabase = createClient(supabaseUrl, supabaseKey);
