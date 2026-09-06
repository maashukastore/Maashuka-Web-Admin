import imageCompression from "browser-image-compression";

export const compressAndUploadToR2 = async (file) => {
  try {
    // 1. Compress Image to WebP (Saves space/bandwidth)
    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp",
    };
    const compressedFile = await imageCompression(file, options);

    // 2. Get a Presigned URL from your own API route
    // This keeps your R2 Credentials secret
    const fileName = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}.webp`;
    
    const res = await fetch("/api/upload/presigned", {
      method: "POST",
      body: JSON.stringify({ fileName, contentType: "image/webp" }),
    });
    
    const { url, publicUrl } = await res.json();

    // 3. Upload directly to Cloudflare R2 using the Presigned URL
    const uploadRes = await fetch(url, {
      method: "PUT",
      body: compressedFile,
      headers: { "Content-Type": "image/webp" },
    });

    if (!uploadRes.ok) throw new Error("R2 Upload Failed");

    // Return the public URL to save in your Supabase Database
    return publicUrl;
    
  } catch (error) {
    console.error("R2 Upload Error:", error);
    return null;
  }
};