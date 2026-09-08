"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Result = {
  results: Array<{ name: string; ok: boolean; warn: boolean; detail: string }>;
  recommendation: string;
  latencyMs: number;
};

export function RunDiagnostic({ slug }: { slug: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const data = await api<Result>(`/api/runbooks/${slug}`, { method: "POST" });
      setResult(data);
      toast.success("Diagnostic complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Diagnostic failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md">
      <Button onClick={run} disabled={busy}>{busy ? "Running…" : "Run diagnostic"}</Button>
      {result ? (
        <ul className="mt-4 space-y-1 text-[14px] text-muted">
          {result.results.map((item) => (
            <li key={item.name}>
              {item.ok ? "✓" : item.warn ? "⚠" : "✕"} {item.name} · {item.detail}
            </li>
          ))}
          <li className="pt-2 text-ink">{result.recommendation}</li>
        </ul>
      ) : null}
    </div>
  );
}
