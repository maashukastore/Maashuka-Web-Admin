// app/dashboard/hero/page.jsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HeroManager from "../../components/Banner/HeroManager";
import { Sliders } from "lucide-react";

export const metadata = {
  title: "Storefront Canvas Landscape Management | Maashuka Admin",
};

export default async function StorefrontHeroManagementPage() {
  const supabase = await createClient();

  // 1. Enforce Authentication Guard Barrier
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch all configuration items directly from server runtime tables
  const { data: records, error } = await supabase
    .from("hero_sections")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Critical database connection dropped inside hero route mapping templates:", error);
  }

  return (
    <div className="space-y-8 text-left pb-16 animate-in fade-in duration-500">
      
      {/* HEADER SECTION PANEL PANEL */}
      <div className="border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Sliders size={14} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Visual Core Architecture</span>
        </div>
        <h1 className="text-xl font-serif font-black text-slate-900 tracking-tight">Manage Storefront Landing Hero Canvas</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Dynamically override typography copies, deploy handcrafted image assets directly to the R2 cluster partition nodes, and swap your active marketing landscape instantly across client application displays.
        </p>
      </div>

      {/* RENDER THE DECOUPLED MANAGEMENT LAYOUT INTERFACES CANVAS */}
      <HeroManager initialTemplates={records || []} />

    </div>
  );
}