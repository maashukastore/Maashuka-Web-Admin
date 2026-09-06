import Link from "next/link";
import { Plus } from "lucide-react";
import { getPaginatedProducts } from "../action";
import ProductList from "../../components/Products/ProductList"; // We will create this next
import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Products Catalog | Maashuka Admin",
};

export default async function AdminProductsPage() {
  //get user session and role for conditional rendering and access control
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if(!user || !(user?.user_metadata?.role === "admin" || user?.user_metadata?.role === "superadmin")) {
   
      redirect("/login")

  }

  // Pre-fetch Page 1 directly from the server on initial load
  const initialData = await getPaginatedProducts({
    page: 1,
    pageSize: 8,
    tab: "all",
    search: ""
  });

  return (
    <div className="space-y-8 text-left">
      
      {/* HEADER CONTROL CONTAINER
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Products Catalog</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Manage boutique listings, track variant profiles, and adjust stock pools.
          </p>
        </div>
        <Link
          href="/products/new"
          className="bg-slate-900 text-white text-xs font-bold uppercase tracking-widest px-5 py-3.5 rounded-xl hover:bg-primary transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={14} />
          <span>Add New Product</span>
        </Link>
      </div> */}

      {/* Render the interactive table component with the pre-fetched initial server data payload */}
      <ProductList initialProducts={initialData} user={user} />

    </div>
  );
}