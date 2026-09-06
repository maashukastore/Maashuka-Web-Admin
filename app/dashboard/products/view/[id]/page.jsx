import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProductView from "../../../../components/Products/ProductView"; // We will create this next

export const metadata = {
  title: "Asset Specifications View | Maashuka Admin",
};

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch parent specs along with ALL child variants (active and inactive)
  const { data: product } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      base_price,
      sale_price,
      on_sale,
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

  if (!product) {
    notFound();
  }

  return <ProductView product={product} />;
}