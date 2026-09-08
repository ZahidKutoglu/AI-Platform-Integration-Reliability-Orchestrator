"use client";

import { Toaster } from "sonner";
import { CommandPalette } from "@/components/search/command-palette";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CommandPalette />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "font-sans",
          style: {
            background: "white",
            border: "1px solid rgba(29,29,31,0.08)",
            color: "#1d1d1f",
            borderRadius: 16,
          },
        }}
      />
    </>
  );
}
