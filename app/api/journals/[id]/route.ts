import { NextRequest, NextResponse } from 'next/server';
import { journalService } from '../../../../lib/services/journalService';
import { authService } from '../../../../lib/services/authService';

interface RouteParams {
  params: {
    id: string;
  };
}

// Get a specific journal by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Get user from auth service
    const user = await authService.getCurrentUser();
    
    // If no user, check if journal is public
    const journal = await journalService.getJournalById(id, user?.id);
    
    if (!journal) {
      return NextResponse.json(
        { error: 'Journal not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(journal);
  } catch (error) {
    console.error('Journal retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve journal' },
      { status: 500 }
    );
  }
}

// Update a journal
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
    const { title, description, slug, public: isPublic } = body;
    
    const updatedJournal = await journalService.updateJournal(id, user.id, {
      title,
      description,
      slug,
      public: isPublic
    });
    
    if (!updatedJournal) {
      return NextResponse.json(
        { error: 'Journal not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Journal updated successfully',
      journal: updatedJournal
    });
  } catch (error) {
    console.error('Journal update error:', error);
    return NextResponse.json(
      { error: 'Failed to update journal' },
      { status: 500 }
    );
  }
}

// Delete a journal
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
    
    const deleted = await journalService.deleteJournal(id, user.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Journal not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Journal deleted successfully'
    });
  } catch (error) {
    console.error('Journal deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete journal' },
      { status: 500 }
    );
  }
}