"use client";

import { useState } from "react";
import { Camera, Upload } from "lucide-react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { UploadModal } from "@/components/receipts/upload-modal";
import { ReceiptCard } from "@/components/receipts/receipt-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { useReceipts } from "@/hooks/use-receipts";
import { AppShell } from "@/components/layout/app-shell";

function ScanView() {
  const { user } = useAuth();
  const { receipts, isLoading } = useReceipts(user?.uid ?? null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const pendingReceipts = receipts.filter(
    (r) => r.scanStatus === "ocr_complete" || r.scanStatus === "needs_review",
  );
  const recentReceipts = receipts.slice(0, 10);

  return (
    <>
      {user && (
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          userId={user.uid}
        />
      )}

      <AppShell title="Scan">
        <div className="space-y-6">
          {/* Hero scan card */}
          <Card className="p-6 sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
                <Camera className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-zinc-950">
                Scan a receipt
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                AI extracts vendor, amount, date, and category automatically.
                Stored privately in your vault.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  className="h-12 min-w-40 bg-rose-500 hover:bg-rose-600"
                  onClick={() => setUploadOpen(true)}
                >
                  <Camera className="h-4 w-4" />
                  Use camera
                </Button>
                <Button
                  variant="secondary"
                  className="h-12 min-w-40"
                  onClick={() => setUploadOpen(true)}
                >
                  <Upload className="h-4 w-4" />
                  Upload image
                </Button>
              </div>
            </div>
          </Card>

          {/* Pending review */}
          {pendingReceipts.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-zinc-950">
                Waiting for review ({pendingReceipts.length})
              </h3>
              <div className="space-y-2">
                {pendingReceipts.map((r) => (
                  <ReceiptCard key={r.id} receipt={r} />
                ))}
              </div>
            </section>
          )}

          {/* Recent scans */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-zinc-950">Recent scans</h3>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : recentReceipts.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-zinc-400">No receipts yet. Scan your first one above.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentReceipts.map((r) => (
                  <ReceiptCard key={r.id} receipt={r} />
                ))}
              </div>
            )}
          </section>
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
