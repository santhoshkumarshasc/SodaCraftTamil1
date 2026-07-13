import { createServerFn } from "@tanstack/react-start";

const HANDLE = "SodaCraftTamil";

export type ChannelData = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  banner?: string;
  subscribers: string;
  views: string;
  videoCount: string;
  uploadsPlaylistId: string;
};

export type VideoItem = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
};

export type LiveStream = {
  videoId: string;
  title: string;
  thumbnail: string;
  url: string;
  concurrentViewers: string | null;
  publishedAt?: string;
};

export type ChannelPayload = {
  channel: ChannelData;
  videos: VideoItem[];
  live: LiveStream | null;
  fetchedAt: string;
  error?: string;
};

async function ytFetch(url: string, key: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

const MOCK_PAYLOAD: ChannelPayload = {
  channel: {
    id: "UCmock-sodacrafttamil-id",
    title: "SodaCraftTamil",
    description:
      "Official portfolio for SodaCraft Tamil. Live subscriber count, latest videos, and social links for the Tamil Minecraft gaming channel.",
    thumbnail:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
    banner:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=400&q=80",
    subscribers: "142000",
    views: "18450230",
    videoCount: "420",
    uploadsPlaylistId: "mock-uploads-playlist-id",
  },
  videos: [
    {
      id: "vid1",
      title: "Minecraft Speedrunner vs 3 Hunters IN TAMIL! 🏃‍♂️💨",
      thumbnail:
        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
      publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
      url: "https://www.youtube.com/watch?v=mock-vid1",
    },
    {
      id: "vid2",
      title: "Building the Ultimate Minecraft Castle - SodaCraft Episode 45 🏰",
      thumbnail:
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
      publishedAt: new Date(Date.now() - 3600000 * 28).toISOString(), // 1.2 days ago
      url: "https://www.youtube.com/watch?v=mock-vid2",
    },
    {
      id: "vid3",
      title: "How I Survived 100 Days in Hardcore Minecraft (Tamil) 💀☠️",
      thumbnail:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
      publishedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
      url: "https://www.youtube.com/watch?v=mock-vid3",
    },
    {
      id: "vid4",
      title: "SodaCraft Season 2 Server Tour with Subscribers! 🌐✨",
      thumbnail:
        "https://images.unsplash.com/photo-1553481187-be93c21490a9?auto=format&fit=crop&w=600&q=80",
      publishedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(), // 7 days ago
      url: "https://www.youtube.com/watch?v=mock-vid4",
    },
    {
      id: "vid5",
      title: "Can We Find Netherite in 10 Minutes? Minecraft Tamil ⛏️💎",
      thumbnail:
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
      publishedAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(), // 12 days ago
      url: "https://www.youtube.com/watch?v=mock-vid5",
    },
    {
      id: "vid6",
      title: "Minecraft Secret Base Build Challenge with Friends! 🤫🚪",
      thumbnail:
        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
      publishedAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(), // 20 days ago
      url: "https://www.youtube.com/watch?v=mock-vid6",
    },
  ],
  live: {
    videoId: "live1",
    title: "🔴 SODA SMP SEASON 2! - LIVE MINECRAFT TAMIL GAMEPLAY & SUBS GOAL",
    thumbnail:
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80",
    url: "https://www.youtube.com/watch?v=mock-live",
    concurrentViewers: "1250",
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
  },
  fetchedAt: new Date().toISOString(),
};

interface YTPlaylistItem {
  snippet: {
    resourceId: {
      videoId: string;
    };
    thumbnails?: Record<
      string,
      {
        url: string;
      }
    >;
    title: string;
    publishedAt: string;
  };
}

export const getChannel = createServerFn({ method: "GET" }).handler(
  async (): Promise<ChannelPayload> => {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) {
      console.warn("YOUTUBE_API_KEY is not configured — falling back to mock data");
      return MOCK_PAYLOAD;
    }

    try {
      // 1. Resolve channel by handle
      const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&forHandle=${HANDLE}&key=${key}`;
      const chJson = await ytFetch(chUrl, key);
      const ch = chJson.items?.[0];
      if (!ch) throw new Error("Channel not found");

      const channel: ChannelData = {
        id: ch.id,
        title: ch.snippet.title,
        description: ch.snippet.description,
        thumbnail: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url,
        banner: ch.brandingSettings?.image?.bannerExternalUrl,
        subscribers: ch.statistics.subscriberCount,
        views: ch.statistics.viewCount,
        videoCount: ch.statistics.videoCount,
        uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads,
      };

      // 2. Latest uploads
      const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=9&playlistId=${channel.uploadsPlaylistId}&key=${key}`;
      const plJson = await ytFetch(plUrl, key);
      const videos: VideoItem[] = (plJson.items || []).map((it: YTPlaylistItem) => {
        const vid = it.snippet.resourceId.videoId;
        const t = it.snippet.thumbnails;
        return {
          id: vid,
          title: it.snippet.title,
          thumbnail: t?.maxres?.url || t?.high?.url || t?.medium?.url || t?.default?.url,
          publishedAt: it.snippet.publishedAt,
          url: `https://www.youtube.com/watch?v=${vid}`,
        };
      });

      // 3. Check for active live stream
      let live: LiveStream | null = null;
      try {
        const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&eventType=live&type=video&maxResults=1&key=${key}`;
        const liveJson = await ytFetch(liveUrl, key);
        const l = liveJson.items?.[0];
        if (l) {
          const t = l.snippet.thumbnails;
          const videoId = l.id.videoId;
          let concurrentViewers: string | null = null;
          try {
            const vUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${key}`;
            const vJson = await ytFetch(vUrl, key);
            concurrentViewers = vJson.items?.[0]?.liveStreamingDetails?.concurrentViewers ?? null;
          } catch {
            // viewer count is optional
          }
          live = {
            videoId,
            title: l.snippet.title,
            thumbnail: t?.high?.url || t?.medium?.url || t?.default?.url || "",
            url: `https://www.youtube.com/watch?v=${videoId}`,
            concurrentViewers,
            publishedAt: l.snippet.publishedAt,
          };
        }
      } catch {
        // Live check is non-critical; ignore failures
      }

      return { channel, videos, live, fetchedAt: new Date().toISOString() };
    } catch (error) {
      console.error("Failed to fetch YouTube data — falling back to mock data", error);
      return MOCK_PAYLOAD;
    }
  },
);
