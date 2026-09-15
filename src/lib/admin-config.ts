import { useState, useEffect, useCallback } from "react";

export interface SiteSocialLink {
  id: string;
  label: string;
  href: string;
  icon?: string;
  enabled: boolean;
}

export interface AdminSiteConfig {
  // 1. Button toggle (support)
  supportButtonEnabled: boolean;
  supportButtonLabel: string;

  // 2. Link editors
  socialLinks: SiteSocialLink[];
  liveStreamUrl: string;
  subscribeUrl: string;
  latestVideosUrl: string;

  // 3. Amount & Detail
  presetAmounts: number[];
  monthlyGoal: number;
  goalTitle?: string;
  upiId: string;
  payeeName: string;
  whatsappNumber: string;
  supportTitle: string;
  supportSubtitle: string;
  paymentNote: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;

  // Secret passcode
  secretCode: string;
}

export const DEFAULT_ADMIN_CONFIG: AdminSiteConfig = {
  supportButtonEnabled: true,
  supportButtonLabel: "Support",
  socialLinks: [
    {
      id: "sodaputti",
      label: "SodaPuttiGamer",
      href: "https://www.youtube.com/@SodaPuttiGamer",
      enabled: true,
    },
    {
      id: "sodacraft",
      label: "SodaCraftTamil",
      href: "https://www.youtube.com/@SodaCraftTamil",
      enabled: true,
    },
    {
      id: "sodacraft2",
      label: "SodaCraftTamil 2.O",
      href: "https://www.youtube.com/@SodaCraftTamil2.0",
      enabled: true,
    },
    {
      id: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/sodacrafttamil",
      enabled: true,
    },
    {
      id: "discord",
      label: "Discord",
      href: "https://discord.com/invite/XRUkfZnpfv",
      enabled: true,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: "",
      enabled: false,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: "https://whatsapp.com/channel/0029Vb8CgorG8l5L5vc28T1W",
      enabled: true,
    },
    {
      id: "twitter",
      label: "X / Twitter",
      href: "",
      enabled: false,
    },
  ],
  liveStreamUrl: "",
  subscribeUrl: "https://www.youtube.com/@SodaCraftTamil?sub_confirmation=1",
  latestVideosUrl: "https://www.youtube.com/@SodaCraftTamil/videos",
  presetAmounts: [50, 100, 250, 500, 1000],
  monthlyGoal: 15000,
  goalTitle: "Monthly SMP Server & Stream Fund",
  upiId: "santhoshkumarshasc@oksbi",
  payeeName: "SodaCraft Tamil",
  whatsappNumber: "919629123982",
  supportTitle: "Support SodaCraft Tamil",
  supportSubtitle:
    "Fuel next-level Minecraft Tamil adventures, SMP episodes & high-FPS live streams",
  paymentNote: "Support SodaCraft Tamil Gaming",
  razorpayKeyId: "rzp_live_Tc8MHDDnSr3cwl",
  razorpayKeySecret: "42rJlLTF0hJc1exM4t7JOLGY",
  secretCode: "9629",
};

const STORAGE_KEY = "sodacraft_admin_config_v1";
const EVENT_NAME = "sodacraft_config_updated";

export function getAdminConfig(): AdminSiteConfig {
  if (typeof window === "undefined") return DEFAULT_ADMIN_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AdminSiteConfig>;
    return {
      ...DEFAULT_ADMIN_CONFIG,
      ...parsed,
      presetAmounts: Array.isArray(parsed.presetAmounts)
        ? parsed.presetAmounts
        : DEFAULT_ADMIN_CONFIG.presetAmounts,
      socialLinks: Array.isArray(parsed.socialLinks)
        ? parsed.socialLinks
        : DEFAULT_ADMIN_CONFIG.socialLinks,
    };
  } catch (err) {
    console.error("Failed to load admin config:", err);
    return DEFAULT_ADMIN_CONFIG;
  }
}

export function saveAdminConfig(config: AdminSiteConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: config }));
  } catch (err) {
    console.error("Failed to save admin config:", err);
  }
}

export function resetAdminConfig(): AdminSiteConfig {
  saveAdminConfig(DEFAULT_ADMIN_CONFIG);
  return DEFAULT_ADMIN_CONFIG;
}

export function useAdminConfig() {
  const [config, setConfig] = useState<AdminSiteConfig>(DEFAULT_ADMIN_CONFIG);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConfig(getAdminConfig());

    const handleUpdate = () => {
      setConfig(getAdminConfig());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateConfig = useCallback((newConfig: Partial<AdminSiteConfig>) => {
    const current = getAdminConfig();
    const merged = { ...current, ...newConfig };
    saveAdminConfig(merged);
    setConfig(merged);
  }, []);

  return { config, updateConfig, mounted };
}
