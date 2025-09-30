
import Link from "next/link";

export default function VerifyEmail() {
  return (
    <div className="p-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between rounded-md bg-panel px-4 py-3">
        <div className="text-lg font-semibold">TRACEBACK</div>
        <Link href="/login" className="btn-ghost">Log In</Link>
      </header>
      <div className="mx-auto mt-10 grid max-w-xl place-items-center rounded-xl border border-border bg-white p-12 text-center">
        <p className="mb-4 text-lg">Check your email to verify your account</p>
        <button className="btn">Resend Verification</button>
      </div>
    </div>
  );
}
