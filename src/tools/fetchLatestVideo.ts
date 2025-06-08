import { createTool } from "@voltagent/core";
import { z } from "zod";
import { google } from "googleapis";
import * as dotenv from "dotenv";
dotenv.config();
const API_KEY = process.env.YOUTUBE_API_KEY;

interface Comment {
  author: string | undefined;
  text: string | undefined;
}

interface VideoDetails {
  title: string | undefined;
  duration: string | undefined;
  description: string | undefined;
  comments: Comment[];
  likes: string | undefined;
  views: string | undefined;
  dislikes: string;
}

export const fetchLatestVideoTool = createTool({
  name: "fetchLatestVideo",
  description: "Fetches the latest video details from a YouTube channel",
  parameters: z.object({
    channelId: z
      .string()
      .describe("The YouTube channel ID to fetch the latest video from"),
  }),
  execute: async (args): Promise<VideoDetails> => {
    try {
      const youtube = google.youtube({
        version: "v3",
        auth: API_KEY,
      });

      // 1. Get latest video ID
      const searchResponse = await youtube.search.list({
        channelId: args.channelId,
        maxResults: 1,
        order: "date",
        part: ["id"],
        type: ["video"],
      });
      console.log("__searchResponse__", searchResponse);
      const videoId = searchResponse.data.items?.[0]?.id?.videoId;
      if (!videoId) throw new Error("No videos found");

      // 2. Get video details
      const videoResponse = await youtube.videos.list({
        id: [videoId],
        part: ["snippet", "contentDetails", "statistics"],
      });
      console.log("__videoResponse__", videoResponse);
      const video = videoResponse.data.items?.[0];
      if (!video) throw new Error("Video details not found");

      // 3. Get video comments
      const commentsResponse = await youtube.commentThreads.list({
        videoId: videoId,
        part: ["snippet"],
        maxResults: 10,
      });
      console.log("__commentsResponse__", commentsResponse);
      const comments: Comment[] =
        commentsResponse.data.items?.map((item) => ({
          author:
            item.snippet?.topLevelComment?.snippet?.authorDisplayName ??
            undefined,
          text:
            item.snippet?.topLevelComment?.snippet?.textDisplay ?? undefined,
        })) || [];
      console.log("__comments__", comments);
      return {
        title: video.snippet?.title || undefined,
        duration: video.contentDetails?.duration || undefined,
        description: video.snippet?.description || undefined,
        comments: comments,
        likes: video.statistics?.likeCount || undefined,
        views: video.statistics?.viewCount || undefined,
        dislikes: "Not available due to YouTube API limitations",
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch video: ${error.message}`);
      }
      throw new Error("An unknown error occurred");
    }
  },
});
