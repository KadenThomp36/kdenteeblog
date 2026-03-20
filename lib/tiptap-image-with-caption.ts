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
        getAttrs: (element) => {
          const img = element.querySelector("img");
          const exifDiv = element.querySelector(".image-exif");
          const caption = element.querySelector("figcaption");

          return {
            src: img?.getAttribute("src") || null,
            alt: img?.getAttribute("alt") || null,
            exif: exifDiv?.textContent || null,
            caption: caption?.textContent || null,
          };
        },
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
      container.className = "image-with-caption editor-image-figure";

      // Image element
      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || "";
      img.className = "editor-image";
      container.appendChild(img);

      // EXIF metadata
      if (node.attrs.exif) {
        const exifDiv = document.createElement("div");
        exifDiv.className = "image-exif";
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
        captionInput.setAttribute("aria-label", "Image caption");

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
        deleteBtn.textContent = "Delete image";
        deleteBtn.type = "button";
        deleteBtn.className = "editor-image-delete-btn";
        deleteBtn.setAttribute("aria-label", "Delete image");
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
        caption.textContent = node.attrs.caption;
        container.appendChild(caption);
      }

      return {
        dom: container,
        contentDOM: null,
        stopEvent: (event) => {
          // Stop all events from the caption input from bubbling to the editor
          const target = event.target as HTMLElement;
          if (
            captionInput &&
            (target === captionInput || captionInput.contains(target))
          ) {
            return true;
          }
          return false;
        },
        ignoreMutation: () => {
          // Ignore all mutations inside this node - we handle state manually
          return true;
        },
        update: (updatedNode) => {
          if (updatedNode.type.name !== "imageWithCaption") {
            return false;
          }

          // Only update the input if it's not currently focused
          if (captionInput && document.activeElement !== captionInput) {
            captionInput.value = updatedNode.attrs.caption || "";
          }

          return true;
        },
        destroy: () => {
          // Clean up
          if (captionInput) {
            captionInput.remove();
          }
        },
      };
    };
  },
});
