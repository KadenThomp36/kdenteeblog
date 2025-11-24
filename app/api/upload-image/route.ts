import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToMinio } from "@/lib/minio";

export async function POST(req: Request) {
  try {
    console.log("[Upload] Starting upload request");
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Upload] Parsing form data");
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    console.log(`[Upload] Uploading ${files.length} file(s)`);
    files.forEach((file, i) => {
      console.log(`[Upload] File ${i}: ${file.name}, size: ${file.size} bytes`);
    });

    const uploadPromises = files.map((file) => uploadToMinio(file));
    const uploadedFiles = await Promise.all(uploadPromises);

    const urls = uploadedFiles.map((file) => file.url);

    console.log("[Upload] Upload successful");
    return NextResponse.json({ urls });
  } catch (error: any) {
    console.error("Upload error:", error);
    console.error("Error code:", error.code);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 },
    );
  }
}
