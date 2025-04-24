import { NextRequest, NextResponse } from 'next/server';
import { csrfModule } from '../../../lib/csrf/csrfModule';

/**
 * GET endpoint that returns a new CSRF token and sets it as a cookie
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const response = await csrfModule.generateTokenResponse();
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json({ 
      error: 'Failed to generate CSRF token' 
    }, { status: 500 });
  }
}
