export default function AppLoading() {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Memuat halaman"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="kartu col-span-2 h-24 bg-[color:var(--surface)] sm:col-span-1" />
        <div className="kartu h-24 bg-[color:var(--surface)]" />
        <div className="kartu h-24 bg-[color:var(--surface)]" />
      </div>

      <div className="h-10 w-48 rounded-xl bg-[color:var(--surface)]" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-4">
          <div className="kartu h-28 bg-[color:var(--surface)]" />
          <div className="kartu h-32 bg-[color:var(--surface)]" />
          <div className="kartu h-32 bg-[color:var(--surface)]" />
        </div>
        <div className="hidden space-y-4 lg:block">
          <div className="kartu h-32 bg-[color:var(--surface)]" />
          <div className="kartu h-64 bg-[color:var(--surface)]" />
        </div>
      </div>
    </div>
  );
}
