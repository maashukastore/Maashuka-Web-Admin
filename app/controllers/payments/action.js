// app/dashboard/orders/action.js
"use server";
import { createClient } from "@/lib/supabase/server";

/**
 * Safely fetches an order, applies accurate coupon distribution math, 
 * subtracts base shipping fees, and parses historical refund states.
 */
export async function getOrderRefundContext(orderIdToken) {
  try {
    const supabase = await createClient();

    // 1. Fetch Order with child item lines, parent coupon rules, and past itemized adjustments
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(`
        id, order_id, payable_amount, status, payment_mode, created_at,payment_id, shipping_cost,
        coupon:coupons ( id, code, discount_value, discount_type ),
        items:order_items (
          id, quantity, price,
          product_variants ( sku, size, color, products ( name ) ),
          refund_items ( quantity, amount_refunded )
        )
      `)
      .eq("order_id", orderIdToken.trim())
      .single();

    if (orderError || !orderData) {
      return { success: false, message: orderError?.message || "Target order manifest missing." };
    }

    // 2. Query master records matching history arrays
    const { data: refundsData, error: refundsError } = await supabase
      .from("refunds")
      .select("refund_id, amount, type, status, created_at")
      .eq("order_id", orderData.id);

    if (refundsError) {
      return { success: false, message: "Could not sync history tracking maps." };
    }

    // 3. Mathematical Proportioning Pipeline (Excluding Shipping & Deducting Coupons)
    const rawShippingCost = Number(orderData.shipping_cost || 0);
    
    // Compute raw line-item subtotal across the entire basket items array
    const grossItemsSubtotal = orderData.items?.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0) || 1;

    // Isolate absolute coupon deduction factors
    let absoluteCouponDiscountValue = 0;
    if (orderData.coupon) {
      const { discount_value, discount_type } = orderData.coupon;
      if (discount_type === "percentage") {
        absoluteCouponDiscountValue = grossItemsSubtotal * (Number(discount_value) / 100);
      } else {
        absoluteCouponDiscountValue = Number(discount_value);
      }
    }

    // Re-map items array, proportioning down the discount weighting factor per row item
    const parsedLineItems = orderData.items?.map(item => {
      const itemRowGrossTotal = Number(item.price) * item.quantity;
      const rowWeightRatio = itemRowGrossTotal / grossItemsSubtotal;
      
      // Calculate how much coupon discount applies specifically to this single unit line row
      const rowProportionalDiscount = absoluteCouponDiscountValue * rowWeightRatio;
      const singleUnitDiscount = rowProportionalDiscount / item.quantity;
      
      // Net base price adjusted downwards to accurately balance historical payouts
      const netAdjustedItemPrice = Math.max(0, Number(item.price) - singleUnitDiscount);

      return {
        ...item,
        price: netAdjustedItemPrice, // UI values updated to reference net base price
        original_price: item.price   // Preserved raw database metrics indicator
      };
    }) || [];

    // Cleaned payload data ready to deliver to client layout canvas maps
    const sanitizedOrderPayload = {
      id: orderData.id,
      order_id: orderData.order_id,
      payable_amount: Math.max(0, Number(orderData.payable_amount || 0) - rawShippingCost), // Exclude shipping charges completely
      status: orderData.status,
      payment_mode: orderData.payment_mode,
      created_at: orderData.created_at,
      items: parsedLineItems,
      payment_id: orderData.payment_id,
      shipping_cost: rawShippingCost
    };

    return {
      success: true,
      order: sanitizedOrderPayload,
      historicRefunds: refundsData || []
    };

  } catch (err) {
    console.error("Server layout action compilation error:", err);
    return { success: false, message: "Internal server pipeline failure encountered." };
  }
}

/**
 * Calls server endpoint parameters internally to commit the snapshot mapping rows
 */
export async function submitRefundMutation(payload) {
  try {
    // Re-route processing logic into your standard internal server pathing layers
    const res = await fetch(`/api/razorpay/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return await res.json();
  } catch (error) {
    return { success: false, message: "Could not finalize server network transactions mapping." };
  }
}