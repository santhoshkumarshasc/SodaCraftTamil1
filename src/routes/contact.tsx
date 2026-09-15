import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Youtube,
  Send,
  HelpCircle,
  Sun,
  Moon,
  ExternalLink,
} from "lucide-react";
import { useAdminConfig } from "@/lib/admin-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us - SodaCraft Tamil" },
      {
        name: "description",
        content:
          "Official contact information, email, business inquiries, and social channels for SodaCraft Tamil gaming community.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const config = useAdminConfig();

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
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Contact Us & Information</span>
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
            Get in Touch
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">Official Creator Channels & Inquiries</h2>
          <p className={`text-xs sm:text-sm ${isLight ? "text-slate-500" : "text-white/60"}`}>
            Sponsorships, SMP inquiries, support assistance & creator collaboration
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className={`p-6 rounded-3xl border shadow-md space-y-3 ${
              isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Business & Sponsorship Email</h3>
            <p className="text-xs opacity-75">
              For brand deals, SMP sponsorship, technical issues, or refund questions:
            </p>
            <a
              href="mailto:SodaCraftads@gmail.com"
              className="inline-block font-mono text-sm font-bold text-emerald-400 hover:underline"
            >
              SodaCraftads@gmail.com
            </a>
          </div>

          <div
            className={`p-6 rounded-3xl border shadow-md space-y-3 ${
              isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Official WhatsApp Channel</h3>
            <p className="text-xs opacity-75">
              Receive live stream alerts, behind-the-scenes updates & community announcements:
            </p>
            <a
              href="https://whatsapp.com/channel/0029Vb8CgorG8l5L5vc28T1W"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline"
            >
              <span>Join WhatsApp Channel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div
            className={`p-6 rounded-3xl border shadow-md space-y-3 ${
              isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Discord Gaming Community</h3>
            <p className="text-xs opacity-75">
              Chat directly with SodaCraft Tamil players, apply for Minecraft SMP whitelists, and
              voice chat:
            </p>
            <a
              href="https://discord.com/invite/XRUkfZnpfv"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:underline"
            >
              <span>Join Discord Server</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div
            className={`p-6 rounded-3xl border shadow-md space-y-3 ${
              isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500">
              <Youtube className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Official YouTube Channels</h3>
            <p className="text-xs opacity-75">
              Subscribe for Tamil Minecraft adventures, daily episodes, and high-FPS live streams:
            </p>
            <div className="flex flex-col gap-1 text-xs">
              <a
                href="https://www.youtube.com/@SodaCraftTamil"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline font-semibold"
              >
                • SodaCraftTamil (Main)
              </a>
              <a
                href="https://www.youtube.com/@SodaPuttiGamer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline font-semibold"
              >
                • SodaPuttiGamer
              </a>
              <a
                href="https://www.youtube.com/@SodaCraftTamil2.0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline font-semibold"
              >
                • SodaCraftTamil 2.O
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-4 ${
            isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
          }`}
        >
          <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
            <HelpCircle className="w-5 h-5" />
            <span>Frequently Asked Questions</span>
          </h3>

          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-bold">How does the creator receive my support payment?</h4>
              <p className="text-xs opacity-75 mt-0.5">
                Payments go directly to SodaCraft Tamil via verified Razorpay gateway or UPI. After
                successful payment, an automated WhatsApp notification with receipt details is
                dispatched straight to the creator.
              </p>
            </div>

            <div>
              <h4 className="font-bold">Where can I download my Payment Receipt?</h4>
              <p className="text-xs opacity-75 mt-0.5">
                Immediately after your transaction completes on the Support Page, an on-screen
                Payment Receipt appears with a 1-click Download button.
              </p>
            </div>

            <div>
              <h4 className="font-bold">How can I join the SodaCraft SMP Minecraft server?</h4>
              <p className="text-xs opacity-75 mt-0.5">
                Join our Discord community server or WhatsApp channel. Whitelist announcements and
                SMP server application dates are posted regularly.
              </p>
            </div>
          </div>
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
          <Link to="/refund" className="hover:text-emerald-400 transition">
            Refund Policy
          </Link>
        </div>
      </main>
    </div>
  );
}
