import { NextRequest, NextResponse } from 'next/server';
import { waitlistService } from '../../../lib/services/waitlistService';
import { featureService } from '../../../lib/services/featureService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, interest } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      );
    }

    // Add to waitlist
    const entry = await waitlistService.addToWaitlist(email, interest);
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Failed to add to waitlist' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Successfully added to waitlist', entry },
      { status: 201 }
    );
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: 'Failed to process waitlist request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if admin features are enabled
    const adminEnabled = await featureService.isEnabled('enable_admin');
    
    if (!adminEnabled) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }
    
    const entries = await waitlistService.getAllEntries();
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Waitlist retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve waitlist entries' },
      { status: 500 }
    );
  }
}