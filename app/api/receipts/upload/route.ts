import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import sharp from "sharp";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase/admin";
import { extractReceiptText } from "@/lib/ocr/vision";
import { parseReceiptText, suggestCategory } from "@/lib/ocr/parser";
import type { ReceiptDoc, ReceiptUploadResponse } from "@/types/receipt";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

async function getUserId(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

/** Block if user has uploaded >= 20 receipts in the last hour */
async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const snap = await adminDb
      .collection("receipts")
      .where("userId", "==", userId)
      .where("createdAt", ">=", oneHourAgo)
      .count()
      .get();
    return snap.data().count < 20;
  } catch {
    return true; // fail open — don't block on rate-limit check errors
  }
}

function assertImageFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported receipt image format.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Receipt image is too large (max 12 MB).");
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await checkRateLimit(userId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait before uploading more receipts." },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing receipt image." }, { status: 400 });
    }

    assertImageFile(file);

    const receiptRef = adminDb.collection("receipts").doc();
    const receiptId = receiptRef.id;
    const originalBuffer = Buffer.from(await file.arrayBuffer());

    // 1. Compress to AVIF for storage
    const processed = await sharp(originalBuffer)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .avif({ quality: 55, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    // 2 + 3. Upload to Storage AND run OCR in parallel — saves ~1-2s
    const storagePath = `users/${userId}/receipts/${receiptId}.avif`;
    const bucket = adminStorage.bucket();
    const storageFile = bucket.file(storagePath);

    const uploadPromise = storageFile.save(processed.data, {
      resumable: false,
      metadata: {
        contentType: "image/avif",
        cacheControl: "private, max-age=31536000",
        metadata: { ownerUid: userId, originalName: file.name },
      },
    });

    const ocrPromise = extractReceiptText(originalBuffer).catch((err) => {
      console.error("OCR failed, saving for manual review:", err);
      return null; // null signals OCR failure
    });

    const [, rawText] = await Promise.all([uploadPromise, ocrPromise]);

    let extracted: ReturnType<typeof parseReceiptText>;
    let scanStatus: ReceiptDoc["scanStatus"];

    if (rawText === null) {
      extracted = { currency: "MYR", receiptDate: Timestamp.now() };
      scanStatus = "needs_review";
    } else {
      extracted = parseReceiptText(rawText);
      scanStatus = "ocr_complete";
    }

    // 4. Category suggestion
    const categorySuggestion = suggestCategory(extracted.vendor);

    // 5. Write receipt doc to Firestore
    const now = FieldValue.serverTimestamp();
    const receiptDoc: Omit<ReceiptDoc, "createdAt" | "updatedAt"> & {
      createdAt: FieldValue;
      updatedAt: FieldValue;
    } = {
      id: receiptId,
      userId,
      storagePath,
      originalFile: {
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      },
      processedFile: {
        mimeType: "image/avif",
        sizeBytes: processed.data.byteLength,
        width: processed.info.width,
        height: processed.info.height,
      },
      scanStatus,
      extracted,
      categorySuggestion,
      security: {
        avifCompressed: true,
        savedToVault: true,
        virusScanStatus: "pending",
      },
      createdAt: now,
      updatedAt: now,
    };

    await receiptRef.set(receiptDoc);

    // 6. Build response
    const extractedResponse = {
      ...extracted,
      receiptDate: extracted.receiptDate
        ? (extracted.receiptDate as unknown as { toDate: () => Date }).toDate().toISOString()
        : undefined,
    };

    const response: ReceiptUploadResponse = {
      receiptId,
      storagePath,
      scanStatus,
      processedFile: receiptDoc.processedFile,
      extracted: extractedResponse,
      categorySuggestion,
      trustSignal: {
        label: "Saved safely to vault",
        description: "Receipt compressed to AVIF and stored in your private vault.",
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    // Only expose safe, user-facing messages — never internal details
    const SAFE_MESSAGES = new Set([
      "Unsupported receipt image format.",
      "Receipt image is too large (max 12 MB).",
      "Missing receipt image.",
    ]);
    const raw = error instanceof Error ? error.message : "";
    const message = SAFE_MESSAGES.has(raw) ? raw : "Receipt upload failed. Please try again.";
    console.error("[upload] unhandled error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
