"use client";

import type { ReceiptUploadResponse } from "@/types/receipt";
import { getCurrentUserIdToken } from "@/lib/firebase/auth";
import { compressImageForUpload } from "@/lib/utils/compress-image";

export async function uploadReceipt(
  file: File,
  onProgress?: (step: "compressing" | "uploading" | "scanning") => void,
): Promise<ReceiptUploadResponse> {
  // Step 1 — compress on device before sending
  onProgress?.("compressing");
  const compressed = await compressImageForUpload(file);

  // Step 2 — get auth token + upload
  onProgress?.("uploading");
  const token = await getCurrentUserIdToken();
  const formData = new FormData();
  formData.append("file", compressed);
  // Pass original filename so the server can store it correctly
  formData.append("originalName", file.name);

  const response = await fetch("/api/receipts/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Receipt upload failed.");
  }

  // Step 3 — server is now running OCR (we're waiting on the response)
  onProgress?.("scanning");

  return (await response.json()) as ReceiptUploadResponse;
}
