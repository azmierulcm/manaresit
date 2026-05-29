"use client";

const MAX_DIMENSION = 1_600; // px — enough for OCR accuracy, much smaller than raw phone photo
const JPEG_QUALITY = 0.85;

/**
 * Resize + compress an image file entirely in the browser using Canvas.
 * - Phone cameras produce 4–12 MP images (3–8 MB) — this brings them to ~300–600 KB
 * - Dramatically reduces upload time on mobile networks
 * - Returns a new File with the same name but as image/jpeg
 */
export async function compressImageForUpload(file: File): Promise<File> {
  // AVIF / HEIC need decoding — createImageBitmap handles this natively in modern browsers
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Browser can't decode this format (e.g. old Safari + HEIC) — send original
    return file;
  }

  const { width: origW, height: origH } = bitmap;

  // Scale down to MAX_DIMENSION if needed
  let targetW = origW;
  let targetH = origH;
  const longest = Math.max(origW, origH);
  if (longest > MAX_DIMENSION) {
    const ratio = MAX_DIMENSION / longest;
    targetW = Math.round(origW * ratio);
    targetH = Math.round(origH * ratio);
  }

  // Draw onto an offscreen canvas
  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file; // fallback — canvas not available

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  // Encode as JPEG
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY });

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}
