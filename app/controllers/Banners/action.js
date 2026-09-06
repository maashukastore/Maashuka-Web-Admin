"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Fetches all historical hero templates registered in the system
 */
export async function getHeroTemplates() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hero_sections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Injects a freshly verified hero component layout map node into Supabase
 */
export async function createHeroSection(formState) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("hero_sections")
      .insert([formState])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/");
    return { success: true, message: "Hero collection state deployed successfully.", data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Atomically updates which template maps globally onto the main storefront hero canvas layout
 */
export async function activateHeroSection(id) {
  try {
    const supabase = await createClient();

    // 1. Reset all alternate hero layouts to inactive
    await supabase.from("hero_sections").update({ is_active: false }).neq("id", id);

    // 2. Commit true flag parameters on the target structural matrix ID
    const { error } = await supabase.from("hero_sections").update({ is_active: true }).eq("id", id);

    if (error) throw error;

    revalidatePath("/");
    return { success: true, message: "Storefront visual landscape updated instantly." };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Purges a localized hero layout parameter context record completely
 */
export async function deleteHeroSection(id) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("hero_sections").delete().eq("id", id);

    if (error) throw error;
    return { success: true, message: "Hero manifest element removed safely." };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Updates an existing hero section's configuration values
 */
export async function updateHeroSection(id, formState) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("hero_sections")
      .update(formState)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/");
    return { success: true, message: "Hero banner entry updated successfully.", data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}