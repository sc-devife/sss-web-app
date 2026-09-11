"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatIndentIncrease,
  MdFormatIndentDecrease,
} from "react-icons/md";
import { cn } from "@/lib/cn";

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30",
        active && "bg-primary/15 text-primary",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1">
      <ToolbarButton
        label="Heading"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span className="text-sm font-bold leading-none">H</span>
      </ToolbarButton>
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <MdFormatBold size={18} />
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <MdFormatItalic size={18} />
      </ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <MdFormatUnderlined size={18} />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <MdFormatListBulleted size={18} />
      </ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <MdFormatListNumbered size={18} />
      </ToolbarButton>
      <ToolbarButton
        label="Indent (sub-bullet)"
        disabled={!editor.can().sinkListItem("listItem")}
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
      >
        <MdFormatIndentIncrease size={18} />
      </ToolbarButton>
      <ToolbarButton
        label="Outdent"
        disabled={!editor.can().liftListItem("listItem")}
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}
      >
        <MdFormatIndentDecrease size={18} />
      </ToolbarButton>
    </div>
  );
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// A small Word-like rich text editor: heading/bold/italic/underline plus
// nested bullet/numbered lists (indent = sub-bullet). Stores/emits plain
// HTML. "Write"/"Preview" tabs (mirrors GitHub's markdown editor) let the
// author check how the formatted content will actually look — headings/
// bold/lists read very differently rendered than they do inline in the
// editing surface.
export function RichTextEditor({ label, value, onChange, placeholder, className, error }: RichTextEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Underline],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose-editor min-h-[10rem] max-w-none px-3 py-2 text-sm text-foreground focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keeps the editor in sync if `value` changes from outside (e.g. switching
  // which record is being edited without remounting this component) without
  // clobbering the caret while the user is actively typing.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
      <div
        className={cn(
          "rounded border border-border bg-background focus-within:outline focus-within:outline-2 focus-within:outline-primary",
          error && "border-danger",
        )}
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-1 pt-1">
          <div>
            <ModeTab active={mode === "write"} onClick={() => setMode("write")}>
              Write
            </ModeTab>
            <ModeTab active={mode === "preview"} onClick={() => setMode("preview")}>
              Preview
            </ModeTab>
          </div>
          {mode === "write" && editor && <Toolbar editor={editor} />}
        </div>
        {mode === "write" ? (
          <>
            {editor && !value && (
              <div className="pointer-events-none absolute px-3 py-2 text-sm text-muted-foreground">{placeholder}</div>
            )}
            <EditorContent editor={editor} />
          </>
        ) : value ? (
          <div className="prose-editor min-h-[10rem] max-w-none px-3 py-2 text-sm text-foreground" dangerouslySetInnerHTML={{ __html: value }} />
        ) : (
          <div className="flex min-h-[10rem] items-center px-3 py-2 text-sm text-muted-foreground">Nothing to preview yet.</div>
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
