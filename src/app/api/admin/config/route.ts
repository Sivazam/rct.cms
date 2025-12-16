import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// GET endpoint to retrieve current admin config
export async function GET() {
  try {
    const { stdout } = await execAsync('firebase functions:config:get');
    const config = JSON.parse(stdout);
    
    return NextResponse.json({
      success: true,
      adminMobile: config.admin?.mobile || null,
      fastsmsConfig: {
        hasApiKey: !!config.fastsms?.api_key,
        senderId: config.fastsms?.sender_id || null,
        entityId: config.fastsms?.entity_id || null,
      }
    });
  } catch (error) {
    console.error('Error fetching Firebase config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin config' },
      { status: 500 }
    );
  }
}

// POST endpoint to update admin mobile number
export async function POST(request: NextRequest) {
  try {
    const { adminMobile } = await request.json();
    
    if (!adminMobile) {
      return NextResponse.json(
        { success: false, error: 'Admin mobile number is required' },
        { status: 400 }
      );
    }

    // Validate mobile number format
    const mobileRegex = /^\+91[6-9]\d{9}$/;
    if (!mobileRegex.test(adminMobile)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mobile number format. Must be in format +91XXXXXXXXXX' },
        { status: 400 }
      );
    }

    // Update Firebase config
    const command = `firebase functions:config:set admin.mobile="${adminMobile}"`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('Deploy complete')) {
      console.error('Firebase config update error:', stderr);
      return NextResponse.json(
        { success: false, error: 'Failed to update Firebase config' },
        { status: 500 }
      );
    }

    console.log('Firebase admin mobile updated successfully:', adminMobile);

    return NextResponse.json({
      success: true,
      message: 'Admin mobile number updated successfully in Firebase config',
      adminMobile
    });

  } catch (error) {
    console.error('Error updating admin config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update admin config' },
      { status: 500 }
    );
  }
}