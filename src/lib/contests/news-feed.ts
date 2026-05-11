import { ContestNewsContext, ContestNewsItem, generateContestNewsFeed } from "@/lib/ai/gemini";

export async function getContestNewsFeed(
  contests: ContestNewsContext[],
  maxItems: number = 6
): Promise<ContestNewsItem[]> {
  // Current implementation: AI-assisted curation using user-provided context.
  // Future evolution: swap this layer to merge external trusted feeds/APIs.
  return generateContestNewsFeed(contests, maxItems);
}
