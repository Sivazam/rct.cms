import { firestoreService } from '@/lib/firebase';

/**
 * Migration script to update existing user documents
 * This script migrates users from auto-generated document IDs to phone numbers as document IDs
 * 
 * Usage:
 * 1. Run this script once to migrate existing users
 * 2. After migration, all new users will be created with phone numbers as document IDs
 * 3. The script handles edge cases and preserves all user data
 */

interface LegacyUser {
  id: string;
  phoneNumber: string;
  [key: string]: any;
}

export async function migrateUsersToPhoneNumbers(): Promise<{
  success: boolean;
  migrated: number;
  failed: number;
  errors: string[];
  details: any[];
}> {
  const result = {
    success: true,
    migrated: 0,
    failed: 0,
    errors: [] as string[],
    details: [] as any[]
  };

  try {
    console.log('Starting user migration to phone number-based document IDs...');
    
    // Get all existing users
    const allUsers = await firestoreService.getAll('users');
    console.log(`Found ${allUsers.length} users to check for migration`);

    for (const user of allUsers) {
      try {
        console.log(`Processing user: ${user.phoneNumber} (current ID: ${user.id})`);
        
        // Skip if the document ID is already the phone number
        if (user.id === user.phoneNumber) {
          console.log(`User ${user.phoneNumber} already has phone number as document ID, skipping`);
          result.details.push({
            phoneNumber: user.phoneNumber,
            oldId: user.id,
            newId: user.phoneNumber,
            status: 'skipped',
            reason: 'Already uses phone number as ID'
          });
          continue;
        }

        // Check if a document with phone number as ID already exists
        const existingPhoneDoc = await firestoreService.getById('users', user.phoneNumber);
        if (existingPhoneDoc) {
          console.log(`Document with phone number ${user.phoneNumber} already exists, skipping migration`);
          result.details.push({
            phoneNumber: user.phoneNumber,
            oldId: user.id,
            newId: user.phoneNumber,
            status: 'skipped',
            reason: 'Phone number document already exists'
          });
          continue;
        }

        // Create new document with phone number as ID
        console.log(`Creating new document for user ${user.phoneNumber} with phone number as ID`);
        
        // Prepare user data without the old ID
        const { id, ...userData } = user;
        
        // Add migration metadata
        const userDataWithMigration = {
          ...userData,
          migratedAt: new Date().toISOString(),
          previousDocumentId: user.id
        };

        // Create new document with phone number as ID
        await firestoreService.create('users', userDataWithMigration, user.phoneNumber);
        
        // Delete old document
        console.log(`Deleting old document ${user.id} for user ${user.phoneNumber}`);
        await firestoreService.delete('users', user.id);

        result.migrated++;
        result.details.push({
          phoneNumber: user.phoneNumber,
          oldId: user.id,
          newId: user.phoneNumber,
          status: 'migrated',
          timestamp: new Date().toISOString()
        });

        console.log(`Successfully migrated user ${user.phoneNumber} from ID ${user.id} to ${user.phoneNumber}`);

      } catch (userError) {
        console.error(`Failed to migrate user ${user.phoneNumber}:`, userError);
        result.failed++;
        result.errors.push(`Failed to migrate user ${user.phoneNumber}: ${(userError as Error).message}`);
        result.details.push({
          phoneNumber: user.phoneNumber,
          oldId: user.id,
          status: 'failed',
          error: (userError as Error).message,
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`Migration completed: ${result.migrated} migrated, ${result.failed} failed`);
    
    if (result.failed > 0) {
      result.success = false;
      console.warn('Migration completed with errors:', result.errors);
    }

  } catch (error) {
    console.error('Critical error during migration:', error);
    result.success = false;
    result.errors.push(`Critical error: ${(error as Error).message}`);
  }

  return result;
}

/**
 * Validate migration results
 * This function checks if all users now have phone numbers as document IDs
 */
export async function validateMigration(): Promise<{
  success: boolean;
  totalUsers: number;
  correctIds: number;
  incorrectIds: number;
  issues: any[];
}> {
  const result = {
    success: true,
    totalUsers: 0,
    correctIds: 0,
    incorrectIds: 0,
    issues: [] as any[]
  };

  try {
    console.log('Validating user migration...');
    
    const allUsers = await firestoreService.getAll('users');
    result.totalUsers = allUsers.length;

    for (const user of allUsers) {
      if (user.id === user.phoneNumber) {
        result.correctIds++;
      } else {
        result.incorrectIds++;
        result.issues.push({
          phoneNumber: user.phoneNumber,
          currentId: user.id,
          expectedId: user.phoneNumber,
          issue: 'Document ID does not match phone number'
        });
      }
    }

    console.log(`Validation results: ${result.correctIds}/${result.totalUsers} users have correct IDs`);
    
    if (result.incorrectIds > 0) {
      result.success = false;
      console.warn('Validation found issues:', result.issues);
    }

  } catch (error) {
    console.error('Error during validation:', error);
    result.success = false;
  }

  return result;
}

/**
 * Emergency rollback function
 * Use this only if migration causes issues and you need to restore the old state
 */
export async function rollbackMigration(): Promise<{
  success: boolean;
  rollbackCount: number;
  errors: string[];
}> {
  const result = {
    success: true,
    rollbackCount: 0,
    errors: [] as string[]
  };

  try {
    console.log('Starting emergency rollback...');
    
    const allUsers = await firestoreService.getAll('users');
    
    for (const user of allUsers) {
      // Only rollback users that have migration metadata
      if (user.migratedAt && user.previousDocumentId) {
        try {
          console.log(`Rolling back user ${user.phoneNumber} from ${user.id} to ${user.previousDocumentId}`);
          
          // Create document with old ID
          const { migratedAt, previousDocumentId, id, ...userData } = user;
          await firestoreService.create('users', userData, user.previousDocumentId);
          
          // Delete current document
          await firestoreService.delete('users', user.id);
          
          result.rollbackCount++;
          console.log(`Successfully rolled back user ${user.phoneNumber}`);
          
        } catch (rollbackError) {
          console.error(`Failed to rollback user ${user.phoneNumber}:`, rollbackError);
          result.errors.push(`Failed to rollback user ${user.phoneNumber}: ${(rollbackError as Error).message}`);
        }
      }
    }

    console.log(`Rollback completed: ${result.rollbackCount} users rolled back`);
    
    if (result.errors.length > 0) {
      result.success = false;
    }

  } catch (error) {
    console.error('Critical error during rollback:', error);
    result.success = false;
    result.errors.push(`Critical error: ${(error as Error).message}`);
  }

  return result;
}

// Export functions for external use
const migrationFunctions = {
  migrateUsersToPhoneNumbers,
  validateMigration,
  rollbackMigration
};

export default migrationFunctions;