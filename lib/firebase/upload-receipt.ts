"use client";

import type { ReceiptUploadResponse } from "@/types/receipt";
import { getCurrentUserIdToken } from "@/lib/firebase/auth";

export async function uploadReceipt(file: File) {
  const token = await getCurrentUserIdToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/receipts/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new Error(body?.error ?? "Receipt upload failed.");
  }

  return (await response.json()) as ReceiptUploadResponse;
}
