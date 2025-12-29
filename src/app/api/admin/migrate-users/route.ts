import { NextRequest, NextResponse } from 'next/server';
import { migrateUsersToPhoneNumbers, validateMigration, rollbackMigration } from '@/lib/migrateUsers';

// This is an admin-only route for migrating user documents
// Add proper authentication checks in production

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (!action || !['migrate', 'validate', 'rollback'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: migrate, validate, or rollback' },
        { status: 400 }
      );
    }

    console.log(`Admin API: User migration action requested: ${action}`);

    let result;
    
    switch (action) {
      case 'migrate':
        result = await migrateUsersToPhoneNumbers();
        break;
      case 'validate':
        result = await validateMigration();
        break;
      case 'rollback':
        result = await rollbackMigration();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      message: `${action} operation completed`,
      data: result
    });

  } catch (error) {
    console.error('User migration API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

// For security, you might want to add authentication middleware here
// Example:
// import { isAdmin } from '@/lib/auth';
// 
// export async function POST(request: NextRequest) {
//   if (!isAdmin(request)) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }
//   // ... rest of the code
// }