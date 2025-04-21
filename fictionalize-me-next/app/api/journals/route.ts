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
export async function POST(request: NextRequest) {
  try {
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
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Journal title is required' },
        { status: 400 }
      );
    }
    
    const journal = await journalService.createJournal(user.id, {
      title,
      description,
      slug,
      public: isPublic
    });
    
    return NextResponse.json(
      { message: 'Journal created successfully', journal },
      { status: 201 }
    );
  } catch (error) {
    console.error('Journal creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create journal' },
      { status: 500 }
    );
  }
}