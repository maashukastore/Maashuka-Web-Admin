import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditProductForm from "../../../../components/Products/EditProductForm";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Modify Catalog Record | Maashuka Admin",
};

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if(!user || !(user?.user_metadata?.role === "admin" || user?.user_metadata?.role === "superadmin")) {
   
      redirect("/login")

  }

  // Pre-fetch the master product parameters combined with all mapped children variants
  const { data: productData } = await supabase
    .from("products")
    .select(`
      id,
      name,
      category_id,
      description,
      base_price,
      images,
      is_active,
      created_at,
      categories ( name ),
      product_variants (
        id,
        sku,
        color,
        color_hex,
        size,
        variant_price,
        stock_quantity,
        variant_image,
        is_active
      )
    `)
    .eq("id", id)
    .single();

  if (!productData) {
    notFound(); // Redirect cleanly to Next.js 404 page if a bad token string is requested
  }

  // Pre-fetch category options for the drop-down selector matrix
  const { data: categoriesData } = await supabase.from("categories").select("id, name");

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-900">Modify Product Sheet</h1>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">
          Update core metadata copies, manage dimensional stock levels, and control R2 storage matrices.
        </p>
      </div>

      {/* Initialize the workspace component with pre-loaded database values */}
      <EditProductForm product={productData} categories={categoriesData || []} />
    </div>
  );
}