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

export const searchVideoByTitleTool = createTool({
  name: "searchVideoByTitle",
  description: "Searches for a video by title in a YouTube channel and returns its details",
  parameters: z.object({
    channelId: z.string().describe("The YouTube channel ID to search in"),
    title: z.string().describe("The title of the video to search for")
  }),
  execute: async (args): Promise<VideoDetails> => {
    try {
      const youtube = google.youtube({
        version: "v3",
        auth: API_KEY,
      });

      // 1. Search for video by title in channel
      const searchResponse = await youtube.search.list({
        channelId: args.channelId,
        maxResults: 1,
        q: args.title,
        part: ["id"],
        type: ["video"],
      });

      const videoId = searchResponse.data.items?.[0]?.id?.videoId;
      if (!videoId) throw new Error("No video found with that title");

      // 2. Get video details
      const videoResponse = await youtube.videos.list({
        id: [videoId],
        part: ["snippet", "contentDetails", "statistics"],
      });

      const video = videoResponse.data.items?.[0];
      if (!video) throw new Error("Video details not found");

      // 3. Get video comments
      const commentsResponse = await youtube.commentThreads.list({
        videoId: videoId,
        part: ["snippet"],
        maxResults: 10,
      });

      const comments: Comment[] = commentsResponse.data.items?.map((item) => ({
        author: item.snippet?.topLevelComment?.snippet?.authorDisplayName ?? undefined,
        text: item.snippet?.topLevelComment?.snippet?.textDisplay ?? undefined,
      })) || [];

      return {
        title: video.snippet?.title ?? undefined,
        duration: video.contentDetails?.duration ?? undefined,
        description: video.snippet?.description ?? undefined,
        comments,
        likes: video.statistics?.likeCount ?? undefined,
        views: video.statistics?.viewCount ?? undefined,
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
