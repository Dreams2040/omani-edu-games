// Public Supabase settings. Both values are meant to be public: the publishable
// key is sent to every visitor's browser, and Row Level Security protects the data.
// Environment variables override them (e.g. to point at another project).
// Never put the secret / service_role key here or in any NEXT_PUBLIC_ variable.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xwcgolyhwobifaupkjzn.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_o2_01IgSJPSAJpG7w48aYQ_kyBlxqJ-";
