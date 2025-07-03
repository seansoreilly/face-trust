import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { testSupabaseConnection } from './integrations/supabase/client'

// Test Supabase connection on app startup
testSupabaseConnection();

createRoot(document.getElementById("root")!).render(<App />);
