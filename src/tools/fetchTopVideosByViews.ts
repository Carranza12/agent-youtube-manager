import { createTool } from "@voltagent/core";
import { z } from "zod";
import { google } from "googleapis";
import * as dotenv from "dotenv";
dotenv.config();
const API_KEY = process.env.YOUTUBE_API_KEY;

const SortType = {
  VIEWS: "views",
  LIKES: "likes",
  COMMENTS: "comments",
} as const;

interface TopVideo {
  id: string;
  title: string;
  views: string;
  likes: string;
  comments: string;
  url: string;
  publishedAt: string;
  engagementRate: string;
  thumbnail: string;
}
export const fetchTopVideosTool = createTool({
  name: "fetchTopVideos",
  description:
    "Fetches top videos from a YouTube channel sorted by views, likes, or comments",
  parameters: z.object({
    channelId: z.string().describe("The YouTube channel ID to analyze"),
    sortBy: z
      .enum([SortType.VIEWS, SortType.LIKES, SortType.COMMENTS])
      .describe("Sort videos by: views, likes, or comments"),
    limit: z
      .number()
      .min(1)
      .max(50)
      .describe("Number of videos to return (max 50)"),
  }),
  execute: async (args): Promise<TopVideo[]> => {
    try {
      const youtube = google.youtube({
        version: "v3",
        auth: API_KEY,
      });

      // Get channel's videos
      const searchResponse = await youtube.search.list({
        channelId: args.channelId,
        maxResults: 50, // Maximum allowed by API
        part: ["id", "snippet"],
        type: ["video"],
      });

      if (!searchResponse.data.items?.length) {
        throw new Error("No videos found for this channel");
      }

      // Get detailed stats for each video
      const videoIds = searchResponse.data.items
        .map((item) => item.id?.videoId)
        .filter(Boolean);
      const videoResponse = await youtube.videos.list({
        id: videoIds as string[],
        part: ["statistics", "snippet"],
      });

      if (!videoResponse.data.items?.length) {
        throw new Error("Could not fetch video details");
      }

      // Map and sort videos based on the selected criteria
      const videos: TopVideo[] = videoResponse.data.items
        .map((video) => ({
          id: video.id ?? "",
          title: video.snippet?.title ?? "Untitled",
          views: video.statistics?.viewCount ?? "0",
          likes: video.statistics?.likeCount ?? "0",
          comments: video.statistics?.commentCount ?? "0",
          url: `https://youtube.com/watch?v=${video.id}`,
          publishedAt: video.snippet?.publishedAt ?? "Unknown",
          engagementRate: calculateEngagementRate({
            viewCount: video.statistics?.viewCount,
            likeCount: video.statistics?.likeCount,
            commentCount: video.statistics?.commentCount,
          }),
          thumbnail: video.snippet?.thumbnails?.high?.url ?? "",
        }))
        .sort((a, b) => {
          switch (args.sortBy) {
            case SortType.VIEWS:
              return parseInt(b.views) - parseInt(a.views);
            case SortType.LIKES:
              return parseInt(b.likes) - parseInt(a.likes);
            case SortType.COMMENTS:
              return parseInt(b.comments) - parseInt(a.comments);
            default:
              return parseInt(b.views) - parseInt(a.views);
          }
        })
        .slice(0, args.limit);

      return videos;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch top videos: ${error.message}`);
      }
      throw new Error("An unknown error occurred");
    }
  },
});

function calculateEngagementRate(statistics: any): string {
  if (!statistics?.viewCount) return "0%";
  const views = parseInt(statistics.viewCount);
  const likes = parseInt(statistics.likeCount || "0");
  const comments = parseInt(statistics.commentCount || "0");
  const engagementRate = ((likes + comments) / views) * 100;
  return `${engagementRate.toFixed(2)}%`;
}
