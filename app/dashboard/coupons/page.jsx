import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CouponsManager from "../../components/Coupons/CouponManager";

export const metadata = {
  title: "Promotional Coupons & Vouchers Matrix | Maashuka Admin",
};

export default async function CouponsPage() {
  // 💡 FIX 1: Add the critical 'await' to ensure the asynchronous cookieStore client is fully initialized
  const supabase = await createClient();

  // 1. Enforce Administrative Access Controls Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Fetch all promotional coupons (💡 FIX 2: Removed 'expires_at' to exactly match your DB schema pillars)
  const { data: coupons, error } = await supabase
    .from("coupons")
    .select(`
      id, 
      code, 
      discount_type, 
      discount_value, 
      min_order_amount, 
      max_discount_amount, 
      is_active, 
      start_date, 
      end_date, 
      usage_limit, 
      used_count, 
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Voucher matrix sync failure:", error);
  }

  return <CouponsManager initialCoupons={coupons || []} />;
}