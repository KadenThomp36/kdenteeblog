"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";

interface UploadButtonProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  className?: string;
}

export function UploadButton({
  onUploadComplete,
  onUploadError,
  accept = "image/*",
  className,
}: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Compress image before uploading
      const options = {
        maxSizeMB: 4, // Max file size in MB (under Vercel's 4.5MB limit)
        maxWidthOrHeight: 2048, // Max dimension
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append("files", compressedFile);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      if (data.urls && data.urls[0]) {
        onUploadComplete(data.urls[0]);
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={isUploading}
        className={className}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </>
        )}
      </Button>
    </>
  );
}
