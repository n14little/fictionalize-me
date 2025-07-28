import type { NextRequest } from 'next/server';
import { cronService } from '@/lib/services/cronService';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const dateParam = searchParams.get('date');

    let targetDate: Date | undefined;
    if (dateParam) {
      targetDate = new Date(dateParam);
      if (isNaN(targetDate.getTime())) {
        return new Response('Invalid date format. Use YYYY-MM-DD.', {
          status: 400,
        });
      }
    }

    if (userIdParam) {
      const userId = parseInt(userIdParam, 10);
      if (isNaN(userId)) {
        return new Response('Invalid userId. Must be a number.', {
          status: 400,
        });
      }

      const result = await cronService.processDailyTasksForUser(userId, targetDate);

      if (!result.success) {
        console.error('Cron job completed with errors:', result.errors);
        return Response.json(result, { status: 500 });
      }

      return Response.json(result);
    } else {
      const result = await cronService.processDailyTasks(targetDate);

      if (!result.success) {
        console.error('Cron job completed with errors:', result.errors);
        return Response.json(result, { status: 500 });
      }

      return Response.json(result);
    }
  } catch (error) {
    console.error('Cron job failed:', error);
    return new Response('Internal Server Error', {
      status: 500,
    });
  }
}
