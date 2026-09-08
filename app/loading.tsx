export default function Loading() {
  return (
    <div className="py-10" aria-busy="true" aria-label="Loading">
      <div className="h-1.5 w-32 animate-pulse rounded-full bg-black/10" />
    </div>
  );
}
