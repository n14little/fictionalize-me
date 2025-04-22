import { NextRequest, NextResponse } from 'next/server';
import { featureService } from '../../../../lib/services/featureService';

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
    const { name, enabled } = body;
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Feature name is required' },
        { status: 400 }
      );
    }
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Enabled flag must be a boolean' },
        { status: 400 }
      );
    }
    
    const feature = await featureService.toggleFeature(name, enabled);
    
    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: `Feature '${name}' ${enabled ? 'enabled' : 'disabled'} successfully`,
      feature
    });
  } catch (error) {
    console.error('Feature toggle error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle feature' },
      { status: 500 }
    );
  }
}