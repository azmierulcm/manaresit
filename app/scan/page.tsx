"use client";

import { useRef, useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteObject } from "firebase/storage";
import { Camera, Upload } from "lucide-react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { UploadModal } from "@/components/receipts/upload-modal";
import { ReceiptCard } from "@/components/receipts/receipt-card";
import { ReceiptDetailModal } from "@/components/receipts/receipt-detail-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { useReceipts, type ClientReceipt } from "@/hooks/use-receipts";
import { db } from "@/lib/firebase/firestore";
import { receiptStorageRef } from "@/lib/firebase/storage";
import { AppShell } from "@/components/layout/app-shell";

function ScanView() {
  const { user } = useAuth();
  const { receipts, isLoading } = useReceipts(user?.uid ?? null);
  const { toast } = useToast();

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<ClientReceipt | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const pendingReceipts = receipts.filter(
    (r) => r.scanStatus === "ocr_complete" || r.scanStatus === "needs_review",
  );
  const recentReceipts = receipts.filter((r) => r.scanStatus === "confirmed").slice(0, 8);

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setUploadOpen(true);
    }
    e.target.value = "";
  }

  function handleModalClose() {
    setUploadOpen(false);
    setPendingFile(null);
  }

  async function handleDelete(receipt: ClientReceipt) {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "receipts", receipt.id));
      deleteObject(receiptStorageRef(user.uid, receipt.id)).catch(() => null);
      toast("Receipt deleted.");
    } catch {
      toast("Failed to delete receipt.", "error");
    }
  }

  return (
    <>
      {/* Hidden file inputs — camera and gallery */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileSelected}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={onFileSelected}
      />

      {user && (
        <UploadModal
          open={uploadOpen}
          onClose={handleModalClose}
          userId={user.uid}
          initialFile={pendingFile}
        />
      )}

      <ReceiptDetailModal
        receipt={selected}
        userId={user?.uid ?? ""}
        open={!!selected}
        onClose={() => setSelected(null)}
        onConfirmed={() => setSelected(null)}
      />

      <AppShell title="Scan">
        <div className="space-y-6">
          {/* Hero scan card */}
          <Card className="p-6 sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
                <Camera className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-zinc-950">Scan a receipt</h2>
              <p className="mt-2 text-sm text-zinc-500">
                AI extracts vendor, amount, date, and category automatically.
                Stored privately in your vault.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  className="h-12 min-w-40 bg-rose-500 hover:bg-rose-600"
                  onClick={() => cameraRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  Use camera
                </Button>
                <Button
                  variant="secondary"
                  className="h-12 min-w-40"
                  onClick={() => galleryRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload image
                </Button>
              </div>
            </div>
          </Card>

          {/* Pending review */}
          {(isLoading || pendingReceipts.length > 0) && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-zinc-950">
                Needs review {!isLoading && `(${pendingReceipts.length})`}
              </h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingReceipts.map((r) => (
                    <ReceiptCard
                      key={r.id}
                      receipt={r}
                      onClick={() => setSelected(r)}
                      onDelete={() => handleDelete(r)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Recent confirmed scans */}
          {(isLoading || recentReceipts.length > 0) && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-zinc-950">Recent scans</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentReceipts.map((r) => (
                    <ReceiptCard
                      key={r.id}
                      receipt={r}
                      onClick={() => setSelected(r)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {!isLoading && receipts.length === 0 && (
            <Card className="p-6 text-center">
              <p className="text-sm text-zinc-400">No receipts yet. Scan your first one above.</p>
            </Card>
          )}
        </div>
      </AppShell>
    </>
  );
}

export default function ScanPage() {
  return (
    <ProtectedPage>
      <ScanView />
    </ProtectedPage>
  );
}
