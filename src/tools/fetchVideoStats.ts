import { createTool } from "@voltagent/core";
import { z } from "zod";
import { google } from "googleapis";
import * as dotenv from "dotenv";
dotenv.config();
const API_KEY = process.env.YOUTUBE_API_KEY;

interface VideoAnalytics {
  basicStats: {
    views: string | undefined;
    likes: string | undefined;
    comments: string | undefined;
    averageViewDuration: string | undefined;
    estimatedMinutesWatched: string | undefined;
  };
  retentionMetrics: {
    averageViewPercentage: string | undefined;
    audienceRetention: string | undefined;
    viewerRetention: string | undefined;
  };
  engagementMetrics: {
    engagementRate: string | undefined;
    peakConcurrentViewers: string | undefined;
    subscribersGained: string | undefined;
    shareCount: string | undefined;
  };
  demographicData: {
    topCountries: string[] | undefined;
    ageGroups: string[] | undefined;
    genderDistribution: string | undefined;
  };
}

export const fetchVideoStatsTool = createTool({
  name: "fetchVideoStats",
  description: "Fetches detailed analytics for a specific YouTube video",
  parameters: z.object({
    videoId: z.string().describe("The ID of the video to analyze"),
  }),
  execute: async (args): Promise<VideoAnalytics> => {
    try {
      const youtube = google.youtube({
        version: "v3",
        auth: API_KEY,
      });

      // Get basic video statistics
      const videoResponse = await youtube.videos.list({
        id: [args.videoId],
        part: ["statistics", "contentDetails"],
      });

      const video = videoResponse.data.items?.[0];
      if (!video) throw new Error("Video not found");

      // Note: For advanced analytics, you would need:
      // 1. OAuth2 authentication as the channel owner
      // 2. YouTube Analytics API access
      // 3. Additional permissions and API calls

      return {
        basicStats: {
          views: video.statistics?.viewCount ?? undefined,
          likes: video.statistics?.likeCount ?? undefined,
          comments: video.statistics?.commentCount ?? undefined,
          averageViewDuration: "Requires YouTube Analytics API",
          estimatedMinutesWatched: "Requires YouTube Analytics API",
        },
        retentionMetrics: {
          averageViewPercentage: "Requires YouTube Analytics API",
          audienceRetention: "Requires YouTube Analytics API",
          viewerRetention: "Requires YouTube Analytics API",
        },
        engagementMetrics: {
          engagementRate: calculateEngagementRate(video.statistics),
          peakConcurrentViewers: "Requires YouTube Analytics API",
          subscribersGained: "Requires YouTube Analytics API",
          shareCount: "Requires YouTube Analytics API",
        },
        demographicData: {
          topCountries: ["Requires YouTube Analytics API"],
          ageGroups: ["Requires YouTube Analytics API"],
          genderDistribution: "Requires YouTube Analytics API",
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch video statistics: ${error.message}`);
      }
      throw new Error("An unknown error occurred");
    }
  },
});

// Helper function to calculate engagement rate
function calculateEngagementRate(statistics: any): string {
  if (!statistics?.viewCount) return "0%";

  const views = parseInt(statistics.viewCount);
  const likes = parseInt(statistics.likeCount || "0");
  const comments = parseInt(statistics.commentCount || "0");

  const engagementRate = ((likes + comments) / views) * 100;
  return `${engagementRate.toFixed(2)}%`;
}
