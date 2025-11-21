import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zrkevddalzftfclnalke.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya2V2ZGRhbHpmdGZjbG5hbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMzk3MDksImV4cCI6MjA2MDgxNTcwOX0.tfWBmpZCl59h_srKog4yjX85qzMPmW7q5mys4kaP1Ds';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
