import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, RotateCcw, AlertCircle, Sun, Moon } from "lucide-react";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Cancellation & Refund Policy - SodaCraft Tamil" },
      {
        name: "description",
        content:
          "Official Cancellation & Refund Policy for creator support tips and voluntary contributions to SodaCraft Tamil.",
      },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

  const isLight = theme === "light";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isLight ? "bg-slate-50 text-slate-800" : "bg-[oklch(0.12_0.02_260)] text-white"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between ${
          isLight
            ? "bg-white/80 border-slate-200 shadow-sm"
            : "bg-[oklch(0.14_0.02_260)]/80 border-white/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <div className="h-4 w-px bg-white/15" />
          <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Cancellation & Refund Policy</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
          title="Toggle theme"
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Payment & Refund Terms
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">Cancellation & Refund Guidelines</h2>
          <p className={`text-xs sm:text-sm ${isLight ? "text-slate-500" : "text-white/60"}`}>
            Razorpay Merchant & Creator Support Guidelines • SodaCraft Tamil
          </p>
        </div>

        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 text-sm leading-relaxed ${
            isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
          }`}
        >
          <section className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
              <AlertCircle className="w-5 h-5" />
              <span>1. Voluntary Creator Contributions</span>
            </h3>
            <p>
              Payments made on this website are voluntary donations and creator tips designed to
              support SodaCraft Tamil YouTube streams, Minecraft SMP server costs, and content
              production. Because these are direct voluntary fan tips and not physical merchandise,
              <strong>
                {" "}
                transactions are generally non-refundable once successfully processed
              </strong>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
              <RotateCcw className="w-5 h-5" />
              <span>2. Erroneous or Duplicate Transactions</span>
            </h3>
            <p>We understand mistakes can happen. If any of the following apply:</p>
            <ul className="list-disc pl-5 space-y-1.5 opacity-90">
              <li>You were charged twice due to a network glitch or gateway timeout.</li>
              <li>An unintended amount was entered by accident.</li>
              <li>An unauthorized transaction occurred without your consent.</li>
            </ul>
            <p className="pt-2">
              Please email us within <strong>48 hours</strong> of the transaction with your payment
              receipt or Razorpay Payment ID at:
              <br />
              <strong className="text-emerald-400 font-mono">SodaCraftads@gmail.com</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
              <RotateCcw className="w-5 h-5" />
              <span>3. Refund Processing Timeline</span>
            </h3>
            <p>Once an eligible refund request is verified:</p>
            <ul className="list-disc pl-5 space-y-1.5 opacity-90">
              <li>
                Our team will initiate the refund via the Razorpay gateway dashboard within 24–48
                business hours.
              </li>
              <li>
                The refunded amount will automatically reflect in your original source payment
                method (bank account, UPI, credit/debit card) within{" "}
                <strong>5 to 7 business days</strong> as per standard banking guidelines.
              </li>
            </ul>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs opacity-75">
          <Link to="/" className="hover:text-emerald-400 transition">
            Home
          </Link>
          <span>•</span>
          <Link to="/support" className="hover:text-emerald-400 transition">
            Support Creator
          </Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-emerald-400 transition">
            Terms & Conditions
          </Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-emerald-400 transition">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/contact" className="hover:text-emerald-400 transition">
            Contact Us
          </Link>
        </div>
      </main>
    </div>
  );
}
