import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="text-[15px] font-semibold tracking-[-0.02em] text-ink" aria-label="AI Operations home">
      AI Operations
    </Link>
  );
}
