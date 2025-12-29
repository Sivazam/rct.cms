import { NextRequest, NextResponse } from 'next/server';
import { migrateExistingOrders, dryRunMigration } from '@/lib/migrateOrders';
import { isUserAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (admin only)
    const isAuthenticated = isUserAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if it's a dry run
    const { searchParams } = new URL(request.url);
    const isDryRun = searchParams.get('dryRun') === 'true';

    console.log(`Migration API called - dry run: ${isDryRun}`);

    let result;
    if (isDryRun) {
      result = await dryRunMigration();
    } else {
      result = await migrateExistingOrders();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated (admin only)
    const isAuthenticated = isUserAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Migration API POST called - running actual migration');

    const result = await migrateExistingOrders();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}