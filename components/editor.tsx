"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { ImageWithCaption } from "@/lib/tiptap-image-with-caption";
import exifr from "exifr";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Minus,
  CodeSquare,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import imageCompression from "browser-image-compression";

const lowlight = createLowlight(common);

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function Editor({ content, onChange }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const editorRef = useRef<any>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      ImageWithCaption,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Start writing your post...",
      }),
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "rounded-md bg-muted p-4 font-mono text-sm",
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-6",
      },
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer?.files &&
          event.dataTransfer.files[0]
        ) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            handleImageUpload([file]);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
              const file = items[i].getAsFile();
              if (file) {
                event.preventDefault();
                handleImageUpload([file]);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Store editor ref
  if (editor && !editorRef.current) {
    editorRef.current = editor;
  }

  const handleImageUpload = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      // Extract EXIF data from the ORIGINAL file before compression
      let exifString: string | null = null;
      try {
        const exifData = await exifr.parse(files[0]);
        console.log("EXIF data extracted:", exifData);
        if (exifData) {
          const parts: string[] = [];

          // Camera name (Make and Model)
          if (exifData.Make && exifData.Model) {
            // Remove make from model if it's duplicated (e.g., "Canon Canon EOS R5" -> "Canon EOS R5")
            const model = exifData.Model.replace(exifData.Make, "").trim();
            parts.push(`${exifData.Make} ${model}`);
          } else if (exifData.Model) {
            parts.push(exifData.Model);
          }

          // Aperture (f-number)
          if (exifData.FNumber) {
            parts.push(`f/${Math.round(exifData.FNumber * 10) / 10}`);
          }

          // Shutter speed
          if (exifData.ExposureTime) {
            if (exifData.ExposureTime < 1) {
              parts.push(`1/${Math.round(1 / exifData.ExposureTime)}s`);
            } else {
              parts.push(`${Math.round(exifData.ExposureTime * 100) / 100}s`);
            }
          }

          // ISO
          if (exifData.ISO) {
            parts.push(`ISO ${Math.round(exifData.ISO)}`);
          }

          // Focal length
          if (exifData.FocalLength) {
            parts.push(`${Math.round(exifData.FocalLength)}mm`);
          }

          if (parts.length > 0) {
            exifString = parts.join(" • ");
            console.log("EXIF string created:", exifString);
          }
        }
      } catch (exifError) {
        console.log("No EXIF data found:", exifError);
      }

      // Compress images after extracting EXIF
      const options = {
        maxSizeMB: 4,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      };

      const compressedFiles = await Promise.all(
        Array.from(files).map((file) => imageCompression(file, options)),
      );

      const formData = new FormData();
      compressedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      if (data.urls && data.urls.length > 0 && editorRef.current) {
        data.urls.forEach((url: string) => {
          editorRef.current
            .chain()
            .focus()
            .insertContent({
              type: "imageWithCaption",
              attrs: {
                src: url,
                alt: "",
                caption: null,
                exif: exifString,
              },
            })
            .run();
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleImageUpload(Array.from(files));
    }
  };

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg bg-background">
      <div className="sticky top-0 z-10 border-b bg-muted/30 p-2 backdrop-blur-sm rounded-t-lg">
        <div className="flex flex-wrap gap-1">
          {/* Text formatting */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "bg-muted" : ""}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "bg-muted" : ""}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={!editor.can().chain().focus().toggleUnderline().run()}
              className={editor.isActive("underline") ? "bg-muted" : ""}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? "bg-muted" : ""}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              className={editor.isActive("code") ? "bg-muted" : ""}
              title="Inline code"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Headings */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={
                editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""
              }
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={
                editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""
              }
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={
                editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""
              }
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Lists and blocks */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive("bulletList") ? "bg-muted" : ""}
              title="Bullet list"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive("orderedList") ? "bg-muted" : ""}
              title="Numbered list"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive("blockquote") ? "bg-muted" : ""}
              title="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive("codeBlock") ? "bg-muted" : ""}
              title="Code block"
            >
              <CodeSquare className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Alignment */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={
                editor.isActive({ textAlign: "left" }) ? "bg-muted" : ""
              }
              title="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              className={
                editor.isActive({ textAlign: "center" }) ? "bg-muted" : ""
              }
              title="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={
                editor.isActive({ textAlign: "right" }) ? "bg-muted" : ""
              }
              title="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
              className={
                editor.isActive({ textAlign: "justify" }) ? "bg-muted" : ""
              }
              title="Justify"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Media and links */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addLink}
              className={editor.isActive("link") ? "bg-muted" : ""}
              title="Add link"
            >
              <Link2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImageClick}
              disabled={isUploading}
              title="Add image (or drag & drop)"
            >
              <ImageIcon className="h-4 w-4" />
              {isUploading && (
                <span className="ml-1 text-xs">Uploading...</span>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              multiple
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal rule"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1" />

          {/* History */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-background">
        <EditorContent editor={editor} />
      </div>

      <div className="border-t bg-muted/30 p-2 text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span>
            💡 Tip: Drag & drop images or paste them directly into the editor
          </span>
        </div>
      </div>
    </div>
  );
}
