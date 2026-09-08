"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-24">
      <h1 className="text-[40px] font-semibold tracking-[-0.04em]">Something went wrong</h1>
      <p className="mt-4 max-w-lg text-[18px] text-muted">
        {error.message || "The operations console could not load this view."}
      </p>
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
