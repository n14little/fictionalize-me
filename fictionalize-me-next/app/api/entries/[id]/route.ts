import { NextRequest, NextResponse } from 'next/server';
import { journalEntryService } from '../../../../lib/services/journalEntryService';
import { authService } from '../../../../lib/services/authService';

interface RouteParams {
  params: {
    id: string; // entry ID
  };
}

// Get a specific journal entry by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Get user from auth service
    const user = await authService.getCurrentUser();
    
    // Get journal entry (service handles access control)
    const entry = await journalEntryService.getJournalEntryById(id, user?.id);
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Journal entry retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve journal entry' },
      { status: 500 }
    );
  }
}

// Update a journal entry
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
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
    
    const updatedEntry = await journalEntryService.updateJournalEntry(id, user.id, {
      title,
      content,
      mood,
      location
    });
    
    if (!updatedEntry) {
      return NextResponse.json(
        { error: 'Entry not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Journal entry updated successfully',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Journal entry update error:', error);
    return NextResponse.json(
      { error: 'Failed to update journal entry' },
      { status: 500 }
    );
  }
}

// Delete a journal entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Get user from auth service
    const user = await authService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const deleted = await journalEntryService.deleteJournalEntry(id, user.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Entry not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Journal entry deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete journal entry' },
      { status: 500 }
    );
  }
}