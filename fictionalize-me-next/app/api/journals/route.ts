import { NextRequest, NextResponse } from 'next/server';
import { journalService } from '../../../lib/services/journalService';
import { authService } from '../../../lib/services/authService';

// Get all journals for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get user from auth service
    const user = await authService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const journals = await journalService.getUserJournals(user.id);
    return NextResponse.json(journals);
  } catch (error) {
    console.error('Journals retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve journals' },
      { status: 500 }
    );
  }
}

// Create a new journal
export async function POST(request: Request) {
  try {
    // Get the current user
    const user = await authService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const { title, description } = await request.json();
    
    // Validate the required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Create the journal
    const journal = await journalService.createJournal({
      title,
      description,
      user_id: user.id
    });
    
    return NextResponse.json(journal);
  } catch (error) {
    console.error('Error creating journal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}