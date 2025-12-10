"use client";

import {
  useEditor,
  EditorContent,
  Editor as TiptapEditor,
} from "@tiptap/react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Type,
  MoreHorizontal,
  Pilcrow,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import imageCompression from "browser-image-compression";

const lowlight = createLowlight(common);

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

// Toolbar button component with proper touch targets and accessibility
interface ToolbarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  title: string;
  ariaLabel: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  disabled,
  isActive,
  title,
  ariaLabel,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`h-9 w-9 p-0 sm:h-8 sm:w-8 touch-manipulation ${isActive ? "bg-muted" : ""}`}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={isActive}
    >
      {children}
    </Button>
  );
}

// Mobile-friendly toolbar group that collapses into a popover
interface ToolbarGroupProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function MobileToolbarGroup({
  label,
  icon,
  children,
  className,
}: ToolbarGroupProps) {
  return (
    <>
      {/* Desktop: show all buttons */}
      <div className={`hidden sm:flex gap-0.5 ${className || ""}`}>
        {children}
      </div>
      {/* Mobile: collapse into popover */}
      <div className="sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 touch-manipulation"
              aria-label={label}
            >
              {icon}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-wrap gap-1">{children}</div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

export function Editor({ content, onChange }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const editorRef = useRef<TiptapEditor | null>(null);

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
          "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[300px] sm:min-h-[500px] p-4 sm:p-6",
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
        const currentEditor = editorRef.current;
        data.urls.forEach((url: string) => {
          currentEditor
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
      {/* Toolbar - sticky below header, responsive layout */}
      <div
        className="sticky top-16 z-10 border-b bg-background/95 p-1.5 sm:p-2 backdrop-blur-sm rounded-t-lg supports-[backdrop-filter]:bg-background/60"
        role="toolbar"
        aria-label="Editor formatting toolbar"
      >
        <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
          {/* Text formatting - always visible on mobile (most used) */}
          <div className="flex gap-0.5">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold (Ctrl+B)"
              ariaLabel="Bold"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic (Ctrl+I)"
              ariaLabel="Italic"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            {/* Show underline on desktop, hide on mobile to save space */}
            <div className="hidden sm:block">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={!editor.can().chain().focus().toggleUnderline().run()}
                isActive={editor.isActive("underline")}
                title="Underline (Ctrl+U)"
                ariaLabel="Underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </ToolbarButton>
            </div>
          </div>

          <Separator
            orientation="vertical"
            className="h-6 sm:h-8 hidden sm:block"
          />

          {/* Headings - collapse on mobile */}
          <MobileToolbarGroup
            label="Headings"
            icon={<Type className="h-4 w-4" />}
          >
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
              ariaLabel="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
              ariaLabel="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
              ariaLabel="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
          </MobileToolbarGroup>

          <Separator
            orientation="vertical"
            className="h-6 sm:h-8 hidden sm:block"
          />

          {/* Lists and blocks - collapse on mobile */}
          <MobileToolbarGroup
            label="Lists and blocks"
            icon={<Pilcrow className="h-4 w-4" />}
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet list"
              ariaLabel="Bullet list"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Numbered list"
              ariaLabel="Numbered list"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="Blockquote"
              ariaLabel="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive("codeBlock")}
              title="Code block"
              ariaLabel="Code block"
            >
              <CodeSquare className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              isActive={editor.isActive("code")}
              title="Inline code"
              ariaLabel="Inline code"
            >
              <Code className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="Strikethrough"
              ariaLabel="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            {/* Underline in mobile menu */}
            <div className="sm:hidden">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={!editor.can().chain().focus().toggleUnderline().run()}
                isActive={editor.isActive("underline")}
                title="Underline (Ctrl+U)"
                ariaLabel="Underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </ToolbarButton>
            </div>
          </MobileToolbarGroup>

          <Separator
            orientation="vertical"
            className="h-6 sm:h-8 hidden sm:block"
          />

          {/* Alignment - collapse on mobile */}
          <MobileToolbarGroup
            label="Text alignment"
            icon={<AlignLeft className="h-4 w-4" />}
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              title="Align left"
              ariaLabel="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              isActive={editor.isActive({ textAlign: "center" })}
              title="Align center"
              ariaLabel="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              title="Align right"
              ariaLabel="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
              isActive={editor.isActive({ textAlign: "justify" })}
              title="Justify"
              ariaLabel="Justify text"
            >
              <AlignJustify className="h-4 w-4" />
            </ToolbarButton>
          </MobileToolbarGroup>

          <Separator
            orientation="vertical"
            className="h-6 sm:h-8 hidden sm:block"
          />

          {/* Media and links - always visible (frequently used) */}
          <div className="flex gap-0.5">
            <ToolbarButton
              onClick={addLink}
              isActive={editor.isActive("link")}
              title="Add link"
              ariaLabel="Add link"
            >
              <Link2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={handleImageClick}
              disabled={isUploading}
              title="Add image (or drag & drop)"
              ariaLabel="Add image"
            >
              <ImageIcon className="h-4 w-4" />
            </ToolbarButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              multiple
              aria-label="Upload image"
            />
            <div className="hidden sm:block">
              <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Horizontal rule"
                ariaLabel="Insert horizontal rule"
              >
                <Minus className="h-4 w-4" />
              </ToolbarButton>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1 min-w-2" />

          {/* Upload indicator */}
          {isUploading && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Uploading...
            </span>
          )}

          {/* History - always visible */}
          <div className="flex gap-0.5">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              title="Undo (Ctrl+Z)"
              ariaLabel="Undo"
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              title="Redo (Ctrl+Shift+Z)"
              ariaLabel="Redo"
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* Editor content area */}
      <div className="bg-background">
        <EditorContent editor={editor} />
      </div>

      {/* Footer tip - hidden on very small screens */}
      <div className="border-t bg-muted/30 p-2 text-xs text-muted-foreground hidden sm:block">
        <span>
          Tip: Drag & drop images or paste them directly into the editor
        </span>
      </div>
    </div>
  );
}
