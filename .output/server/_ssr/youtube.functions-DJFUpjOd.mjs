import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
import processModule from "node:process";
//#region node_modules/.nitro/vite/services/ssr/assets/youtube.functions-DJFUpjOd.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var HANDLE = "SodaCraftTamil";
async function ytFetch(url, key) {
	const res = await fetch(url);
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`YouTube API ${res.status}: ${body.slice(0, 200)}`);
	}
	return res.json();
}
var MOCK_PAYLOAD = {
	channel: {
		id: "UCmock-sodacrafttamil-id",
		title: "SodaCraftTamil",
		description: "Official portfolio for SodaCraft Tamil. Live subscriber count, latest videos, and social links for the Tamil Minecraft gaming channel.",
		thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
		banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=400&q=80",
		subscribers: "142000",
		views: "18450230",
		videoCount: "420",
		uploadsPlaylistId: "mock-uploads-playlist-id"
	},
	videos: [
		{
			id: "vid1",
			title: "Minecraft Speedrunner vs 3 Hunters IN TAMIL! 🏃‍♂️💨",
			thumbnail: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
			publishedAt: (/* @__PURE__ */ new Date(Date.now() - 36e5 * 4)).toISOString(),
			url: "https://www.youtube.com/watch?v=mock-vid1"
		},
		{
			id: "vid2",
			title: "Building the Ultimate Minecraft Castle - SodaCraft Episode 45 🏰",
			thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
			publishedAt: (/* @__PURE__ */ new Date(Date.now() - 36e5 * 28)).toISOString(),
			url: "https://www.youtube.com/watch?v=mock-vid2"
		},
		{
			id: "vid3",
			title: "How I Survived 100 Days in Hardcore Minecraft (Tamil) 💀☠️",
			thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
			publishedAt: (/* @__PURE__ */ new Date(Date.now() - 36e5 * 24 * 3)).toISOString(),
			url: "https://www.youtube.com/watch?v=mock-vid3"
		},
		{
			id: "vid4",
			title: "SodaCraft Season 2 Server Tour with Subscribers! 🌐✨",
			thumbnail: "https://images.unsplash.com/photo-1553481187-be93c21490a9?auto=format&fit=crop&w=600&q=80",
			publishedAt: (/* @__PURE__ */ new Date(Date.now() - 36e5 * 24 * 7)).toISOString(),
			url: "https://www.youtube.com/watch?v=mock-vid4"
		},
		{
			id: "vid5",
			title: "Can We Find Netherite in 10 Minutes? Minecraft Tamil ⛏️💎",
			thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
			publishedAt: (/* @__PURE__ */ new Date(Date.now() - 36e5 * 24 * 12)).toISOString(),
			url: "https://www.youtube.com/watch?v=mock-vid5"
		},
		{
			id: "vid6",
			title: "Minecraft Secret Base Build Challenge with Friends! 🤫🚪",
			thumbnail: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
			publishedAt: (/* @__PURE__ */ new Date(Date.now() - 36e5 * 24 * 20)).toISOString(),
			url: "https://www.youtube.com/watch?v=mock-vid6"
		}
	],
	live: {
		videoId: "live1",
		title: "🔴 SODA SMP SEASON 2! - LIVE MINECRAFT TAMIL GAMEPLAY & SUBS GOAL",
		thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80",
		url: "https://www.youtube.com/watch?v=mock-live",
		concurrentViewers: "1250",
		publishedAt: (/* @__PURE__ */ new Date(Date.now() - 36e5 * 2)).toISOString()
	},
	fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
};
var getChannel_createServerFn_handler = createServerRpc({
	id: "f39248655e18cb34b4cd6ec7c5678e6e025ad779e1b0b7cf3817c40541bb0754",
	name: "getChannel",
	filename: "src/lib/youtube.functions.ts"
}, (opts) => getChannel.__executeServer(opts));
var getChannel = createServerFn({ method: "GET" }).handler(getChannel_createServerFn_handler, async () => {
	const key = processModule.env.YOUTUBE_API_KEY;
	if (!key) {
		console.warn("YOUTUBE_API_KEY is not configured — falling back to mock data");
		return MOCK_PAYLOAD;
	}
	try {
		const ch = (await ytFetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&forHandle=${HANDLE}&key=${key}`, key)).items?.[0];
		if (!ch) throw new Error("Channel not found");
		const channel = {
			id: ch.id,
			title: ch.snippet.title,
			description: ch.snippet.description,
			thumbnail: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url,
			banner: ch.brandingSettings?.image?.bannerExternalUrl,
			subscribers: ch.statistics.subscriberCount,
			views: ch.statistics.viewCount,
			videoCount: ch.statistics.videoCount,
			uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads
		};
		const videos = ((await ytFetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=9&playlistId=${channel.uploadsPlaylistId}&key=${key}`, key)).items || []).map((it) => {
			const vid = it.snippet.resourceId.videoId;
			const t = it.snippet.thumbnails;
			return {
				id: vid,
				title: it.snippet.title,
				thumbnail: t?.maxres?.url || t?.high?.url || t?.medium?.url || t?.default?.url,
				publishedAt: it.snippet.publishedAt,
				url: `https://www.youtube.com/watch?v=${vid}`
			};
		});
		let live = null;
		try {
			const l = (await ytFetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&eventType=live&type=video&maxResults=1&key=${key}`, key)).items?.[0];
			if (l) {
				const t = l.snippet.thumbnails;
				const videoId = l.id.videoId;
				let concurrentViewers = null;
				try {
					concurrentViewers = (await ytFetch(`https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${key}`, key)).items?.[0]?.liveStreamingDetails?.concurrentViewers ?? null;
				} catch {}
				live = {
					videoId,
					title: l.snippet.title,
					thumbnail: t?.high?.url || t?.medium?.url || t?.default?.url || "",
					url: `https://www.youtube.com/watch?v=${videoId}`,
					concurrentViewers,
					publishedAt: l.snippet.publishedAt
				};
			}
		} catch {}
		return {
			channel,
			videos,
			live,
			fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
	} catch (error) {
		console.error("Failed to fetch YouTube data — falling back to mock data", error);
		return MOCK_PAYLOAD;
	}
});
//#endregion
export { getChannel_createServerFn_handler };
