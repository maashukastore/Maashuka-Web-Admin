import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import OrderView from "../../../../components/Orders/OrderView";

export const metadata = {
  title: "Order Manifest Inspection | Maashuka Admin",
};

export default async function OrderDetailPage({ params }) {
  const { id: orderId } = await params;
  
  const supabase = await createClient();
 
  // 1. Verify Administrative Session Clearance
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Execute parallel relational queries (💡 Dynamic multi-row shipments history mapping)
  const [orderResponse, itemsResponse, shipmentsResponse] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        *,
        coupon:coupons (
          id,
          code,
          discount_type,
          discount_value
        ),
        reviews:product_reviews (
          id,
          rating,
          comment,
          variant_id,
          product_id,
          created_at
        ),
        address:delivery_address (
          *
        )
      `)
      .eq("id", orderId)
      .maybeSingle(),
      
    supabase
      .from("order_items")
      .select(`
        quantity,
        price,
        product_variants (
          id,
          product_id,
          variant_image,
          size,
          color,
          color_hex,
          sku,
          products (
            id,
            name,
            slug
          )
        )
      `)
      .eq("order_id", orderId),

    // 💡 FETCH ALL HISTORICAL SHIPMENTS FOR THE MODAL VIEWER
    supabase
      .from("shipments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
  ]);

  if (orderResponse.error || !orderResponse.data) {
    console.error("Order Query Engine Failed to find record:", orderResponse.error);
    notFound();
  }

  const orderData = orderResponse.data;
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, phone")
    .eq("id", orderData.user_id)
    .maybeSingle();

  // 3. Compile direct payload injection tokens
  const comprehensiveOrderPayload = {
    ...orderData,
    customer: profile || { name: "Boutique Buyer", email: "No Email Bound", phone: "N/A" },
    items: itemsResponse.data || [],
    shipments: shipmentsResponse.data || [], // ◄ Array collection delivers directly to the workspace grid modal
    shipment: shipmentsResponse.data?.[0] || null // ◄ Keeps absolute fallback integration for the layout card top summary
  };

  return <OrderView initialOrder={comprehensiveOrderPayload} />;
}