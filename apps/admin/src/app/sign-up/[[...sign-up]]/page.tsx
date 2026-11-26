import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <section className="hidden flex-col justify-between bg-[#172033] p-10 text-white lg:flex">
        <p className="flex items-center gap-3 font-semibold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5b5ce2]">S</span> Store Admin</p>
        <div><p className="text-sm text-indigo-300">Start your workspace</p><h1 className="mt-3 max-w-md text-4xl font-semibold leading-tight">A clearer way to run ecommerce.</h1></div>
        <p className="text-sm text-slate-400">Create and manage with confidence</p>
      </section>
      <section className="flex items-center justify-center bg-[#f5f7fb] px-5 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-3 shadow-[0_20px_60px_rgba(30,41,59,.08)]">
          <SignUp fallbackRedirectUrl="/onboarding/create-company" />
        </div>
      </section>
    </main>
  );
}
