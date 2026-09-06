import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Workspace Overview | Maashuka Admin",
  description: "Real-time store performance variable metrics tracking portal.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("Current dashboard User Session:", user);
  if (!user) {
    return redirect("/login");
  }

  let totalRevenue = 0;
  let ordersCount = 0;
  let couponCount = 0;
  let lowStockCount = 0;
  let latestOrders = [];
  let lowStockVariants = [];

  try {
    // 1. Fetch Gross Revenue Metric Blocks & Total Orders Count from the Orders table
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("payable_amount, status, created_at");

    if (ordersError) throw ordersError;

    if (ordersData) {
      ordersCount = ordersData.length;
      totalRevenue = ordersData.reduce(
        (acc, curr) => acc + Number(curr.payable_amount),
        0,
      );
    }

    // 2. Fetch Active Promotional Vouchers Count
    const { count: activeCoupons } = await supabase
      .from("coupons")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    couponCount = activeCoupons || 0;

    // 3. Fetch Low Stock Threshold Warnings from the product variants matrix table
    const { data: variantsData, count: lowStockThresholdCount } = await supabase
      .from("product_variants")
      .select("id, sku, stock_quantity, size, color, products(name)", {
        count: "exact",
      })
      .lt("stock_quantity", 5);

    lowStockVariants = variantsData || [];
    lowStockCount = lowStockThresholdCount || 0;

    // 4. Fetch the Top 5 most recent orders for the activity ledger queue
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, payable_amount, status, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(5);

    latestOrders = recentOrders || [];
  } catch (err) {
    console.error("Dashboard backend pre-fetch sequence crash:", err);
  }

  // Group server variables into a clean data prop container
  const initialDashboardData = {
    metrics: {
      grossRevenue: totalRevenue,
      revenueChange: +12.4, // Standard baseline trend metric parameters
      totalOrders: ordersCount,
      ordersChange: +8.2,
      activeCoupons: couponCount,
      lowStockCount: lowStockCount,
    },
    recentOrders: latestOrders,
    lowStockProducts: lowStockVariants,
  };

  return <DashboardClient initialData={initialDashboardData} user={user} />;
}
