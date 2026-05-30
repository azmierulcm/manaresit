import "server-only";

import { ImageAnnotatorClient } from "@google-cloud/vision";

let _client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
  if (_client) return _client;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set");

  const decoded = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");

  const credentials = JSON.parse(decoded) as {
    client_email: string;
    private_key: string;
  };

  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }

  _client = new ImageAnnotatorClient({ credentials });
  return _client;
}

export async function extractReceiptText(imageBuffer: Buffer): Promise<string> {
  const client = getClient();

  const [result] = await client.documentTextDetection({
    image: { content: imageBuffer.toString("base64") },
    imageContext: {
      languageHints: ["en", "ms", "ko", "zh-Hant", "zh-Hans", "ja", "th"],
    },
  });

  return result.fullTextAnnotation?.text ?? "";
}
