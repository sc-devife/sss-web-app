"use client";

import { useRef, useState } from "react";
import { IoCloudUploadOutline, IoClose } from "react-icons/io5";
import { cn } from "@/lib/cn";
import { resolveFileUrl } from "@/lib/files";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";

interface FileUploadProps {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  error?: string;
  className?: string;
}

// Uploads immediately on selection (via /api/files/upload) and stores the
// returned relative URL — forms just carry string[] like any other field,
// no separate "pending upload" step to wire into submit handlers.
export function FileUpload({ label, value, onChange, multiple = true, error, className }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(undefined);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await clientApi.postForm<{ url: string }>("/files/upload", formData);
          uploaded.push(res.data.url);
        } catch (err) {
          throw new Error(extractErrorMessage(err, `Failed to upload ${file.name}`));
        }
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded);
    } catch (err) {
      setUploadError(extractErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(url: string) {
    onChange(value.filter((v) => v !== url));
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url) => (
            <div key={url} className="group relative h-16 w-16 overflow-hidden rounded border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveFileUrl(url)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label="Remove image"
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <IoClose size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "flex h-20 w-full items-center justify-center gap-2 rounded border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          (error || uploadError) && "border-danger",
        )}
      >
        <IoCloudUploadOutline size={18} />
        {uploading ? "Uploading…" : "Click to upload image"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {(error || uploadError) && <span className="text-xs text-danger">{error ?? uploadError}</span>}
    </div>
  );
}
