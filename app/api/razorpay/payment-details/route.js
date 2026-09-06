// app/api/razorpay/payment-details/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized access denied." }, { status: 401 });
    }

    const { paymentId, orderId } = await req.json();
    const authString = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");

    // 🌟 CASE A: Fetching multiple payments connected to an Order ID
    if (orderId) {
      const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId.trim()}/payments`, {
        method: "GET",
        headers: { "Authorization": `Basic ${authString}` }
      });

      const paymentsList = await response.json();
      if (!response.ok) throw new Error(paymentsList.error?.description || "Razorpay Order Fetch failed.");

      // Sanitize the items array
      const items = (paymentsList.items || []).map(p => ({
        id: p.id,
        amount: p.amount / 100,
        currency: p.currency,
        status: p.status,
        method: p.method,
        email: p.email,
        contact: p.contact,
        fee: p.fee ? p.fee / 100 : 0,
        tax: p.tax ? p.tax / 100 : 0,
        card: p.card ? {
          issuer: p.card.issuer,
          network: p.card.network,
          type: p.card.type,
          last4: p.card.last4
        } : null,
        created_at: p.created_at
      }));

      return NextResponse.json({ success: true, type: "order", data: items });
    }

    // 🌟 CASE B: Standard unique individual Payment ID track
    if (paymentId) {
      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId.trim()}`, {
        method: "GET",
        headers: { "Authorization": `Basic ${authString}` }
      });

      const paymentData = await response.json();
      if (!response.ok) throw new Error(paymentData.error?.description || "Razorpay Payment Fetch failed.");

      return NextResponse.json({
        success: true,
        type: "payment",
        data: [{
          id: paymentData.id,
          order_id: paymentData.order_id,
          amount: paymentData.amount / 100,
          currency: paymentData.currency,
          status: paymentData.status,
          method: paymentData.method,
          email: paymentData.email,
          contact: paymentData.contact,
          fee: paymentData.fee ? paymentData.fee / 100 : 0,
          tax: paymentData.tax ? paymentData.tax / 100 : 0,
          card: paymentData.card ? {
            issuer: paymentData.card.issuer,
            network: paymentData.card.network,
            type: paymentData.card.type,
            last4: paymentData.card.last4
          } : null,
          created_at: paymentData.created_at
        }]
      });
    }

    return NextResponse.json({ success: false, message: "Missing routing identifier key context parameters." }, { status: 400 });

  } catch (error) {
    console.error("Razorpay lookup route crash:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}