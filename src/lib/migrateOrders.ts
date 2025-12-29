import { firestoreService } from '@/lib/firebase';
import { userService } from '@/lib/services';
import { orderService } from '@/lib/services';
import { standardizeUserId } from '@/lib/userUtils';

/**
 * Migration script to standardize user identification across existing orders
 * This ensures consistency between authentication and order storage systems
 */

export interface MigrationResult {
  success: boolean;
  message: string;
  migratedOrders: number;
  failedOrders: number;
  errors: string[];
}

export async function migrateExistingOrders(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    message: '',
    migratedOrders: 0,
    failedOrders: 0,
    errors: []
  };

  try {
    console.log('Starting order migration process...');

    // Step 1: Get all existing orders
    console.log('Fetching all existing orders...');
    const allOrders = await orderService.getAllOrders();
    console.log(`Found ${allOrders.length} orders to process`);

    // Step 2: Process each order
    const migrationPromises = allOrders.map(async (order) => {
      try {
        console.log(`Processing order ${order.id} with userId: ${order.userId}`);

        // Skip if already properly formatted
        if (order.userId && order.userId.startsWith('+') && /^\+\d+$/.test(order.userId)) {
          console.log(`Order ${order.id} already has proper userId format, skipping`);
          return { orderId: order.id, status: 'skipped', reason: 'Already proper format' };
        }

        // Extract phone number from current userId
        const phoneNumber = extractPhoneNumberFromUserId(order.userId);
        console.log(`Extracted phone number: ${phoneNumber} for order ${order.id}`);

        if (!phoneNumber) {
          console.warn(`Cannot extract phone number from order ${order.id} with userId: ${order.userId}`);
          return { orderId: order.id, status: 'failed', reason: 'Cannot extract phone number' };
        }

        // Standardize the userId
        const standardizedUserId = standardizeUserId(phoneNumber);
        console.log(`Standardized userId for order ${order.id}: ${standardizedUserId}`);

        // Update the order with standardized userId
        await orderService.updateOrder(order.id!, {
          userId: standardizedUserId,
          originalUserId: order.userId // Keep original for reference
        });

        console.log(`Successfully migrated order ${order.id}`);
        return { orderId: order.id, status: 'success', newUserId: standardizedUserId };
      } catch (error) {
        console.error(`Failed to migrate order ${order.id}:`, error);
        return { 
          orderId: order.id, 
          status: 'failed', 
          reason: (error as Error).message || 'Unknown error' 
        };
      }
    });

    // Step 3: Execute all migrations
    const migrationResults = await Promise.all(migrationPromises);

    // Step 4: Aggregate results
    const successful = migrationResults.filter(r => r.status === 'success');
    const failed = migrationResults.filter(r => r.status === 'failed');
    const skipped = migrationResults.filter(r => r.status === 'skipped');

    result.migratedOrders = successful.length;
    result.failedOrders = failed.length;
    result.errors = failed.map(f => `Order ${f.orderId}: ${f.reason}`);

    console.log(`Migration completed:`);
    console.log(`- Successfully migrated: ${successful.length} orders`);
    console.log(`- Failed to migrate: ${failed.length} orders`);
    console.log(`- Skipped: ${skipped.length} orders`);

    if (failed.length > 0) {
      console.warn('Failed migrations:', failed);
    }

    result.success = true;
    result.message = `Migration completed. ${successful.length} orders migrated, ${failed.length} failed, ${skipped.length} skipped.`;

  } catch (error) {
    console.error('Migration failed:', error);
    result.success = false;
    result.message = `Migration failed: ${(error as Error).message}`;
    result.errors.push((error as Error).message);
  }

  return result;
}

/**
 * Extract phone number from various user ID formats
 */
function extractPhoneNumberFromUserId(userId: string): string | null {
  if (!userId) return null;

  // If it's already a phone number, return as-is
  if (userId.startsWith('+') && /^\+\d+$/.test(userId)) {
    return userId;
  }

  // If it's a guest ID with phone number format, extract the phone part
  const guestPhoneMatch = userId.match(/^guest_\d+_(\+\d+)$/);
  if (guestPhoneMatch) {
    return guestPhoneMatch[1];
  }

  // If it's just a phone number without + prefix, try to format it
  if (/^\d+$/.test(userId) && userId.length >= 10) {
    // Assume it's an Indian number and add +91 prefix
    return `+91${userId}`;
  }

  return null;
}

/**
 * Run migration from API endpoint
 */
export async function runMigrationFromAPI(): Promise<MigrationResult> {
  console.log('Running migration from API endpoint...');
  return await migrateExistingOrders();
}

/**
 * Dry run - show what would be migrated without actually changing data
 */
export async function dryRunMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    message: '',
    migratedOrders: 0,
    failedOrders: 0,
    errors: []
  };

  try {
    console.log('Starting migration dry run...');

    // Get all existing orders
    const allOrders = await orderService.getAllOrders();
    console.log(`Found ${allOrders.length} orders to analyze`);

    const analysisResults = allOrders.map((order) => {
      const phoneNumber = extractPhoneNumberFromUserId(order.userId);
      const standardizedUserId = phoneNumber ? standardizeUserId(phoneNumber) : null;
      
      return {
        orderId: order.id,
        currentUserId: order.userId,
        extractedPhone: phoneNumber,
        standardizedUserId: standardizedUserId,
        needsMigration: standardizedUserId !== order.userId
      };
    });

    const needsMigration = analysisResults.filter(r => r.needsMigration);
    const alreadyCorrect = analysisResults.filter(r => !r.needsMigration);

    console.log(`Dry run results:`);
    console.log(`- Orders needing migration: ${needsMigration.length}`);
    console.log(`- Orders already correct: ${alreadyCorrect.length}`);

    if (needsMigration.length > 0) {
      console.log('Orders that would be migrated:');
      needsMigration.forEach(order => {
        console.log(`  Order ${order.orderId}: ${order.currentUserId} -> ${order.standardizedUserId}`);
      });
    }

    result.success = true;
    result.message = `Dry run completed. ${needsMigration.length} orders need migration, ${alreadyCorrect.length} are already correct.`;
    result.migratedOrders = needsMigration.length;

  } catch (error) {
    console.error('Dry run failed:', error);
    result.success = false;
    result.message = `Dry run failed: ${(error as Error).message}`;
    result.errors.push((error as Error).message);
  }

  return result;
}