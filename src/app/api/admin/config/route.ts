import { NextRequest, NextResponse } from 'next/server';
import { getAdminSettings, updateHelpDeskMobile } from '@/lib/admin-settings-firestore';

// GET endpoint to retrieve admin settings
export async function GET() {
  try {
    const settings = await getAdminSettings();
    
    return NextResponse.json({
      success: true,
      helpDeskMobile: settings?.helpDeskMobile || '+91 9395133359',
      adminMobile: settings?.adminMobile || '+919014882779',
      updatedAt: settings?.updatedAt
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin settings' },
      { status: 500 }
    );
  }
}

// POST endpoint to update help desk mobile number
export async function POST(request: NextRequest) {
  try {
    const { helpDeskMobile } = await request.json();
    
    if (!helpDeskMobile) {
      return NextResponse.json(
        { success: false, error: 'Help desk mobile number is required' },
        { status: 400 }
      );
    }

    // Validate mobile number format
    const mobileRegex = /^\+91[6-9]\d{9}$/;
    if (!mobileRegex.test(helpDeskMobile)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mobile number format. Must be in format +91XXXXXXXXXX' },
        { status: 400 }
      );
    }

    // Update Firestore
    const success = await updateHelpDeskMobile(helpDeskMobile);

    if (success) {
      console.log('✅ Help desk mobile number updated successfully in Firestore:', helpDeskMobile);
      return NextResponse.json({
        success: true,
        message: 'Help desk mobile number updated successfully',
        helpDeskMobile
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update help desk mobile number' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error updating help desk mobile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update help desk mobile' },
      { status: 500 }
    );
  }
}
