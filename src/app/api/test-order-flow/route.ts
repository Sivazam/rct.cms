import { NextRequest, NextResponse } from 'next/server';
import { testOrderFlow, testMigration } from '@/lib/testOrderFlow';
import { isUserAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const isAuthenticated = isUserAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check which test to run
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'order-flow';

    console.log(`Test API called - test type: ${testType}`);

    let result;
    if (testType === 'migration') {
      result = await testMigration();
    } else {
      result = await testOrderFlow();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const isAuthenticated = isUserAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Test API POST called - running order flow test');

    const result = await testOrderFlow();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}