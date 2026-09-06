import Link from "next/link";
import DashboardPage from "./dashboard/page";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const user = await supabase.auth.getUser();
  console.log("Current User Session:", user);
  if (!user.data?.user) {
    return redirect("/login");
  }
  return redirect("/dashboard");
}
