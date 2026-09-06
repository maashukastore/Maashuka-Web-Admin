// app/dashboard/layout.js (Server Component by default)
import { createClient } from "@/lib/supabase/server";
import DashboardLayoutClient from "./DashboardLayoutClient"; // Your client wrapper

export default async function DashboardServerLayout({ children }) {
  const supabase = await createClient();
  
  // 1. Fetch user parameters safely on the server side
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Format a payload to fall back on if user metadata elements are missing
  const userData = {
    name: user?.user_metadata?.name || user?.email?.split("@")[0] || "Admin",
    email: user?.email || "operations@maashuka.in",
    initials: (user?.user_metadata?.name?.[0] || user?.email?.[0] || "M").toUpperCase()
  };

  // 3. Render your client component wrapper passing the user object straight down as a prop
  return (
    <DashboardLayoutClient user={userData}>
      {children}
    </DashboardLayoutClient>
  );
}