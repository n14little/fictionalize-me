import type { NextRequest } from 'next/server';
import { cronService } from '@/lib/services/cronService';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  try {
    const result = await cronService.processDailyTasks();

    if (!result.success) {
      console.error('Cron job completed with errors:', result.errors);
      return Response.json(result, { status: 500 });
    }

    return Response.json(result);
  } catch (error) {
    console.error('Cron job failed:', error);
    return new Response('Internal Server Error', {
      status: 500,
    });
  }
}
