import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24">
      <p className="text-[13px] text-faint">404</p>
      <h1 className="mt-3 text-[40px] font-semibold tracking-[-0.04em]">This page is not in the operations surface.</h1>
      <p className="mt-4 max-w-lg text-[18px] text-muted">
        The route may have moved, or the record no longer exists after a simulation reset.
      </p>
      <Link href="/" className="mt-8 inline-block text-[15px] font-medium">
        Back to Overview
      </Link>
    </div>
  );
}
