import { NextRequest, NextResponse } from 'next/server';
import { journalEntryService } from '../../../../../lib/services/journalEntryService';
import { authService } from '../../../../../lib/services/authService';

interface RouteParams {
  params: {
    id: string; // journal ID
  };
}

// Get all entries for a journal
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params; // journal ID
    
    // Get user from auth service
    const user = await authService.getCurrentUser();
    
    // Get journal entries (service handles access control)
    const entries = await journalEntryService.getJournalEntries(id, user?.id);
    
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Journal entries retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve journal entries' },
      { status: 500 }
    );
  }
}

// Create a new journal entry
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params; // journal ID
    
    // Get user from auth service
    const user = await authService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { title, content, mood, location } = body;
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Entry title is required' },
        { status: 400 }
      );
    }
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Entry content is required' },
        { status: 400 }
      );
    }
    
    const entry = await journalEntryService.createJournalEntry(user.id, {
      journal_id: id,
      title,
      content,
      mood,
      location
    });
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Journal not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Journal entry created successfully', entry },
      { status: 201 }
    );
  } catch (error) {
    console.error('Journal entry creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create journal entry' },
      { status: 500 }
    );
  }
}