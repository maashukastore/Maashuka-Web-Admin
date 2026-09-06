import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand,DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { deleteImage } from "@/app/controllers/Products/Category/action";

// Initialize S3 API Compatibility Client configuration for Cloudflare R2
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL, // e.g., https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  try {
    const { fileName, fileType,folerName } = await req.json();
    
    // Create a cryptographically distinct key name to prevent overlap overwrites
    const uniqueKey = `${folerName}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: fileType,
    });

    // Signed upload url valid for 5 minutes
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${uniqueKey}`;

    return NextResponse.json({ success: true, signedUrl, publicUrl });
  } catch (error) {
    console.error("R2 Presigned Token Engine Failure:", error);
    return NextResponse.json({ success: false, message: "Could not allocate R2 credentials token nodes." }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, message: "Missing required parameter: imageUrl." }, { status: 400 });
    }

   const result = await deleteImage(imageUrl);

   return result;

  } catch (error) {
    console.error("R2 Object Eviction Pipeline Failure:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal runtime failure during R2 binary eviction commands." 
    }, { status: 500 });
  }
}