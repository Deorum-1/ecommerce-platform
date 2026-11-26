import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fc]">
      <div className="absolute left-[58%] top-[-260px] h-[620px] w-[620px] rounded-full bg-indigo-100/70 blur-3xl" />
      <div className="absolute bottom-[-300px] right-[-100px] h-[520px] w-[520px] rounded-full bg-violet-100/60 blur-3xl" />

      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link className="flex items-center gap-3 font-semibold text-slate-950" href="/">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5b5ce2] text-white shadow-[0_8px_24px_rgba(91,92,226,.28)]">S</span>
          <span>Store Admin</span>
        </Link>
        <Link className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300" href="/sign-in">
          Sign in
        </Link>
      </nav>

      <div className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-12 px-6 pb-16 lg:grid-cols-[1fr_.86fr] lg:px-10">
        <section>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Built for growing teams
          </div>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-6xl">
            Run your store with clarity.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Manage your company, bring in your team, and keep every part of your ecommerce business moving from one calm workspace.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link className="rounded-xl bg-[#5b5ce2] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(91,92,226,.28)] hover:bg-[#4546bb]" href="/sign-up">
              Create an account
            </Link>
            <Link className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300" href="/sign-in">
              Open dashboard
            </Link>
          </div>
        </section>

        <div className="relative hidden lg:block">
          <div className="rotate-[-2deg] rounded-[28px] border border-white/80 bg-white p-3 shadow-[0_30px_80px_rgba(39,46,89,.16)]">
            <div className="rounded-[20px] bg-[#eef1f7] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Overview</p>
                  <p className="mt-1 font-semibold text-slate-900">This month</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-[#dfe1ff]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white p-4"><p className="text-xs text-slate-500">Revenue</p><p className="mt-3 text-2xl font-semibold text-slate-900">$24.8k</p></div>
                <div className="rounded-2xl bg-white p-4"><p className="text-xs text-slate-500">Orders</p><p className="mt-3 text-2xl font-semibold text-slate-900">1,240</p></div>
              </div>
              <div className="mt-3 rounded-2xl bg-[#172033] p-5 text-white">
                <div className="flex items-end justify-between"><p className="text-sm text-slate-300">Store growth</p><p className="text-sm font-semibold">+18.4%</p></div>
                <div className="mt-8 flex h-24 items-end gap-2">
                  {[35,48,42,65,58,78,72,92].map((height, index) => <div key={index} className="flex-1 rounded-t-md bg-indigo-300" style={{ height: `${height}%`, opacity: .45 + index * .07 }} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
