import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CategoriesManager from "../../../components/Products/CategoriesManager";

export const metadata = {
  title: "Taxonomy & Categories Management | Maashuka Admin",
};

export default async function CategoriesPage() {
  const supabase = await createClient();

  // 1. Enforce Administrative Access Controls
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(user?.user_metadata?.role === "admin" || user?.user_metadata?.role === "superadmin")) {
    redirect("/login");
  }

  // 2. Pre-fetch total available categories ordered alphabetically
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, created_at,slug")
    .order("name", { ascending: true });

  return <CategoriesManager initialCategories={categories || []} />;
}