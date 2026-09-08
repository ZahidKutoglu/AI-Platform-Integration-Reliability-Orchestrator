import Link from "next/link";
import { TopNav } from "@/components/layout/top-nav";
import { DemoBanner } from "@/components/layout/demo-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <DemoBanner />
      <TopNav />
      <main className="mx-auto w-full max-w-[1180px] px-6 pb-24 pt-10 md:px-10 md:pt-14">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-6 py-10 text-[13px] text-faint md:flex-row md:items-center md:justify-between md:px-10">
          <p>AI Platform Operations & Reliability Orchestrator</p>
          <p>
            <Link href="/reliability" className="text-muted underline-offset-4 hover:underline">
              Reliability
            </Link>
            {" · "}
            <Link href="/docs" className="text-muted underline-offset-4 hover:underline">
              API documentation
            </Link>
            {" · "}
            <Link href="/simulation" className="text-muted underline-offset-4 hover:underline">
              Simulation Center
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
