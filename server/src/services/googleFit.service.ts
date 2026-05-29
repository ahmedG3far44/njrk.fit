import User from '../models/user.model';
import { env } from '../configs/env';

interface DailyStepEntry {
  date: string;
  steps: number;
}

export interface GetWeeklyStepsResult {
  connected: boolean;
  steps: DailyStepEntry[];
  avgSteps: number;
  refreshedAccessToken?: string;
}

async function refreshGoogleToken(userId: string): Promise<{ accessToken: string; expiresIn: number }> {
  const user = await User.findById(userId).select('+googleRefreshToken');
  if (!user?.googleRefreshToken) {
    throw new Error('No Google refresh token available');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      refresh_token: user.googleRefreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Google token refresh error:', data);
    throw new Error('Failed to refresh Google access token');
  }

  const expiresIn = data.expires_in || 3600;
  await User.findByIdAndUpdate(userId, {
    $set: { googleTokenExpiry: new Date(Date.now() + expiresIn * 1000) },
  });

  return { accessToken: data.access_token, expiresIn };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function processBuckets(buckets: any[]): DailyStepEntry[] {
  return buckets.map((bucket: any) => {
    const date = new Date(parseInt(bucket.startTimeMillis));
    const dateStr = WEEKDAYS[date.getUTCDay()];
    const stepCount = bucket.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0;
    return { date: dateStr, steps: stepCount };
  });
}

export async function getWeeklySteps(
  userId: string,
  currentAccessToken: string,
): Promise<GetWeeklyStepsResult> {
  const user = await User.findById(userId).select('+googleRefreshToken');
  if (!user?.googleRefreshToken) {
    return { connected: false, steps: [], avgSteps: 0 };
  }

  let accessToken = currentAccessToken;
  let didRefresh = false;

  if (user.googleTokenExpiry && new Date() > user.googleTokenExpiry) {
    try {
      const refreshed = await refreshGoogleToken(userId);
      accessToken = refreshed.accessToken;
      didRefresh = true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      return { connected: false, steps: [], avgSteps: 0 };
    }
  }

  const now = new Date();
  const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const startDate = new Date(endOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  const callApi = async (token: string) => {
    return fetch('https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startDate.getTime(),
        endTimeMillis: endOfToday.getTime(),
      }),
    });
  };

  let response = await callApi(accessToken);

  if (response.status === 401 && !didRefresh) {
    try {
      const refreshed = await refreshGoogleToken(userId);
      accessToken = refreshed.accessToken;
      didRefresh = true;
      response = await callApi(accessToken);
    } catch (err) {
      console.error('Token refresh on 401 failed:', err);
      return { connected: false, steps: [], avgSteps: 0 };
    }
  }

  if (!response.ok) {
    console.error('Google Fit API error:', response.status, await response.text());
    return { connected: false, steps: [], avgSteps: 0 };
  }

  const data = await response.json();
  const steps = processBuckets(data.bucket || []);
  const avgSteps = steps.length > 0
    ? Math.round(steps.reduce((sum, s) => sum + s.steps, 0) / steps.length)
    : 0;

  return {
    connected: true,
    steps,
    avgSteps,
    refreshedAccessToken: didRefresh ? accessToken : undefined,
  };
}
