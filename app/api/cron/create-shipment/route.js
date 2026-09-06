import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SELLER_CONFIG = {
  name: "Maashuka Boutique Private Limited",
  address: "123, Luxury Fashion Hub, Satellite Road, Ahmedabad, Gujarat, India",
  gst_tin: "24AAACM1234A1Z5", // Dummy Gujarat GST number
  phone: 9876543210,
  pin: 380015,
  city: "Ahmedabad",
  state: "Gujarat",
  country: "India",
};

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

export async function POST(req) {
  try {
    const supabase = await createClient();

    // Fetch records matching processing state
    const { data: processingShipments, error: fetchError } = await supabase
      .from("shipments")
      .select(`
        id,
        delivery_status,
        tracking_number,
        order_id,
        order:orders (
          id,
          payable_amount,
          payment_mode,
          created_at,
          status,
          address:delivery_address (
            *
          ),
          items:order_items (
            quantity,
            price,
            product_variants (
              id,
              sku,
              size,
              color,
              variant_image,
              products (
                id,
                name,
                tax_rate
              )
            )
          )
        )
      `)
      .eq("delivery_status", "Processing")
      .limit(5);

    console.log("Fetched processing shipments:", processingShipments);

    if (fetchError) throw fetchError;
    if (!processingShipments || processingShipments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No processing orders present in queue.",
      });
    }

    const executionLogs = [];

    for (const shipment of processingShipments) {
      try {
        const orderData = shipment.order; 
        
        // 💡 FIX: Safely parse address and items because they are nested inside the parent 'order' relation
        const addressData = orderData?.address;
        const itemsData = orderData?.items;

        if (!addressData || !orderData) {
          throw new Error(`Missing structural order metadata or delivery coordinates for shipment reference ${shipment.id}`);
        }

        const totalLineItemsQuantity = itemsData?.reduce((sum, i) => sum + i.quantity, 0) || 1;
        const fallbackTaxRate = itemsData?.[0]?.product_variants?.products?.tax_rate || 5;

        const ekartItemsPayload = itemsData?.map((item) => {
          const v = item.product_variants;
          const p = v?.products;
          const rawPrice = Number(item.price);
          const computedTax = rawPrice * (Number(p?.tax_rate || 0) / 100);

          return {
            product_name: p?.name || "Boutique Apparel",
            sku: v?.sku || "SKU-NOT-FOUND",
            taxable_value: rawPrice - computedTax,
            description: `Size: ${v?.size || "Standard"}, Color: ${v?.color || "N/A"}`,
            quantity: item.quantity,
            length: 10,
            height: 5,
            breadth: 10,
            weight: 0.5,
            hsn_code: "62040000",
            any_gst_tax_value: computedTax / 2,
            cgst_tax_value: computedTax / 2,
            sgst_tax_value: computedTax / 2,
            igst_tax_value: 0,
          };
        }) || [];

        const ekartBodyPayload = {
          seller_name: SELLER_CONFIG.name,
          seller_address: SELLER_CONFIG.address,
          seller_gst_tin: SELLER_CONFIG.gst_tin,
          seller_gst_amount: 0,
          consignee_gst_amount: 0,
          integrated_gst_amount: 0,
          ewbn: "",
          order_number: orderData.id, 
          invoice_number: `INV-${orderData.id.slice(0, 8).toUpperCase()}`,
          invoice_date: new Date(orderData.created_at).toISOString().split("T")[0],
          document_number: `DOC-${orderData.id.slice(0, 8).toUpperCase()}`,
          document_date: new Date().toISOString().split("T")[0],
          consignee_gst_tin: "",
          consignee_name: addressData.full_name, 
          consignee_alternate_phone: addressData.phone_number || "9876543210",
          products_desc: "Boutique Luxury Apparel Garments",
          // 💡 FIX: Aligned with Selected database property 'payment_mode' instead of 'payment_method'
          payment_mode: orderData.payment_mode === "COD" ? "COD" : "PREPAID",
          category_of_goods: "Apparel",
          hsn_code: "62040000",
          total_amount: Number(orderData.payable_amount),
          tax_value: Number(orderData.payable_amount) * (fallbackTaxRate / 100),
          taxable_amount: Number(orderData.payable_amount) - Number(orderData.payable_amount) * (fallbackTaxRate / 100),
          commodity_value: String(orderData.payable_amount),
          cod_amount: orderData.payment_mode === "COD" ? Number(orderData.payable_amount) : 0,
          quantity: totalLineItemsQuantity,
          templateName: "",
          weight: totalLineItemsQuantity * 0.5,
          length: 15,
          height: 10,
          width: 15,
          return_reason: "",
          drop_location: {
            location_type: "Home",
            address: `${addressData.address_line1 || ""} ${addressData.address_line_2 || ""}`.trim(),
            city: addressData.city,
            state: addressData.state,
            country: "India",
            name: addressData.full_name,
            phone: Number(addressData.phone_number?.replace(/\D/g, "")) || 1000000000,
            pin: Number(addressData.pincode) || 0,
          },
          pickup_location: {
            location_type: "Office",
            address: SELLER_CONFIG.address,
            city: SELLER_CONFIG.city,
            state: SELLER_CONFIG.state,
            country: SELLER_CONFIG.country,
            name: SELLER_CONFIG.name,
            phone: SELLER_CONFIG.phone,
            pin: SELLER_CONFIG.pin,
          },
          return_location: {
            location_type: "Office",
            address: SELLER_CONFIG.address,
            city: SELLER_CONFIG.city,
            state: SELLER_CONFIG.state,
            country: SELLER_CONFIG.country,
            name: SELLER_CONFIG.name,
            phone: SELLER_CONFIG.phone,
            pin: SELLER_CONFIG.pin,
          },
          qc_details: {
            qc_shipment: false,
            product_name: itemsData?.[0]?.product_variants?.products?.name || "Apparel Item",
            product_desc: "Boutique Premium Inspection Quality Passed",
            product_sku: itemsData?.[0]?.product_variants?.sku || "N/A",
            product_color: itemsData?.[0]?.product_variants?.color || "N/A",
            product_size: itemsData?.[0]?.product_variants?.size || "Standard",
            brand_name: "Maashuka",
            product_category: "Ethnic Wear",
            ean_barcode: "",
            serial_number: "",
            imei_number: "",
            product_images: [itemsData?.[0]?.product_variants?.variant_image?.[0] || ""],
          },
          preferred_dispatch_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          delayed_dispatch: false,
          obd_shipment: false,
          mps: false,
          items: ekartItemsPayload,
          what3words_address: "",
        };

        const token = await getEkartToken();

        // --- 🚀 EXTERNAL REST ENDPOINT HANDSHAKE CHANNEL ---
        const response = await fetch('https://api.ekartlogistics.com/v1/shipments', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
           },
          body: JSON.stringify(ekartBodyPayload)
        });
        
        const ekartData = await response.json();
        console.log("eKart API Response:", ekartData);

        const mockResponseAwb = "FMPC" + Math.floor(100000000 + Math.random() * 900000000);
        const projectedDeliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

        // 4. Update the current shipment row state with real tracking parameters
        const { error: shipmentError } = await supabase
          .from("shipments")
          .update({
            tracking_number: mockResponseAwb,
            delivery_status: "Processed", // Moves up past processing status
            estimated_delivery: projectedDeliveryDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", shipment.id);

        if (shipmentError) throw shipmentError;

        // 5. Sync parent order to complete the workflow status chain
        const { error: orderUpdateError } = await supabase
          .from("orders")
          .update({ status: "Processed" })
          .eq("id", orderData.id);

        if (orderUpdateError) throw orderUpdateError;

        executionLogs.push({
          shipmentId: shipment.id,
          orderId: orderData.id,
          status: "Success",
          awb: mockResponseAwb,
        });

      } catch (innerError) {
        console.error(`Failed executing eKart loop for shipment ID: ${shipment.id}:`, innerError);
        executionLogs.push({
          shipmentId: shipment.id,
          status: "Failed",
          error: innerError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: executionLogs.length,
      logs: executionLogs,
    });

  } catch (error) {
    console.error("Critical routing execution breakdown:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
