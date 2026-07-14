import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef, useCallback } from "react";
import { getChannel, type ChannelPayload } from "@/lib/youtube.functions";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  X,
  Sparkles,
  Youtube,
  Gamepad2,
  Languages,
  Trophy,
  Calendar,
  Laptop,
  ShoppingCart,
  Sun,
  Moon,
  Search,
} from "lucide-react";

const channelQueryOptions = queryOptions<ChannelPayload>({
  queryKey: ["yt-channel"],
  queryFn: () => getChannel(),
  staleTime: 30_000,
  refetchInterval: 30_000,
});

export const Route = createFileRoute("/")({
  head: ({ loaderData }) => {
    const data = loaderData as ChannelPayload | undefined;
    const title = data?.channel?.title
      ? `${data.channel.title} - Official Minecraft Tamil Gaming Channel`
      : "SodaCraft Tamil - Official Minecraft Tamil Gaming Channel";

    const formattedSubs = data?.channel?.subscribers
      ? Number(data.channel.subscribers).toLocaleString()
      : "142,000+";

    const description = data?.channel?.description
      ? `${data.channel.description.slice(0, 150)}... Join ${formattedSubs} subscribers for live sub counts, latest uploads, and community links.`
      : "Official portfolio for SodaCraft Tamil. Live subscriber count, latest videos, and social links for the Tamil Minecraft gaming channel.";

    const ogImage =
      data?.channel?.thumbnail ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "keywords",
          content:
            "SodaCraft, SodaCraftTamil, SodaCraft Tamil, Minecraft Tamil, Tamil Gaming, Minecraft Live Count, SodaPuttiGamer",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
        { name: "robots", content: "index, follow" },
      ],
    };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(channelQueryOptions),
  component: Home,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-background p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Couldn't load channel</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
});

const SOCIALS = [
  {
    label: "SodaPuttiGamer",
    href: "https://www.youtube.com/@SodaPuttiGamer",
    icon: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1c.3-1.9.5-3.8.5-5.8 0-2-.2-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z",
  },
  {
    label: "SodaCraftTamil",
    href: "https://www.youtube.com/@SodaCraftTamil",
    icon: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1c.3-1.9.5-3.8.5-5.8 0-2-.2-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z",
  },
  {
    label: "SodaCraftTamil 2.O",
    href: "https://www.youtube.com/@SodaCraftTamil2.0",
    icon: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1c.3-1.9.5-3.8.5-5.8 0-2-.2-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/sodacrafttamil",
    icon: "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.9.2 2.4.4.6.2 1 .5 1.5 1s.8.9 1 1.5c.2.5.4 1.2.4 2.4.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.9-.4 2.4-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.5.2-1.2.4-2.4.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.9-.2-2.4-.4-.6-.2-1-.5-1.5-1s-.8-.9-1-1.5c-.2-.5-.4-1.2-.4-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.9.4-2.4.2-.6.5-1 1-1.5s.9-.8 1.5-1c.5-.2 1.2-.4 2.4-.4C8.4 2.2 8.8 2.2 12 2.2zm0 5.6a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4zm5.4-.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 9.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4z",
  },
  {
    label: "Discord",
    href: "https://discord.com/invite/XRUkfZnpfv",
    icon: "M20.3 4.4A19 19 0 0 0 15.7 3l-.2.4a17.5 17.5 0 0 0-7 0L8.3 3a19 19 0 0 0-4.6 1.4A20 20 0 0 0 .3 17.6a19 19 0 0 0 5.8 2.9l.5-.6a13 13 0 0 1-2-.9l.2-.1a13.6 13.6 0 0 0 13.4 0l.2.1a13 13 0 0 1-2 .9l.5.6a19 19 0 0 0 5.8-2.9 20 20 0 0 0-3.4-13.2zM8.5 15.3a2.3 2.3 0 0 1 0-4.5 2.3 2.3 0 0 1 0 4.5zm7 0a2.3 2.3 0 0 1 0-4.5 2.3 2.3 0 0 1 0 4.5z",
  },
  {
    label: "Facebook",
    href: "",
    icon: "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z",
  },
  {
    label: "WhatsApp",
    href: "https://whatsapp.com/channel/0029Vb8CgorG8l5L5vc28T1W",
    icon: "M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.135-1.347a9.95 9.95 0 0 0 4.87 1.272h.005c5.505 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.178-2.924-7.067C17.19 3.01 14.685 2 12.012 2zm5.727 13.914c-.244.69-1.42 1.258-1.95 1.328-.483.064-.973.11-2.96-.708-2.54-1.045-4.143-3.664-4.27-3.83-.127-.168-.934-1.24-.934-2.365 0-1.127.575-1.683.805-1.916.23-.23.504-.288.67-.288.167 0 .334.002.48.01.147.007.347-.056.544.422.2.487.683 1.666.74 1.78.06.115.1.25.02.408-.078.16-.17.26-.296.41-.125.148-.263.33-.377.443-.127.127-.26.265-.11.524.15.26.663 1.096 1.42 1.77.973.867 1.79 1.135 2.046 1.263.256.128.406.107.557-.064.15-.17.654-.76.828-1.02.174-.26.348-.217.587-.128.24.088 1.52.717 1.78.847.26.13.435.195.498.304.064.11.064.636-.18 1.326z",
  },
  {
    label: "X / Twitter",
    href: "",
    icon: "M18.9 3H22l-7.5 8.6L23 21h-6.8l-5.3-6.9L4.8 21H1.7l8-9.2L1 3h7l4.8 6.3L18.9 3zm-1.2 16h1.9L6.4 5H4.4l13.3 14z",
  },
];

