import BaseService from './baseService.service';
import { TwitterApi } from 'twitter-api-v2';

class XService extends BaseService {
  private lastTweet: Date | null = null;
  private client = new TwitterApi({
    appKey: process.env.API_KEY!,
    appSecret: process.env.API_SECRET!,
    accessToken: process.env.ACCESS_TOKEN!,
    accessSecret: process.env.ACCESS_TOKEN_SECRET!,
  });

  // Function to post to X
  public postToX = async (message: string): Promise<boolean> => {
    const now = new Date();

    // Check if the last tweet was within the last 2 hours
    if (this.lastTweet && now.getTime() - this.lastTweet.getTime() < 2 * 60 * 60 * 1000) {
      console.log('Skipping post: Last tweet was within 2 hours.');
      return false;
    }

    try {
      const response = await this.client.v2.tweet(message);
      console.log('Post successful! Tweet ID:', response.data.id);
      this.lastTweet = now;
      return true;
    } catch (error) {
      console.error('Error posting to X:', error);
      throw error;
    }
  };
}

export default XService;
