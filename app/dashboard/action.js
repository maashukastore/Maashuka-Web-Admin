"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPaginatedProducts({ page = 1, pageSize = 10, tab = "all", search = "" }) {
  try {
    const supabase = await createClient();

    // 1. Calculate precise PostgreSQL array offset bounds
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 2. Initialize our core base selection builder query
    let query = supabase
      .from("products")
      .select(`
        id,
        name,
        base_price,
        sale_price,
        on_sale,
        images,
        created_at,
        categories ( name ),
        product_variants ( id, sku, color, size, stock_quantity,variant_image )
      `, { count: "exact" });

    // 3. Conditional Search Evaluation Logic Block
    if (search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    // 4. Operational State Tabs Pre-Filtering Sweeps
    if (tab === "sale") {
      query = query.eq("on_sale", true);
    }

    // Apply primary timeline layout ordering sequence
    query = query.order("created_at", { ascending: false });

    // 5. Apply the precise range slicing window limits
    const { data, count, error } = await query.range(from, to);
   
    if (error) throw error;

    // 6. Post-Fetch Filtering for Stock Specific Complex Statuses
    let processedData = data || [];
    
    if (tab === "out") {
      // If filtering out-of-stock items, scan child arrays for completely depleted levels
      processedData = processedData.filter(product => {
        const stockSum = product.product_variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0;
        return stockSum === 0;
      });
    } else if (tab === "live") {
      // Standard active catalog items: has physical available balances and not active on a promo flash run
      processedData = processedData.filter(product => {
        const stockSum = product.product_variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0;
        return stockSum > 0 && !product.on_sale;
      });
    }

    return {
      success: true,
      products: processedData,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    };

  } catch (error) {
    console.error("Server-side pagination compiler failure:", error);
    return { success: false, products: [], totalCount: 0, totalPages: 1 };
  }
}

export async function createCompleteProduct(productPayload) {
  try {
    const supabase = await createClient();

    // 1. Check if the administrator is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: "Session expired. Please re-authenticate." };
    }

    // 2. Generate a clean URL slug from the title name parameter
    const baseSlug = productPayload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    // 3. Create parent Product record matrix node
    const { data: newProduct, error: productError } = await supabase
      .from("products")
      .insert({
        name: productPayload.name,
        slug: finalSlug,
        category_id: productPayload.category_id,
        description: productPayload.description,
        base_price: Number(productPayload.base_price),
        images: productPayload.globalImages || [], // Master fallbacks imagery strip
        is_active: productPayload.is_active
      })
      .select("id")
      .single();

    if (productError || !newProduct) throw productError;

    // 4. Map variant iterations into database with respective URLs
    const variantsPayload = productPayload.variants.map((v) => ({
      product_id: newProduct.id,
      sku: v.sku.trim().toUpperCase(),
      color: v.color,
      color_hex: v.color_hex,
      size: v.size,
      variant_price: Number(v.variant_price || productPayload.base_price),
      stock_quantity: Number(v.stock_quantity || 0),
      variant_image: v.uploadedUrls || [], // Direct link arrays pointing directly back to R2 URLs
      is_active: v.is_active
    }));

    const { error: variantsError } = await supabase
      .from("product_variants")
      .insert(variantsPayload);

    if (variantsError) {
      // Manual rolling correction fallback clean-up cascade if variants fail initialization
      await supabase.from("products").delete().eq("id", newProduct.id);
      throw variantsError;
    }

    return { success: true, message: "Catalog entry created successfully!", productId: newProduct.id };

  } catch (error) {
    console.error("Database Transaction Failure Core Rollback execution:", error);
    return { success: false, message: error.message || "Failed to update catalog schema rows." };
  }
}

export async function updateCatalogRecord( productId, updatedPayload ) {
  try {
    const supabase = await createClient();
    //  console.log("Received Update Payload:", { productId, updatedPayload });
    // 1. Update Core Parent Document properties
    const { error: productError } = await supabase
      .from("products")
      .update({
        name: updatedPayload.name,
        category_id: updatedPayload.category_id,
        description: updatedPayload.description,
        base_price: Number(updatedPayload.base_price),
        images: updatedPayload.globalImages || [], // Master fallbacks imagery strip
        is_active: updatedPayload.is_active
      })
      .eq("id", productId);

    if (productError) throw productError;

    // Server-side validation/coercion:
    // If the parent product is being set to inactive, ensure no child variants remain active.
    const parentIsActive = Boolean(updatedPayload.is_active);
    let variantsForcedInactive = false;
    if (!parentIsActive) {
      const { error: deactivateErr } = await supabase
        .from("product_variants")
        .update({ is_active: false })
        .eq("product_id", productId);
      if (deactivateErr) throw deactivateErr;
      variantsForcedInactive = true;
    }

    // 2. Map mutations across child variants arrays loops
    // Ensure incoming payload does not attempt to activate variants when product is inactive
    const sanitizedVariants = (updatedPayload.variants || []).map(v => ({ ...v, is_active: parentIsActive ? v.is_active : false }));
    for (const variant of sanitizedVariants) {
      if (variant.isNew) {
        // Handle insertion sequences if a manager appends a new variant row mid-edit
        const { error: insertErr } = await supabase.from("product_variants").insert({
          product_id: productId,
          sku: variant.sku.trim().toUpperCase(),
          color: variant.color,
          color_hex: variant.color_hex,
          size: variant.size,
          variant_price: Number(variant.variant_price || updatedPayload.base_price),
          stock_quantity: Number(variant.stock_quantity || 0),
          variant_image: variant.variant_image || [],
          is_active: variant.is_active
        });
        if (insertErr) throw insertErr;
      } else {
        // Standard structural property update matching existing rows
        const { error: variantError } = await supabase
          .from("product_variants")
          .update({
            sku: variant.sku.trim().toUpperCase(),
            color: variant.color,
            color_hex: variant.color_hex,
            size: variant.size,
            variant_price: Number(variant.variant_price || updatedPayload.base_price),
            stock_quantity: Number(variant.stock_quantity || 0),
            variant_image: variant.variant_image || [],
            is_active: variant.is_active
          })
          .eq("id", variant.id);

        if (variantError) throw variantError;
      }
    }

    return { success: true, message: `Catalog records synchronized successfully.${variantsForcedInactive ? " Note: variants were deactivated because the parent product is inactive." : ""}` };
  } catch (error) {
    console.error("Catalog modifier loop failure:", error);
    return { success: false, message: error.message || "Failed to process database mutation blocks." };
  }
}

