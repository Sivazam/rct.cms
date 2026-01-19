import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { addCustomer, getCustomerByMobile, getLocations, isLockerAvailable } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries, operatorId } = body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid entries data' },
        { status: 400 }
      );
    }

    if (!operatorId) {
      return NextResponse.json(
        { success: false, error: 'Operator ID is required' },
        { status: 400 }
      );
    }

    const results = [];

    // Process each entry
    for (const entryData of entries) {
      try {
        const {
          deceasedPersonName,
          mobile,
          city,
          additionalDetails,
          totalPots,
          paymentMethod,
          entryDate,
          locationName,
          lockerNumber
        } = entryData;

        // Validate required fields
        if (!deceasedPersonName?.trim()) {
          results.push({
            success: false,
            error: 'Deceased person name is required'
          });
          continue;
        }

        if (!mobile?.trim()) {
          results.push({
            success: false,
            error: 'Mobile number is required'
          });
          continue;
        }

        if (!city?.trim()) {
          results.push({
            success: false,
            error: 'City is required'
          });
          continue;
        }

        if (!locationName?.trim()) {
          results.push({
            success: false,
            error: 'Location is required'
          });
          continue;
        }

        if (!lockerNumber || lockerNumber < 1) {
          results.push({
            success: false,
            error: 'Valid locker number is required'
          });
          continue;
        }

        // Parse entry date
        let parsedEntryDate: Date;
        try {
          parsedEntryDate = new Date(entryDate);
          if (isNaN(parsedEntryDate.getTime())) {
            results.push({
              success: false,
              error: 'Invalid entry date'
            });
            continue;
          }
        } catch {
          results.push({
            success: false,
            error: 'Invalid entry date format'
          });
          continue;
        }

        // Find location by name
        const locations = await getLocations();
        const location = locations.find(loc =>
          loc.venueName.toLowerCase() === locationName.toLowerCase().trim()
        );

        if (!location) {
          results.push({
            success: false,
            error: `Location "${locationName}" not found`
          });
          continue;
        }

        // Validate locker availability
        const lockerAvailable = await isLockerAvailable(location.id, lockerNumber);
        if (!lockerAvailable) {
          results.push({
            success: false,
            error: `Locker ${lockerNumber} is already occupied at ${location.venueName}`
          });
          continue;
        }

        // Check if customer exists
        let customerId = await getCustomerByMobile(mobile);
        if (!customerId) {
          // Create new customer
          customerId = await addCustomer({
            name: deceasedPersonName,
            mobile: mobile,
            city: city,
            additionalDetails: additionalDetails,
            createdBy: operatorId,
            locationId: location.id
          });
        }

        // Calculate expiry date (30 days from entry date)
        const expiryDate = new Date(parsedEntryDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Status is always 'active' initially (same as manual entry form)
        // System determines expiration via expiryDate field
        const status = 'active';

        // Calculate entry fee (fixed ₹500)
        const entryFee = 500;

        // Create entry
        const entryDoc = await addDoc(collection(db, 'entries'), {
          customerName: deceasedPersonName,
          customerMobile: mobile,
          customerCity: city,
          deceasedPersonName: deceasedPersonName,
          totalPots: totalPots || 1,
          locationId: location.id,
          operatorId: operatorId,
          paymentMethod: paymentMethod || 'cash',
          entryDate: parsedEntryDate,
          expiryDate: expiryDate,
          status: status,
          payments: [{
            amount: entryFee,
            date: parsedEntryDate,
            type: 'entry',
            method: paymentMethod || 'cash',
            months: 1,
            lockerCount: 1,
            description: `Entry fee for ${totalPots || 1} pots`
          }],
          renewals: [],
          lockerDetails: [{
            lockerNumber: lockerNumber,
            totalPots: totalPots || 1,
            remainingPots: totalPots || 1,
            dispatchedPots: []
          }],
          locationName: location.venueName,
          // Tracking metadata for bulk import (doesn't affect entry functionality)
          source: 'bulk_import',
          importBatchId: `batch_${Date.now()}`,
          createdAt: serverTimestamp()
        });

        results.push({
          success: true,
          entryId: entryDoc.id,
          data: {
            id: entryDoc.id,
            customerName: deceasedPersonName,
            customerMobile: mobile,
            totalPots: totalPots,
            locationName: location.venueName,
            lockerNumber: lockerNumber,
            entryDate: parsedEntryDate,
            expiryDate: expiryDate,
            status: status,
            paymentMethod: paymentMethod
          }
        });
      } catch (error: any) {
        console.error('Error creating bulk entry:', error);
        results.push({
          success: false,
          error: error.message || 'Failed to create entry'
        });
      }
    }

    // Return results
    const successfulCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      total: entries.length,
      successful: successfulCount,
      failed: failedCount,
      results
    });
  } catch (error: any) {
    console.error('Bulk entry creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process bulk entries' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST method to create bulk entries'
  });
}
