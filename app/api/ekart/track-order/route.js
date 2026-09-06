import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getEkartToken() {
  const authUrl = `https://app.elite.ekartlogistics.in/integrations/v2/auth/token/${process.env.EKART_CLIENT_ID}`; // Verify this URL in your docs
  const res = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.EKART_USERNAME,
      password: process.env.EKART_PASSWORD,
    }),
  });
  const data = await res.json();
  console.log("Ekart Token Response:", data);
  return data.access_token;
}
export async function GET(req) {
  try {
    const token = await getEkartToken();
    const trackingNumber = 'MYSC1315291066';
    const authUrl = `https://app.elite.ekartlogistics.in/api/v1/track/${trackingNumber}`; // Verify this URL in your docs
  const res = await fetch(authUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
     },
    
  }); 
  const data = await res.json();
  console.log("Ekart Token Response:", data);
  return NextResponse.json({ success: true, data });
  }catch (error) {
    console.error("Error in create-shipment route:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}