import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Anon Key from your Dashboard
const supabaseUrl = 'https://czkhddidwlgioayofjze.supabase.co';
const supabaseKey = 'sb_publishable_Pqu6PBu0L6SL1TbX5I-Svg_bzAQwOGM';

export const supabase = createClient(supabaseUrl, supabaseKey);
