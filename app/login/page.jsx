import Link from "next/link";
import Login from "../Auth/Login";
import {createClient} from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  console.log("User Session Data:", session);
  if(!(session?.user?.user_metadata?.role === "superadmin" || session?.user?.user_metadata?.role === "admin")) {
  return <Login />;  

  }else{
  redirect("/dashboard");
  }
  
  
  
}