function formatNumber(n: string | number) {
  const num = typeof n === "string" ? parseInt(n, 10) : n;
  if (isNaN(num)) return n.toString();
  return num.toLocaleString();
}

function useNow(initialValue: number, intervalMs = 1000) {
  const [now, setNow] = useState(initialValue);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function timeAgo(iso: string, now: number) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function AnimatedCounter({
  value,
  highlight,
  isLight,
}: {
  value: number;
  highlight?: boolean;
  isLight?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const [pulseCount, setPulseCount] = useState(0);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const prev = prevValueRef.current;
    if (prev === value) return;

    if (value > prev) {
      setDirection("up");
      setPulseCount((prevCount) => prevCount + 1);
    } else {
      setDirection("down");
    }

    // Animate the numeric value smoothly
    const start = Date.now();
    const duration = 1200; // 1.2s smooth transition

    let active = true;
    const tick = () => {
      if (!active) return;
      const now = Date.now();
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutCubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const current = Math.round(prev + (value - prev) * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
        prevValueRef.current = value;
        setDirection(null);
      }
    };

    requestAnimationFrame(tick);

    return () => {
      active = false;
    };
  }, [value]);

  // Handle initial mount count up
  useEffect(() => {
    const start = Date.now();
    const duration = 1500;
    const startVal = Math.floor(value * 0.95);

    let active = true;
    const tick = () => {
      if (!active) return;
      const now = Date.now();
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutExpo
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const current = Math.round(startVal + (value - startVal) * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
        prevValueRef.current = value;
      }
    };

    requestAnimationFrame(tick);

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative inline-flex items-center">
      <motion.span
        key={pulseCount} // Re-trigger entry animation on pulse count change
        initial={pulseCount > 0 ? { scale: 1, textShadow: "0 0 0px rgba(0,0,0,0)" } : false}
        animate={
          pulseCount > 0
            ? {
                scale: [1, 1.15, 1],
                color: highlight
                  ? ["#ffffff", "#fef08a", "#ffffff"]
                  : isLight
                    ? ["#0f172a", "#16a34a", "#0f172a"]
                    : ["#ffffff", "#4ade80", "#ffffff"],
                textShadow: highlight
                  ? [
                      "0 0 0px rgba(254,240,138,0)",
                      "0 0 15px rgba(254,240,138,0.6)",
                      "0 0 0px rgba(254,240,138,0)",
                    ]
                  : [
                      "0 0 0px rgba(74,222,128,0)",
                      "0 0 15px rgba(74,222,128,0.6)",
                      "0 0 0px rgba(74,222,128,0)",
                    ],
              }
            : {}
        }
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="inline-block select-none"
      >
        {displayValue.toLocaleString()}
      </motion.span>

      {/* Floating "+1" or dynamic increase indicator */}
      {direction === "up" && (
        <motion.span
          initial={{ opacity: 0, y: 10, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1, 0], y: -25, scale: [0.8, 1.1, 1, 0.8] }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute -top-4 -right-10 text-xs font-extrabold ${
            highlight ? "text-amber-400" : "text-green-400"
          }`}
        >
          +{Math.max(1, value - prevValueRef.current)}
        </motion.span>
      )}
    </div>
  );
}

function Home() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const isLight = theme === "light";

  const { data } = useSuspenseQuery(channelQueryOptions);
  const { channel, videos, live, fetchedAt } = data;

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://sodacrafttamil.com/#website",
        url: "https://sodacrafttamil.com",
        name: "SodaCraftTamil",
        description: channel?.description || "SodaCraft Tamil Gaming Channel Portfolio",
        publisher: {
          "@id": "https://sodacrafttamil.com/#organization",
        },
      },
      {
        "@type": "ProfilePage",
        "@id": "https://sodacrafttamil.com/#profile",
        url: "https://sodacrafttamil.com",
        name: "SodaCraftTamil - Official Website",
        isPartOf: {
          "@id": "https://sodacrafttamil.com/#website",
        },
        about: {
          "@id": "https://sodacrafttamil.com/#organization",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://sodacrafttamil.com/#organization",
        name: "SodaCraftTamil",
        url: "https://www.youtube.com/@SodaCraftTamil",
        logo: channel?.thumbnail,
        sameAs: [
          "https://www.youtube.com/@SodaCraftTamil",
          "https://www.youtube.com/@SodaPuttiGamer",
          "https://whatsapp.com/channel/0029Vb8CgorG8l5L5vc28T1W",
        ],
      },
    ],
  };

  useEffect(() => {
    if (channel?.thumbnail && typeof window !== "undefined") {
      const links = document.querySelectorAll("link[rel*='icon']");
      if (links.length > 0) {
        links.forEach((link) => {
          (link as HTMLLinkElement).href = channel.thumbnail;
        });
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = channel.thumbnail;
        document.head.appendChild(link);
      }
    }
  }, [channel?.thumbnail]);

  const initialTime = fetchedAt ? new Date(fetchedAt).getTime() : 1770000000000;
  const now = useNow(initialTime, 1000);

  const latestVideo = videos && videos.length > 0 ? videos[0] : null;

  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const liveAgeMs = live?.publishedAt ? now - new Date(live.publishedAt).getTime() : null;
  const isLiveNew = live && (liveAgeMs === null || liveAgeMs < TWENTY_FOUR_HOURS_MS);

  const latestVideoAgeMs = latestVideo ? now - new Date(latestVideo.publishedAt).getTime() : null;
  const isVideoNew =
    latestVideo && latestVideoAgeMs !== null && latestVideoAgeMs < TWENTY_FOUR_HOURS_MS;

  let activeAlert: {
    type: "live" | "video";
    title: string;
    url: string;
    publishedAt: string;
    thumbnail: string;
  } | null = null;

  if (isLiveNew && isVideoNew) {
    const videoAge = latestVideoAgeMs ?? Infinity;
    const liveAge = liveAgeMs ?? 0;
    if (liveAge <= videoAge) {
      activeAlert = {
        type: "live",
        title: live.title,
        url: live.url,
        publishedAt: live.publishedAt || new Date().toISOString(),
        thumbnail: live.thumbnail,
      };
    } else {
      activeAlert = {
        type: "video",
        title: latestVideo.title,
        url: latestVideo.url,
        publishedAt: latestVideo.publishedAt,
        thumbnail: latestVideo.thumbnail,
      };
    }
  } else if (isLiveNew) {
    activeAlert = {
      type: "live",
      title: live.title,
      url: live.url,
      publishedAt: live.publishedAt || new Date().toISOString(),
      thumbnail: live.thumbnail,
    };
  } else if (isVideoNew) {
    activeAlert = {
      type: "video",
      title: latestVideo.title,
      url: latestVideo.url,
      publishedAt: latestVideo.publishedAt,
      thumbnail: latestVideo.thumbnail,
    };
  }

  const alertId = activeAlert ? `${activeAlert.type}_${activeAlert.publishedAt}` : null;
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissedId(localStorage.getItem("sodacraft_dismissed_alert"));
    }
  }, []);

  const handleDismiss = useCallback(() => {
    if (alertId) {
      setDismissedId(alertId);
      localStorage.setItem("sodacraft_dismissed_alert", alertId);
    }
  }, [alertId]);

  const showAlert = activeAlert && dismissedId !== alertId;

  useEffect(() => {
    if (showAlert && alertId) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showAlert, alertId, handleDismiss]);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isLight ? "bg-[oklch(0.97_0.01_240)] text-slate-900" : "bg-[oklch(0.08_0.02_260)] text-white"}`}
    >
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* ALERT BANNER */}
      <AnimatePresence>
        {showAlert && activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className={`fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] z-50 overflow-hidden rounded-2xl border p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 ${
              activeAlert.type === "live"
                ? "bg-red-950/20 border-red-500/30 shadow-red-500/5 ring-1 ring-red-500/20"
                : "bg-white/5 border-white/10 shadow-black/40 ring-1 ring-white/10"
            }`}
          >
            {/* Soft decorative background glow inside the glass card */}
            <div
              className={`absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-20 pointer-events-none ${
                activeAlert.type === "live" ? "bg-red-500" : "bg-indigo-500"
              }`}
            />

            <div className="relative z-10 flex gap-3.5">
              {activeAlert.thumbnail && (
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40 shadow-inner group">
                  <img
                    src={activeAlert.thumbnail}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                  {activeAlert.type === "live" ? (
                    <span className="absolute left-1.5 top-1.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                  ) : null}
                </div>
              )}

              <div className="flex flex-1 flex-col justify-between min-w-0 pr-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {activeAlert.type === "live" ? (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        Live Stream
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                        <Sparkles className="h-3 w-3 fill-current text-amber-400" />
                        New Video
                      </span>
                    )}
                    {activeAlert.type !== "live" && (
                      <span className="text-[10px] text-white/40 font-medium">
                        • {mounted ? timeAgo(activeAlert.publishedAt, now) : "recently"}
                      </span>
                    )}
                  </div>

                  <span className="font-bold text-xs sm:text-sm line-clamp-2 text-white/95 leading-snug">
                    {activeAlert.title}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={activeAlert.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition duration-200 shadow-md ${
                      activeAlert.type === "live"
                        ? "bg-red-600 hover:bg-red-500 shadow-red-900/30 hover:scale-[1.02] active:scale-[0.98]"
                        : "bg-white/10 hover:bg-white/15 border border-white/5 hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    <Youtube className="h-3.5 w-3.5 text-red-500 fill-current" />
                    Watch Now
                  </a>
                </div>
              </div>

              {/* Close Button Absolute Pos inside the Card */}
              <button
                onClick={handleDismiss}
                className="absolute right-0 top-0 rounded-lg p-1 text-white/40 hover:bg-white/5 hover:text-white transition cursor-pointer"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {channel.banner && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${channel.banner})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(20px)",
            }}
          />
        )}
        <div
          className={`absolute inset-0 transition-all duration-300 ${isLight ? "bg-gradient-to-b from-transparent via-[oklch(0.97_0.01_240)]/60 to-[oklch(0.97_0.01_240)]" : "bg-gradient-to-b from-transparent via-[oklch(0.08_0.02_260)]/60 to-[oklch(0.08_0.02_260)]"}`}
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-10 pb-10 sm:pt-14 sm:pb-12">
          <nav className="mb-10 flex items-center justify-between gap-4">
            <span className="text-base sm:text-lg font-bold tracking-tight shrink-0">
              SodaCraftTamil<span className="text-[oklch(0.75_0.19_25)]">.</span>
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={toggleTheme}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all duration-300 cursor-pointer border ${
                  isLight
                    ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm"
                    : "bg-white/10 hover:bg-white/20 border-white/5 text-white"
                }`}
                title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
                aria-label={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
              {live ? (
                <a
                  href={live.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 animate-pulse sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white sm:h-2 sm:w-2" />
                  </span>
                  Watch Live
                </a>
              ) : (
                <a
                  href="https://www.youtube.com/@SodaCraftTamil/videos"
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold backdrop-blur transition sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm ${
                    isLight
                      ? "bg-slate-200/80 hover:bg-slate-300/80 text-slate-800"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  <svg
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLight ? "fill-slate-800" : "fill-white"}`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch
                </a>
              )}
              <a
                href="https://www.youtube.com/@SodaCraftTamil?sub_confirmation=1"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[oklch(0.65_0.24_25)] px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-[oklch(0.7_0.24_25)] sm:px-5 sm:py-2 sm:text-sm"
              >
                Subscribe
              </a>
            </div>
          </nav>

          <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:text-left">
            <a
              href={live?.url ?? "#"}
              target={live ? "_blank" : undefined}
              rel="noreferrer"
              onClick={(e) => !live && e.preventDefault()}
              className="relative shrink-0 group block"
            >
              {live && (
                <>
                  {/* Glowing live rotating shiny ring */}
                  <span
                    className="absolute -inset-[3.5px] rounded-full bg-gradient-to-tr from-red-600 via-yellow-400 to-red-600 animate-spin"
                    style={{ animationDuration: "3s" }}
                  />
                  <span className="absolute -inset-2 rounded-full bg-red-600/40 blur-lg animate-pulse" />
                  <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-35" />
                  <span className="absolute -bottom-2.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-red-600 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-600/50 ring-2 ring-red-400 flex items-center gap-1.5 animate-bounce">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                </>
              )}
              <img
                src={channel.thumbnail}
                alt={channel.title}
                className={`relative h-32 w-32 rounded-full sm:h-40 sm:w-40 transition-all duration-300 ${
                  live
                    ? "ring-2 ring-black/40 scale-[1.03] shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                    : "ring-4 ring-[oklch(0.65_0.24_25)] group-hover:scale-105"
                }`}
                referrerPolicy="no-referrer"
              />
            </a>
            <div className="flex-1">
              <div
                className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium backdrop-blur ${
                  live
                    ? "bg-red-600/20 text-red-200 ring-1 ring-red-500/50"
                    : isLight
                      ? "bg-slate-200/80 text-slate-700"
                      : "bg-white/5 text-white/70"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                {live ? "LIVE NOW" : "LIVE STATS"}
              </div>
              <h1
                className={`text-4xl font-black tracking-tight sm:text-6xl ${isLight ? "text-slate-900" : "text-white"}`}
              >
                {channel.title}
              </h1>
              <p
                className={`mt-4 max-w-2xl text-sm leading-relaxed sm:text-base ${isLight ? "text-slate-600" : "text-white/60"}`}
              >
                {channel.description.split("\n")[0] || "Tamil gaming & Minecraft content creator."}
              </p>
            </div>
          </div>

          {live && (
            <a
              href={live.url}
              target="_blank"
              rel="noreferrer"
              className={`mt-8 flex items-center gap-4 rounded-2xl p-4 transition ${
                isLight
                  ? "bg-red-50 border border-red-200/60 shadow-sm hover:bg-red-100/50"
                  : "bg-gradient-to-r from-red-600/30 to-red-900/10 ring-1 ring-red-500/40 hover:from-red-600/40"
              }`}
            >
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-black">
                <img
                  src={live.thumbnail}
                  alt={live.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute left-1 top-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                  Live
                </span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div
                  className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isLight ? "text-red-600" : "text-red-300"}`}
                >
                  <span>Streaming now</span>
                  {live.concurrentViewers && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600/40 px-2 py-0.5 text-red-100">
                      <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                        <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                      </svg>
                      {formatNumber(live.concurrentViewers)} watching
                    </span>
                  )}
                </div>
                <div
                  className={`mt-0.5 line-clamp-2 text-sm font-semibold ${isLight ? "text-slate-800" : "text-white"}`}
                >
                  {live.title}
                </div>
              </div>

              <div className="hidden shrink-0 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white sm:block">
                Watch →
              </div>
            </a>
          )}

          {/* STATS */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Subscribers"
              value={parseInt(channel.subscribers, 10) || 0}
              highlight
              isLight={isLight}
            />
            <StatCard
              label="Total Views"
              value={parseInt(channel.views, 10) || 0}
              isLight={isLight}
            />
            <StatCard
              label="Videos"
              value={parseInt(channel.videoCount, 10) || 0}
              isLight={isLight}
            />
          </div>
        </div>
      </section>

      {/* VIDEOS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2
              className={`text-3xl font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}
            >
              Latest Videos
            </h2>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-500" : "text-white/50"}`}>
              Fresh uploads from the channel
            </p>
          </div>
          <a
            href={`https://www.youtube.com/@SodaCraftTamil/videos`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-[oklch(0.75_0.19_25)] hover:underline"
          >
            View all →
          </a>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className={`group overflow-hidden rounded-2xl transition hover:ring-[oklch(0.65_0.24_25)] ${
                isLight
                  ? "bg-white border border-slate-200 shadow-sm text-slate-800"
                  : "bg-white/5 ring-1 ring-white/10"
              }`}
            >
              <div className="relative aspect-video overflow-hidden bg-black">
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
                  <div className="rounded-full bg-red-600 p-4 opacity-0 shadow-lg transition group-hover:opacity-100">
                    <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3
                  className={`line-clamp-2 text-sm font-semibold leading-snug transition-colors duration-150 ${
                    isLight ? "text-slate-800 group-hover:text-red-600" : "text-white"
                  }`}
                >
                  {v.title}
                </h3>
                <p className={`mt-2 text-xs ${isLight ? "text-slate-500" : "text-white/50"}`}>
                  {mounted ? timeAgo(v.publishedAt, now) : "recently"}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ABOUT TEXT CARD */}
          <div
            className={`rounded-2xl p-6 flex flex-col justify-between ${
              isLight
                ? "bg-white border border-slate-200 shadow-sm"
                : "bg-white/5 ring-1 ring-white/10"
            }`}
          >
            <div>
              <h2
                className={`text-2xl font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}
              >
                About SodaCraft
              </h2>
              <div
                className={`mt-4 text-sm leading-relaxed line-clamp-[8] sm:line-clamp-none ${isLight ? "text-slate-600" : "text-white/70"}`}
              >
                {channel.description ||
                  "Official portfolio for SodaCraft Tamil. Live subscriber count, latest videos, and social links for the Tamil Minecraft gaming channel."}
              </div>
            </div>
            <div
              className={`mt-6 rounded-xl p-4 text-center ${
                isLight ? "bg-slate-50 border border-slate-200" : "bg-white/5 border border-white/5"
              }`}
            >
              <span
                className={`text-xs font-bold block ${isLight ? "text-slate-800" : "text-white"}`}
              >
                Official Space
              </span>
              <p className={`mt-1 text-[11px] ${isLight ? "text-slate-500" : "text-white/50"}`}>
                Tracking statistics, real-time streams, and content.
              </p>
            </div>
          </div>

          {/* CHANNEL INFO STATS */}
          <div
            className={`rounded-2xl p-6 flex flex-col justify-between ${
              isLight
                ? "bg-white border border-slate-200 shadow-sm"
                : "bg-white/5 ring-1 ring-white/10"
            }`}
          >
            <div>
              <h3 className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                Channel Info
              </h3>
              <div
                className={`mt-4 space-y-3 text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}
              >
                <div
                  className={`flex justify-between items-center border-b pb-2 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className="flex items-center gap-2 text-white/40">
                    <Gamepad2 className="h-4 w-4 text-[oklch(0.75_0.19_25)]" />
                    <span className={isLight ? "text-slate-400" : "text-white/40"}>Niche</span>
                  </span>
                  <span className={`font-medium ${isLight ? "text-slate-800" : "text-white"}`}>
                    Minecraft & Gaming
                  </span>
                </div>
                <div
                  className={`flex justify-between items-center border-b pb-2 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className="flex items-center gap-2 text-white/40">
                    <Languages className="h-4 w-4 text-[oklch(0.75_0.19_25)]" />
                    <span className={isLight ? "text-slate-400" : "text-white/40"}>Language</span>
                  </span>
                  <span className={`font-medium ${isLight ? "text-slate-800" : "text-white"}`}>
                    Tamil (தமிழ்)
                  </span>
                </div>
                <div
                  className={`flex justify-between items-center border-b pb-2 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className="flex items-center gap-2 text-white/40">
                    <Trophy className="h-4 w-4 text-[oklch(0.75_0.19_25)]" />
                    <span className={isLight ? "text-slate-400" : "text-white/40"}>Sub Goals</span>
                  </span>
                  <span className={`font-medium ${isLight ? "text-slate-800" : "text-white"}`}>
                    Road to 100K!
                  </span>
                </div>
                <div
                  className={`flex justify-between items-center border-b pb-2 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className="flex items-center gap-2 text-white/40">
                    <Calendar className="h-4 w-4 text-[oklch(0.75_0.19_25)]" />
                    <span className={isLight ? "text-slate-400" : "text-white/40"}>
                      Active Since
                    </span>
                  </span>
                  <span className={`font-medium ${isLight ? "text-slate-800" : "text-white"}`}>
                    2025
                  </span>
                </div>
              </div>
            </div>
            <div
              className={`mt-6 rounded-xl p-4 border text-center ${
                isLight
                  ? "bg-[oklch(0.65_0.24_25)]/5 border-[oklch(0.65_0.24_25)]/10"
                  : "bg-[oklch(0.65_0.24_25)]/10 border-[oklch(0.65_0.24_25)]/20"
              }`}
            >
              <span className="text-xs font-bold text-[oklch(0.75_0.19_25)] block">
                Join the Soda Squad!
              </span>
              <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-white/60"}`}>
                Be part of our amazing Minecraft community.
              </p>
            </div>
          </div>

          {/* SETUP & SPECS CARD */}
          <div
            className={`rounded-2xl p-6 flex flex-col justify-between ${
              isLight
                ? "bg-white border border-slate-200 shadow-sm"
                : "bg-white/5 ring-1 ring-white/10"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <Laptop className="h-5 w-5 text-[oklch(0.75_0.19_25)]" />
                <h3 className={`text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                  Gaming & Stream Setup
                </h3>
              </div>
              <p className={`mt-2 text-xs ${isLight ? "text-slate-500" : "text-white/50"}`}>
                Current laptop specifications used for Minecraft streaming and recording.
              </p>

              <div
                className={`mt-4 space-y-2 text-xs ${isLight ? "text-slate-600" : "text-white/70"}`}
              >
                <div
                  className={`flex justify-between items-start gap-3 border-b pb-1.5 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className={isLight ? "text-slate-400 shrink-0" : "text-white/40 shrink-0"}>
                    Laptop Model
                  </span>
                  <span
                    className={`font-semibold text-right break-words min-w-0 max-w-[60%] sm:max-w-none ${isLight ? "text-slate-800" : "text-white"}`}
                  >
                    ASUS Vivobook 15 (2025)
                  </span>
                </div>
                <div
                  className={`flex justify-between items-start gap-3 border-b pb-1.5 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className={isLight ? "text-slate-400 shrink-0" : "text-white/40 shrink-0"}>
                    Processor
                  </span>
                  <span
                    className={`font-semibold text-right break-words min-w-0 max-w-[60%] sm:max-w-none ${isLight ? "text-slate-800" : "text-white"}`}
                  >
                    Intel Core i3-1315U
                  </span>
                </div>
                <div
                  className={`flex justify-between items-start gap-3 border-b pb-1.5 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className={isLight ? "text-slate-400 shrink-0" : "text-white/40 shrink-0"}>
                    Graphics
                  </span>
                  <span
                    className={`font-semibold text-right break-words min-w-0 max-w-[60%] sm:max-w-none ${isLight ? "text-slate-800" : "text-white"}`}
                  >
                    Intel UHD Graphics
                  </span>
                </div>
                <div
                  className={`flex justify-between items-start gap-3 border-b pb-1.5 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className={isLight ? "text-slate-400 shrink-0" : "text-white/40 shrink-0"}>
                    Memory
                  </span>
                  <span
                    className={`font-semibold text-right break-words min-w-0 max-w-[60%] sm:max-w-none ${isLight ? "text-slate-800" : "text-white"}`}
                  >
                    8GB DDR4 RAM
                  </span>
                </div>
                <div
                  className={`flex justify-between items-start gap-3 border-b pb-1.5 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className={isLight ? "text-slate-400 shrink-0" : "text-white/40 shrink-0"}>
                    Storage
                  </span>
                  <span
                    className={`font-semibold text-right break-words min-w-0 max-w-[60%] sm:max-w-none ${isLight ? "text-slate-800" : "text-white"}`}
                  >
                    512GB PCIe NVMe SSD
                  </span>
                </div>
                <div
                  className={`flex justify-between items-start gap-3 border-b pb-1.5 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className={isLight ? "text-slate-400 shrink-0" : "text-white/40 shrink-0"}>
                    Kbd & Mouse
                  </span>
                  <span
                    className={`font-semibold text-right break-words min-w-0 max-w-[60%] sm:max-w-none ${isLight ? "text-slate-800" : "text-white"}`}
                  >
                    Ant Esports White Combo
                  </span>
                </div>
                <div
                  className={`flex justify-between items-start gap-3 border-b pb-1.5 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className={isLight ? "text-slate-400 shrink-0" : "text-white/40 shrink-0"}>
                    Mobile
                  </span>
                  <span
                    className={`font-semibold text-right break-words min-w-0 max-w-[60%] sm:max-w-none ${isLight ? "text-slate-800" : "text-white"}`}
                  >
                    Poco C55
                  </span>
                </div>
                <div
                  className={`flex justify-between items-start gap-3 border-b pb-1.5 ${isLight ? "border-slate-100" : "border-white/5"}`}
                >
                  <span className={isLight ? "text-slate-400 shrink-0" : "text-white/40 shrink-0"}>
                    Headset
                  </span>
                  <span
                    className={`font-semibold text-right break-words min-w-0 max-w-[60%] sm:max-w-none ${isLight ? "text-slate-800" : "text-white"}`}
                  >
                    Cosmic Byte Headphone
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[oklch(0.75_0.19_25)] block">
                Purchase Gear / Links
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                <a
                  href="https://amzn.in/d/0hdJwtY6"
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1.5 rounded-lg py-1.5 px-2.5 text-[10px] font-bold transition w-full min-w-0 group border ${
                    isLight
                      ? "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  <ShoppingCart
                    className={`h-3 w-3 shrink-0 text-white/40 transition group-hover:text-white ${isLight ? "group-hover:text-slate-800 text-slate-400" : ""}`}
                  />
                  <span className="truncate">Vivobook Laptop</span>
                </a>
                <a
                  href="https://dl.flipkart.com/dl/ant-esports-mk1700-membrane-usb-a-connection-quiet-keystrokes-12-multimedia-function-keys-wired-usb-standard-gaming-keyboard-compatible-desktop-laptop-mac-mode-multimedia-keys-ant-mk-1700-with-backlit-rgb-led/p/itm82786e1229a0c?pid=ACCGUHYQRDTSQPGD&lid=LSTACCGUHYQRDTSQPGDEGEWAF&marketplace=FLIPKART&q=ant+esports+keyboard&store=6bo/tia&srno=s_1_3&otracker=AS_QueryStore_OrganicAutoSuggest_1_6_na_na_na&otracker1=AS_QueryStore_OrganicAutoSuggest_1_6_na_na_na&fm=search-autosuggest&iid=f109df3c-a439-4eb6-89d1-e248e8a86d3d.ACCGUHYQRDTSQPGD.SEARCH&ppt=sp&ppn=sp&ssid=w1ia5ajg3k0000001783952434894&qH=4f107b6efda68308&ov_redirect=true&ov_redirect=true&_refId=&_appId=MR"
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1.5 rounded-lg py-1.5 px-2.5 text-[10px] font-bold transition w-full min-w-0 group border ${
                    isLight
                      ? "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  <ShoppingCart
                    className={`h-3 w-3 shrink-0 text-white/40 transition group-hover:text-white ${isLight ? "group-hover:text-slate-800 text-slate-400" : ""}`}
                  />
                  <span className="truncate">Ant Esports Combo</span>
                </a>
                <a
                  href="https://dl.flipkart.com/dl/poco-c55-cool-blue-64-gb/p/itm166c52f5d5dc0?pid=MOBGMXSW55C7ZJE7&lid=LSTMOBGMXSW55C7ZJE7G16NBG&_refId=&_appId=CL"
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1.5 rounded-lg py-1.5 px-2.5 text-[10px] font-bold transition w-full min-w-0 group border ${
                    isLight
                      ? "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  <ShoppingCart
                    className={`h-3 w-3 shrink-0 text-white/40 transition group-hover:text-white ${isLight ? "group-hover:text-slate-800 text-slate-400" : ""}`}
                  />
                  <span className="truncate">Poco C55 Mobile</span>
                </a>
                <a
                  href="https://amzn.in/d/0ewi7wPB"
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1.5 rounded-lg py-1.5 px-2.5 text-[10px] font-bold transition w-full min-w-0 group border ${
                    isLight
                      ? "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  <ShoppingCart
                    className={`h-3 w-3 shrink-0 text-white/40 transition group-hover:text-white ${isLight ? "group-hover:text-slate-800 text-slate-400" : ""}`}
                  />
                  <span className="truncate">Cosmic Byte Headphone</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIALS */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div
          className={`rounded-3xl p-10 text-center ${
            isLight
              ? "bg-gradient-to-br from-[oklch(0.94_0.02_25)] to-[oklch(0.97_0.01_260)] border border-slate-200/60 shadow-sm"
              : "bg-gradient-to-br from-[oklch(0.25_0.15_25)] to-[oklch(0.15_0.08_280)]"
          }`}
        >
          <h2 className={`text-3xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
            Connect with SodaCraftTamil
          </h2>
          <p className={`mt-2 ${isLight ? "text-slate-600" : "text-white/60"}`}>
            Follow across all platforms for daily updates
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {SOCIALS.map((s) => {
              const isBlank = !s.href || s.href.trim() === "" || s.href === "#";
              return (
                <a
                  key={s.label}
                  href={isBlank ? "#" : s.href}
                  target={isBlank ? undefined : "_blank"}
                  rel={isBlank ? undefined : "noreferrer"}
                  onClick={(e) => {
                    if (isBlank) {
                      e.preventDefault();
                      toast.error(`${s.label} is not available yet!`, {
                        description: "Check back later for updates.",
                        duration: 3000,
                      });
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium backdrop-blur transition ${
                    isLight
                      ? "bg-slate-200/80 hover:bg-slate-300 text-slate-800 animate-none"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  <svg
                    className={`h-4 w-4 ${isLight ? "fill-slate-800" : "fill-white"}`}
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d={s.icon} />
                  </svg>
                  {s.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* MARQUEE FOOTER BAND */}
        <div
          className={`mt-20 -mx-6 border-y py-5 backdrop-blur-sm overflow-hidden ${
            isLight ? "border-slate-200 bg-slate-100" : "border-white/5 bg-black/30"
          }`}
        >
          <div className="relative flex w-full overflow-x-hidden">
            <div className="animate-marquee whitespace-nowrap flex gap-8 text-sm sm:text-base font-black uppercase tracking-widest select-none">
              {Array(15)
                .fill(null)
                .map((_, i) => (
                  <span key={`m1-${i}`} className="flex items-center gap-8">
                    <span className="bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 bg-clip-text text-transparent">
                      SodaCraftTamil
                    </span>{" "}
                    <img
                      src={channel.thumbnail}
                      alt="Logo"
                      className={`h-5 w-5 rounded-full object-cover shrink-0 border ${
                        isLight ? "border-slate-300" : "border-white/10"
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  </span>
                ))}
              {Array(15)
                .fill(null)
                .map((_, i) => (
                  <span key={`m2-${i}`} className="flex items-center gap-8">
                    <span className="bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 bg-clip-text text-transparent">
                      SodaCraftTamil
                    </span>{" "}
                    <img
                      src={channel.thumbnail}
                      alt="Logo"
                      className={`h-5 w-5 rounded-full object-cover shrink-0 border ${
                        isLight ? "border-slate-300" : "border-white/10"
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  </span>
                ))}
            </div>
          </div>
        </div>

        <footer
          className={`mt-8 text-center text-xs font-medium tracking-wide ${
            isLight ? "text-slate-400" : "text-white/30"
          }`}
        >
          © {new Date().getFullYear()} SodaCraftTamil. All rights reserved.
        </footer>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  isLight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  isLight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 ring-1 backdrop-blur transition ${
        highlight
          ? "bg-gradient-to-br from-[oklch(0.35_0.2_25)] to-[oklch(0.25_0.15_15)] ring-[oklch(0.65_0.24_25)]/50"
          : isLight
            ? "bg-white border border-slate-200 shadow-sm ring-slate-100 text-slate-800"
            : "bg-white/5 ring-white/10 text-white"
      }`}
    >
      <div
        className={`text-xs font-medium uppercase tracking-widest ${isLight && !highlight ? "text-slate-500" : "text-white/60"}`}
      >
        {label}
      </div>
      <div
        className={`mt-2 text-4xl sm:text-5xl font-black tabular-nums ${isLight && !highlight ? "text-slate-900" : "text-white"}`}
      >
        <AnimatedCounter value={value} highlight={highlight} isLight={isLight} />
      </div>
    </div>
  );
}
