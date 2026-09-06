"use server";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand,DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Initialize S3 API Compatibility Client configuration for Cloudflare R2
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL, // e.g., https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function deleteImage(imageUrl) {
  try {
        

    if (!imageUrl) {
      return NextResponse.json({ success: false, message: "Missing required parameter: imageUrl." }, { status: 400 });
    }

    // 1. Extract the R2 storage partition key path string out of the full public domain URL string
    // Example: "https://pub-domain.r2.dev/category/17198305-file.png" -> "category/17198305-file.png"
    const publicDomain = process.env.R2_PUBLIC_DOMAIN; 
    const r2Key = imageUrl.replace(`${publicDomain}/`, "");

    if (!r2Key || r2Key === imageUrl) {
      return NextResponse.json({ success: false, message: "Invalid URL string sequence or mismatched domain origin." }, { status: 400 });
    }

    // 2. Build and dispatch the cryptographic purge command directly to the R2 storage node
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Key,
    });

    const response = await r2.send(command);
    console.log(`Successfully deleted object from R2: ${response}`);

    return NextResponse.json({ 
      success: true, 
      message: "Asset path reference successfully purged from Cloudflare R2 partition clusters." 
    });

  } catch (error) {
    console.error("R2 Object Eviction Pipeline Failure:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal runtime failure during R2 binary eviction commands." 
    }, { status: 500 });
  }
}

export async function deleteCategory(category) {
  try {
    const categoryId = category?.id;
    if (!categoryId) return { success: false, message: "Invalid category id." };

    const supabase = await createClient();
    if(category.image_url) {
        console.log("Attempting to delete associated category image:", category.image_url);
    const ImageResult = await deleteImage(category.image_url);
    console.log("Image deletion result:", ImageResult.json());
    if (!ImageResult.success) {
      return { success: false, message: "Failed to delete associated category image." };
    }
}

    // Check for existing products referencing this category
    const { count, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId);

    if (countError) throw countError;

    if (count && count > 0) {
      return { success: false, message: `Cannot delete category: ${count} product(s) are assigned to this category.` };
    }

    // Safe to delete
    const { error: delError } = await supabase.from("categories").delete().eq("id", categoryId);
    if (delError) throw delError;

    // Bust Next.js edge layouts caching structures
    revalidatePath("/dashboard/categories");

    return { success: true, message: "Category removed successfully." };
  } catch (err) {
    console.error("Category deletion failure:", err);
    return { success: false, message: err.message || "Failed to delete category." };
  }
}

export async function createNewCategory(categoryName, categorySlug,uploadedImageUrl) {
  try {
    if (!categoryName || categoryName.trim() === "") {
      return { success: false, message: "Category name descriptor cannot be blank." };
    }

    const supabase = await createClient();

    // Insertion execution mapping query payload
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: categoryName.trim(),
        slug: categorySlug.trim(),
        image_url: uploadedImageUrl
      })
      .select()
      .single();

    if (error) {
      // Catch native PostgreSQL unique violation code constraints
      if (error.code === "23505") {
        return { success: false, message: "A category tier with this name identity already exists." };
      }
      throw error;
    }

    // Bust Next.js edge layouts caching structures 
    revalidatePath("/dashboard/categories");

    return { success: true, message: "Category tier generated successfully.", data };
  } catch (err) {
    console.error("Category insertion exception tracing loop:", err);
    return { success: false, message: err.message || "Failed to process database mutation blocks." };
  }
}