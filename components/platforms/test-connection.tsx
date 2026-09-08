"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Result = {
  ok: boolean;
  latencyMs: number;
  message: string;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

export function TestConnectionButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    try {
      const data = await api<Result>(`/api/platforms/${slug}/test`, { method: "POST" });
      setResult(data);
      toast.success(data.message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connection test failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button onClick={run} disabled={loading}>
        {loading ? "Testing…" : "Test connection"}
      </Button>
      {result ? (
        <ul className="text-[13px] text-muted">
          {result.checks.map((check) => (
            <li key={check.name}>
              {check.ok ? "✓" : "⚠"} {check.name} · {check.detail}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
