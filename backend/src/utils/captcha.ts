import axios from 'axios';

interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
}

export const verifyTurnstile = async (token: string): Promise<boolean> => {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.warn('TURNSTILE_SECRET_KEY not configured, skipping verification');
    return true;
  }

  try {
    const response = await axios.post<TurnstileResponse>(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }
    );

    return response.data.success;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
};