export async function getPaginatedOrders({ page = 1, pageSize = 10, status = "all", search = "" }) {
  try {
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build base query selecting transactional data alongside nested customer references
    let query = supabase
      .from("orders")
      .select(`
        id,
        payable_amount,
        status,
        created_at,
        user_id,
        order_id,
        profiles ( first_name, email, phone )
      `, { count: "exact" });

    // Filter rules matching search inputs against specific customer properties or Order IDs
    const trimmedSearch = String(search || "").trim();
    if (trimmedSearch) {
      // Use ilike for textual fields. If the search is a pure integer, include an exact id match.
      // Supabase will error or produce no results if you use ilike on an integer column, so avoid that.
      if (/^\d+$/.test(trimmedSearch)) {
        query = query.or(`order_id.ilike.%${trimmedSearch}%,status.ilike.%${trimmedSearch}%,id.eq.${trimmedSearch}`);
      } else {
        query = query.or(`order_id.ilike.%${trimmedSearch}%,status.ilike.%${trimmedSearch}%`);
      }
    }

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      success: true,
      orders: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error("Server-side order pagination loop failed:", error);
    return { success: false, orders: [], totalCount: 0, totalPages: 1 };
  }
}

export async function updateOrderStatus(orderId, nextStatus) {
  try {
    const supabase = await createClient();
    console.log(`Attempting to update Order ID ${orderId} to status: ${nextStatus}`);
    const idMatcher = /^\d+$/.test(String(orderId)) ? Number(orderId) : orderId;
    console.log("Parsed Order ID for matching:", idMatcher);
    const { data, error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", idMatcher)
      .select();

    if (error) throw error;

    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn(`No rows updated for Order ID ${orderId}. Response:`, data);
      return { success: false, message: `No order found with id ${orderId}.` };
    }



    console.log(`Order ID ${orderId} successfully updated to status: ${nextStatus}`);
    console.log("Database response:", data);
    return { success: true, message: `Order marked as ${nextStatus}.`, updated: data };
  } catch (error) {
    console.error("Fulfillment engine transition error:", error);
    return { success: false, message: error.message || "Failed to update state." };
  }
}



export async function toggleCouponStatus(couponId, targetActiveState) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("coupons")
      .update({ is_active: targetActiveState })
      .eq("id", couponId);

    if (error) throw error;
    
    revalidatePath("/dashboard/coupons");
    return { success: true, message: "Promotional tracking channel updated successfully." };
  } catch (err) {
    console.error("Coupon status toggle malfunction:", err);
    return { success: false, message: err.message || "Failed to update target status parameters." };
  }
}

// B. Publish a brand new promotional voucher token record node
export async function createNewCoupon(payload) {
  try {
    if (!payload.code || payload.code.trim() === "") {
      return { success: false, message: "Promotional index code target cannot be blank." };
    }

    const supabase = await createClient();

    // 💡 CALCULATION GAUNTLET: Formulate mandatory end_date if missing (e.g., default 30 days out)
    const normalizedEndDate = payload.end_date 
      ? new Date(payload.end_date).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("coupons")
      .insert({
        code: payload.code.trim().toUpperCase(),
        discount_type: payload.discount_type, // Maps exactly to 'percentage' or 'fixed_amount'
        discount_value: Number(payload.discount_value || 0),
        min_order_amount: Number(payload.min_order_amount || 0),
        usage_limit: payload.usage_limit ? Number(payload.usage_limit) : null,
        end_date: normalizedEndDate, // Satisfies NOT NULL schema constraint
        is_active: true,
        max_discount_amount: payload.max_discount_amount ? Number(payload.max_discount_amount) : null
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "This coupon code string is already registered on the matrix." };
      }
      throw error;
    }

    revalidatePath("/dashboard/coupons");
    return { success: true, message: "Promotional coupon active code deployed successfully.", data };
  } catch (err) {
    console.error("Coupon insertion block failure:", err);
    return { success: false, message: err.message || "Failed to finalize database injection sequence." };
  }
}