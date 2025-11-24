import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToMinio } from "@/lib/minio";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadPromises = files.map((file) => uploadToMinio(file));
    const uploadedFiles = await Promise.all(uploadPromises);

    const urls = uploadedFiles.map((file) => file.url);

    return NextResponse.json({ urls });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 },
    );
  }
}
