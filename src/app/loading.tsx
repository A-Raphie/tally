export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-16">
      <div className="pt-14">
        <div className="skeleton h-3 w-64" />
        <div className="skeleton mt-10 h-12 w-3/4" />
        <div className="skeleton mt-6 h-4 w-full max-w-[62ch]" />
        <div className="skeleton mt-2 h-4 w-full max-w-[52ch]" />
        <div className="skeleton mt-8 h-12 w-44" />
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="skeleton h-72 border border-[var(--line)]" />
        <div className="skeleton h-72 border border-[var(--line)]" />
      </div>
    </main>
  );
}
