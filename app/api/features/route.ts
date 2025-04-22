import { NextRequest, NextResponse } from 'next/server';
import { featureService } from '../../../lib/services/featureService';
import { authService } from '../../../lib/services/authService';

// GET all features
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
    
    const features = await featureService.getAllFeatures();
    return NextResponse.json(features);
  } catch (error) {
    console.error('Features retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve features' },
      { status: 500 }
    );
  }
}

// POST to create a new feature
export async function POST(request: NextRequest) {
  try {
    // Check if admin features are enabled
    const adminEnabled = await featureService.isEnabled('enable_admin');
    
    if (!adminEnabled) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { name, enabled = false, description } = body;
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Feature name is required' },
        { status: 400 }
      );
    }
    
    const feature = await featureService.createFeature(name, enabled, description);
    
    return NextResponse.json(
      { message: 'Feature created successfully', feature },
      { status: 201 }
    );
  } catch (error) {
    console.error('Feature creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create feature' },
      { status: 500 }
    );
  }
}