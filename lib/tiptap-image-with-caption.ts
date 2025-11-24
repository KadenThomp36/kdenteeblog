import { Node, mergeAttributes } from "@tiptap/core";

export interface ImageWithCaptionOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageWithCaption: {
      setImageWithCaption: (options: {
        src: string;
        alt?: string;
        caption?: string;
        exif?: string;
      }) => ReturnType;
    };
  }
}

export const ImageWithCaption = Node.create<ImageWithCaptionOptions>({
  name: "imageWithCaption",

  addOptions() {
    return {
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
    };
  },

  inline: false,
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      caption: {
        default: null,
      },
      exif: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-type='image-with-caption']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      {
        "data-type": "image-with-caption",
        class: "image-with-caption",
      },
      [
        "img",
        mergeAttributes(this.options.HTMLAttributes, {
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt,
        }),
      ],
      HTMLAttributes.exif
        ? [
            "div",
            { class: "image-exif", "data-exif": HTMLAttributes.exif },
            HTMLAttributes.exif,
          ]
        : "",
      HTMLAttributes.caption
        ? ["figcaption", { class: "image-caption" }, HTMLAttributes.caption]
        : "",
    ];
  },

  addCommands() {
    return {
      setImageWithCaption:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const container = document.createElement("figure");
      container.setAttribute("data-type", "image-with-caption");
      container.className = "image-with-caption";
      container.style.cssText =
        "margin: 2rem auto; max-width: 60%; text-align: center;";

      // Image element
      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || "";
      img.style.cssText =
        "border-radius: 0.75rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); width: 100%; height: auto;";
      container.appendChild(img);

      // EXIF metadata
      if (node.attrs.exif) {
        const exifDiv = document.createElement("div");
        exifDiv.className = "image-exif";
        exifDiv.style.cssText =
          "font-size: 0.75rem; color: #6b7280; margin-top: 0.75rem; margin-bottom: 0.5rem; font-family: ui-monospace, monospace;";
        exifDiv.textContent = node.attrs.exif;
        container.appendChild(exifDiv);
      }

      let captionInput: HTMLInputElement | null = null;

      // Caption element (editable in editor mode)
      if (editor.isEditable) {
        captionInput = document.createElement("input");
        captionInput.type = "text";
        captionInput.placeholder = "Add a caption...";
        captionInput.value = node.attrs.caption || "";
        captionInput.className = "image-caption-input";
        captionInput.style.cssText =
          "width: 100%; border: 1px solid #e5e7eb; border-radius: 0.25rem; padding: 0.5rem; margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280; font-style: italic; text-align: center; background: transparent;";

        let isUpdating = false;

        captionInput.addEventListener("blur", (e) => {
          if (isUpdating) return;
          isUpdating = true;

          const pos = getPos();
          if (typeof pos === "number") {
            const target = e.target as HTMLInputElement;
            editor.commands.updateAttributes("imageWithCaption", {
              caption: target.value || null,
            });
          }

          setTimeout(() => {
            isUpdating = false;
          }, 100);
        });

        container.appendChild(captionInput);

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑️ Delete";
        deleteBtn.type = "button";
        deleteBtn.style.cssText =
          "margin-top: 0.5rem; padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.25rem; background: white; cursor: pointer;";
        deleteBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const pos = getPos();
          if (typeof pos === "number") {
            editor.commands.deleteRange({
              from: pos,
              to: pos + node.nodeSize,
            });
          }
        });
        container.appendChild(deleteBtn);
      } else if (node.attrs.caption) {
        // Display caption in read-only mode
        const caption = document.createElement("figcaption");
        caption.className = "image-caption";
        caption.style.cssText =
          "font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem; font-style: italic;";
        caption.textContent = node.attrs.caption;
        container.appendChild(caption);
      }

      return {
        dom: container,
        contentDOM: null,
        ignoreMutation: (mutation) => {
          // Ignore mutations inside the caption input to prevent updates while typing
          if (captionInput && captionInput.contains(mutation.target)) {
            return true;
          }
          return false;
        },
        update: (updatedNode) => {
          if (updatedNode.type.name !== "imageWithCaption") {
            return false;
          }

          // Update caption input value if it changed externally
          if (captionInput && captionInput !== document.activeElement) {
            captionInput.value = updatedNode.attrs.caption || "";
          }

          return true;
        },
      };
    };
  },
});
