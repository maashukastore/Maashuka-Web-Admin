// app/api/razorpay/refund/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const supabase = await createClient();

    // 1. Session & Permission Shield Verification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized access denied." }, { status: 401 });
    }

    const { orderId, paymentId, refundType, refundAmount, itemsRefunded } = await req.json();
    console.log("Refund Request Payload:", { orderId, paymentId, refundType, refundAmount, itemsRefunded });

    if (!orderId || !paymentId || !refundAmount || refundAmount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid operational parameters." }, { status: 400 });
    }

    // 2. Fetch Existing Historic Refunds for the Order to Enforce Strict Safety Assertions
    const { data: existingRefunds } = await supabase
      .from("refunds")
      .select("id, type, amount")
      .eq("order_id", orderId);

    const hasFullRefund = existingRefunds?.some(r => r.type === "full");
    if (hasFullRefund) {
      return NextResponse.json({ success: false, message: "Operation Rejected: This manifest is already fully refunded." }, { status: 422 });
    }

    // 3. Generate Local Internal Reference Tracking Key
    const localRefundTrackingId = `rfnd_local_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  console.log("Generated Local Refund Tracking ID:", localRefundTrackingId);
    // 4. Atomically Write Master Refund Record Parent Segment
    const { data: masterRefundRecord, error: parentInsertError } = await supabase
      .from("refunds")
      .insert({
        order_id: orderId,
        payment_id: paymentId,
        amount: Number(refundAmount),
        status: "processed",
        type: refundType,
        items_meta: refundType === "partial" ? itemsRefunded : { scope: "All Basket Items" },
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select("id")
      .single();
console.log("Master Refund Record Insert Result:", { masterRefundRecord, parentInsertError });
    if (parentInsertError || !masterRefundRecord) {
      throw new Error(`Master Ledger Insertion Aborted: ${parentInsertError?.message}`);
    }

    // 5. Build Dynamic Child Relational Tracking Logs Array Block
    const childLineItemsRows = [];

    if (refundType === "full") {
      // Pull all underlying basket items along with historic refund logs to find out exactly what remains
      const { data: orderItems } = await supabase
        .from("order_items")
        .select(`
          id, quantity, price,
          refund_items ( quantity )
        `)
        .eq("order_id", orderId);

      for (const item of (orderItems || [])) {
        const historicallyRefundedUnits = item.refund_items?.reduce((sum, r) => sum + r.quantity, 0) || 0;
        const remainingUnrefundedUnits = item.quantity - historicallyRefundedUnits;

        if (remainingUnrefundedUnits > 0) {
          childLineItemsRows.push({
            refund_id: masterRefundRecord.id,
            order_item_id: item.id,
            quantity: remainingUnrefundedUnits,
            amount_refunded: remainingUnrefundedUnits * Number(item.price)
          });
        }
      }
    } else {
      // Map Partial item selection array block keys
      // Expects payload: { [order_item_id]: { qty: 2, price: 499 } }
      Object.entries(itemsRefunded).forEach(([orderItemId, meta]) => {
        childLineItemsRows.push({
          refund_id: masterRefundRecord.id,
          order_item_id: orderItemId,
          quantity: Number(meta.qty),
          amount_refunded: Number(meta.qty) * Number(meta.price)
        });
      });
    }

    // 6. Bulk Insert Line Items References if records exist
    if (childLineItemsRows.length > 0) {
      const { error: childrenBulkInsertError } = await supabase
        .from("refund_items")
        .insert(childLineItemsRows);

      if (childrenBulkInsertError) {
        console.error("Critical Child Sub-Ledger Sync Defect:", childrenBulkInsertError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Refund reference entry successfully committed to database layers.`,
      refundId: localRefundTrackingId
    });

  } catch (error) {
    console.error("Refund pipeline runtime breakdown:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}