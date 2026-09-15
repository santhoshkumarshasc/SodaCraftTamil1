import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Shield, CheckCircle, FileText, Sun, Moon, Home } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions - SodaCraft Tamil" },
      {
        name: "description",
        content:
          "Official Terms and Conditions for SodaCraft Tamil gaming community, creator support, live streaming, and SMP server participation.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Terms and Conditions</span>
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
            Legal & Community Agreement
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            Terms of Service & Community Guidelines
          </h2>
          <p className={`text-xs sm:text-sm ${isLight ? "text-slate-500" : "text-white/60"}`}>
            Last updated: September 2026 • Official Terms for SodaCraft Tamil & Affiliates
          </p>
        </div>

        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 text-sm leading-relaxed ${
            isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
          }`}
        >
          <section className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
              <Shield className="w-5 h-5" />
              <span>1. Agreement to Terms</span>
            </h3>
            <p>
              By accessing our website (<strong>https://sodacrafttamil.vercel.app</strong>),
              engaging with our YouTube content, joining the Discord server, or contributing creator
              support payments via Razorpay or UPI QR, you acknowledge that you have read,
              understood, and agree to be bound by these Terms and Conditions.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span>2. Creator Support & Voluntary Contributions</span>
            </h3>
            <p>
              All payments made through the Support Portal (including preset amounts, custom UPI
              transfers, and Razorpay gateway transactions) are{" "}
              <strong>voluntary tips, donations, and fan contributions</strong> intended to support
              SodaCraft Tamil creator operations, dedicated Minecraft SMP hosting, video production
              equipment, and high-FPS live streams.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 opacity-90">
              <li>
                Contributions do not constitute purchase of equity, ownership rights, or guaranteed
                game items unless explicitly designated as an official SMP membership tier.
              </li>
              <li>
                Every successful contributor receives an on-screen verified digital receipt and an
                instant automated WhatsApp payment confirmation dispatch to the creator.
              </li>
              <li>
                You represent that you are at least 18 years of age or possess legal guardian
                consent to execute online payment transactions using your bank account or card.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span>3. SMP Server & Interactive Gameplay Rules</span>
            </h3>
            <p>
              If your support grants you access or whitelist eligibility to SodaCraft Tamil
              Minecraft SMP servers or community events:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 opacity-90">
              <li>
                No griefing, unauthorized hacking, exploiting, or harassment of other server
                members.
              </li>
              <li>Respect all moderators, stream rules, and Tamil gaming community standards.</li>
              <li>
                Violation of SMP community rules may result in immediate suspension or ban without
                refund.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span>4. Intellectual Property</span>
            </h3>
            <p>
              All video content, logos, stream graphics, thumbnails, and branding associated with
              <strong> SodaCraft Tamil</strong>, <strong>SodaPuttiGamer</strong>, and
              <strong> SodaCraft Tamil 2.0</strong> are the intellectual property of SodaCraft
              Tamil. Minecraft is a trademark of Mojang Synergies AB / Microsoft; we are an
              independent gaming creator and not officially affiliated with Mojang.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span>5. Contact Information</span>
            </h3>
            <p>
              For legal questions, sponsorships, or support inquiries regarding these terms, contact
              our team at:
              <br />
              <strong className="text-emerald-400 font-mono">SodaCraftads@gmail.com</strong>
            </p>
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
          <Link to="/privacy" className="hover:text-emerald-400 transition">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/refund" className="hover:text-emerald-400 transition">
            Refund Policy
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
