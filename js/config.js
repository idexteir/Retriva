// FULL FILE — config.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://bmrjhswztnjbsjiaporo.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcmpoc3d6dG5qYnNqaWFwb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTc1NTYsImV4cCI6MjA3ODY5MzU1Nn0.M7L3vu7EoB31obu5m5RCYRhrnwngLc1qNNEbT8ns_Uw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
