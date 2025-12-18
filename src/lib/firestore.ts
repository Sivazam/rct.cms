import { db } from '@/lib/firebase';
import { collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

// Export the db instance for use in other modules
export { db };

// Location Management
export const addLocation = async (locationData: {
  venueName: string;
  address: string;
  contactNumber?: string;
  createdBy: string;
}) => {
  try {
    const docRef = await addDoc(collection(db, 'locations'), {
      ...locationData,
      isActive: true,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding location:', error);
    throw error;
  }
};

export const getLocations = async () => {
  try {
    const q = query(collection(db, 'locations'));
    const querySnapshot = await getDocs(q);
    const locations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort manually to avoid orderBy index requirements
    locations.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime(); // desc order
    });
    
    return locations;
  } catch (error) {
    console.error('Error getting locations:', error);
    throw error;
  }
};

export const updateLocation = async (locationId: string, updateData: any) => {
  try {
    await updateDoc(doc(db, 'locations', locationId), updateData);
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

export const deleteLocation = async (locationId: string) => {
  try {
    await deleteDoc(doc(db, 'locations', locationId));
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
};

// User Management - simplified to avoid index requirements
export const getUsers = async (role?: string, isActive?: boolean) => {
  try {
    console.log('getUsers called with:', { role, isActive });
    
    let querySnapshot;
    
    if (role && isActive !== undefined) {
      // Use a simpler query approach to avoid composite index requirements
      const q = query(
        collection(db, 'users'), 
        where('role', '==', role),
        where('isActive', '==', isActive)
      );
      querySnapshot = await getDocs(q);
    } else if (role) {
      const q = query(collection(db, 'users'), where('role', '==', role));
      querySnapshot = await getDocs(q);
    } else if (isActive !== undefined) {
      const q = query(collection(db, 'users'), where('isActive', '==', isActive));
      querySnapshot = await getDocs(q);
    } else {
      const q = query(collection(db, 'users'));
      querySnapshot = await getDocs(q);
    }
    
    console.log('Query snapshot size:', querySnapshot.size);
    
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort manually to avoid orderBy index requirements
    users.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime(); // desc order
    });
    
    console.log('Users found:', users);
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

export const getPendingOperators = async () => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'operator'),
      where('isActive', '==', false),
      where('isRejected', '==', false) // Only get operators who are not rejected
    );
    
    const querySnapshot = await getDocs(q);
    const operators = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort manually to avoid orderBy index requirements
    operators.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime(); // desc order
    });
    
    return operators;
  } catch (error) {
    console.error('Error getting pending operators:', error);
    throw error;
  }
};

export const getActiveOperators = async () => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'operator'),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const operators = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort manually to avoid orderBy index requirements
    operators.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime(); // desc order
    });
    
    return operators;
  } catch (error) {
    console.error('Error getting active operators:', error);
    throw error;
  }
};

export const getRejectedOperators = async () => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'operator'),
      where('isRejected', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const operators = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort manually to avoid orderBy index requirements
    operators.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime(); // desc order
    });
    
    return operators;
  } catch (error) {
    console.error('Error getting rejected operators:', error);
    throw error;
  }
};

export const getAdminUser = async () => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'admin'),
      where('isActive', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting admin user:', error);
    throw error;
  }
};

export const approveOperator = async (operatorId: string, locationIds: string[], approvedBy: string) => {
  try {
    await updateDoc(doc(db, 'users', operatorId), {
      isActive: true,
      locationIds: locationIds,
      approvedBy: approvedBy,
      approvedAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
  } catch (error) {
    console.error('Error approving operator:', error);
    throw error;
  }
};

export const rejectOperator = async (operatorId: string, rejectionReason: string) => {
  try {
    await updateDoc(doc(db, 'users', operatorId), {
      isActive: false,
      isRejected: true,
      rejectionReason: rejectionReason,
      rejectedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error rejecting operator:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, updateData: any) => {
  try {
    await updateDoc(doc(db, 'users', userId), updateData);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Customer Management
export const addCustomer = async (customerData: {
  name: string;
  mobile: string;
  city: string;
  additionalDetails?: string;
  createdBy: string;
  locationId: string;
}) => {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

export const getCustomerByMobile = async (mobile: string) => {
  try {
    const q = query(collection(db, 'customers'), where('mobile', '==', mobile));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting customer by mobile:', error);
    throw error;
  }
};

// Entry Management
export const addEntry = async (entryData: {
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerCity?: string;
  deceasedPersonName?: string;
  totalPots?: number; // Direct total pots parameter for new system
  numberOfLockers?: number; // Backward compatibility
  potsPerLocker?: number; // Backward compatibility
  locationId: string;
  operatorId: string;
  paymentMethod: 'cash' | 'upi';
  entryDate?: Date;
}) => {
  try {
    const entryDate = entryData.entryDate || new Date();
    const expiryDate = new Date(entryDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    // Calculate total pots and payment - simplified to single locker per entry
    const totalPots = entryData.totalPots || (entryData.numberOfLockers || 1) * (entryData.potsPerLocker || 1);
    const entryFee = 500; // Fixed ₹500 per entry, not per locker
    
    // Get location details for venue name
    const locations = await getLocations();
    const location = locations.find(loc => loc.id === entryData.locationId);
    const locationName = location?.venueName || 'Unknown Location';
    
    const docRef = await addDoc(collection(db, 'entries'), {
      ...entryData,
      totalPots: totalPots,
      entryDate: entryDate,
      expiryDate: expiryDate,
      status: 'active',
      payments: [{
        amount: entryFee, // Fixed ₹500 per entry
        date: entryDate,
        type: 'entry',
        method: entryData.paymentMethod,
        months: 1,
        lockerCount: 1, // Always 1 locker per entry
        description: `Entry fee for ${totalPots} pots`
      }],
      renewals: [],
      // Track pots per locker for partial dispatches - single locker system
      lockerDetails: [{
        lockerNumber: 1, // Always locker 1
        totalPots: totalPots,
        remainingPots: totalPots, // Initially all pots are remaining
        dispatchedPots: [] // Track which pots have been dispatched
      }],
      // Store location name for SMS notifications
      locationName: locationName,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding entry:', error);
    throw error;
  }
};

// Entry Management - simplified to avoid index requirements
export const getEntries = async (filters?: {
  locationId?: string;
  status?: string;
  operatorId?: string;
  expiringSoon?: boolean;
  needsRenewal?: boolean; // New filter for entries that need renewal (expired)
}) => {
  try {
    console.log('getEntries called with:', filters);
    
    let querySnapshot;
    
    // Build query based on filters - avoid composite indexes
    if (filters?.locationId && filters?.status) {
      const q = query(
        collection(db, 'entries'), 
        where('locationId', '==', filters.locationId),
        where('status', '==', filters.status)
      );
      querySnapshot = await getDocs(q);
    } else if (filters?.locationId) {
      const q = query(collection(db, 'entries'), where('locationId', '==', filters.locationId));
      querySnapshot = await getDocs(q);
    } else if (filters?.status) {
      const q = query(collection(db, 'entries'), where('status', '==', filters.status));
      querySnapshot = await getDocs(q);
    } else if (filters?.operatorId) {
      const q = query(collection(db, 'entries'), where('operatorId', '==', filters.operatorId));
      querySnapshot = await getDocs(q);
    } else {
      const q = query(collection(db, 'entries'));
      querySnapshot = await getDocs(q);
    }
    
    let entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort manually to avoid orderBy index requirements
    entries.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime(); // desc order
    });
    
    console.log('Entries found:', entries.length);
    
    // Filter for expiring soon entries (client-side filter for now)
    if (filters?.expiringSoon) {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      entries = entries.filter(entry => {
        const expiryDate = entry.expiryDate?.toDate();
        return expiryDate && expiryDate <= sevenDaysFromNow && expiryDate > now;
      });
      console.log('Expiring soon entries after filter:', entries.length);
    }
    
    // Filter for entries that need renewal (expired but still active)
    if (filters?.needsRenewal) {
      const now = new Date();
      entries = entries.filter(entry => {
        const expiryDate = entry.expiryDate?.toDate();
        return expiryDate && expiryDate <= now && entry.status === 'active';
      });
      console.log('Entries needing renewal after filter:', entries.length);
    }
    
    return entries;
  } catch (error) {
    console.error('Error getting entries:', error);
    throw error;
  }
};

export const updateEntry = async (entryId: string, updateData: any) => {
  try {
    await updateDoc(doc(db, 'entries', entryId), updateData);
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
};

export const getEntryById = async (entryId: string) => {
  try {
    const entryDoc = await getDoc(doc(db, 'entries', entryId));
    
    if (!entryDoc.exists()) {
      return null;
    }
    
    const entryData = entryDoc.data();
    return {
      id: entryDoc.id,
      ...entryData,
      // Convert Timestamps to Dates for consistency
      entryDate: entryData.entryDate?.toDate(),
      expiryDate: entryData.expiryDate?.toDate(),
      createdAt: entryData.createdAt?.toDate(),
      // Convert arrays of Timestamps if they exist
      payments: entryData.payments?.map((payment: any) => ({
        ...payment,
        date: payment.date?.toDate()
      })) || [],
      renewals: entryData.renewals?.map((renewal: any) => ({
        ...renewal,
        date: renewal.date?.toDate(),
        newExpiryDate: renewal.newExpiryDate?.toDate()
      })) || []
    };
  } catch (error) {
    console.error('Error getting entry by ID:', error);
    throw error;
  }
};

// Partial Dispatch Management
export const partialDispatch = async (entryId: string, dispatchData: {
  lockerNumber: number;
  potsToDispatch: number;
  dispatchReason?: string;
  handoverPersonName?: string;
  handoverPersonMobile?: string;
  paymentMethod?: 'cash' | 'upi';
  paymentAmount?: number;
  dispatchedBy: string;
}) => {
  try {
    const entry = await getEntryById(entryId);
    if (!entry) {
      throw new Error('Entry not found');
    }

    // Get all users to create operator map
    const usersSnapshot = await getDocs(query(collection(db, 'users')));
    const operatorMap = new Map();
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      operatorMap.set(doc.id, userData.name || 'Unknown Operator');
    });

    // Find the specified locker
    const lockerDetail = entry.lockerDetails?.find((locker: any) => locker.lockerNumber === dispatchData.lockerNumber);
    if (!lockerDetail) {
      throw new Error(`Locker ${dispatchData.lockerNumber} not found`);
    }

    // Check if enough pots are available
    if (lockerDetail.remainingPots < dispatchData.potsToDispatch) {
      throw new Error(`Only ${lockerDetail.remainingPots} pots remaining in locker ${dispatchData.lockerNumber}`);
    }

    // Update locker details
    const updatedLockerDetails = entry.lockerDetails?.map((locker: any) => {
      if (locker.lockerNumber === dispatchData.lockerNumber) {
        const totalPots = locker.totalPots || 0;
        const remainingPots = locker.remainingPots || 0;
        const dispatchedPots = locker.dispatchedPots || [];
        
        const dispatchedPotIds = Array.from({ length: dispatchData.potsToDispatch }, (_, i) => 
          `pot-${totalPots - remainingPots + i + 1}`
        );
        
        return {
          ...locker,
          remainingPots: remainingPots - dispatchData.potsToDispatch,
          dispatchedPots: [...dispatchedPots, ...dispatchedPotIds]
        };
      }
      return locker;
    });

    // Calculate total remaining pots across all lockers
    const totalRemainingPots = updatedLockerDetails?.reduce((sum: number, locker: any) => sum + locker.remainingPots, 0) || 0;

    // Create dispatch record
    const dispatchRecord = {
      lockerNumber: dispatchData.lockerNumber,
      potsDispatched: dispatchData.potsToDispatch,
      dispatchDate: new Date(),
      dispatchReason: dispatchData.dispatchReason || 'Partial collection',
      handoverPersonName: dispatchData.handoverPersonName,
      handoverPersonMobile: dispatchData.handoverPersonMobile,
      paymentMethod: dispatchData.paymentMethod,
      paymentAmount: dispatchData.paymentAmount || 0,
      dispatchedBy: dispatchData.dispatchedBy
    };

    // Update entry
    await updateDoc(doc(db, 'entries', entryId), {
      lockerDetails: updatedLockerDetails,
      status: totalRemainingPots === 0 ? 'dispatched' : 'active', // Mark as fully dispatched if no pots remain
      // Only update dispatches field if it exists in the document
      ...(entry.dispatches && { dispatches: [...(entry.dispatches || []), dispatchRecord] }),
      updatedAt: serverTimestamp()
    });

    // Create a separate dispatch record for tracking in "dispatched lockers" section
    const dispatchedLockerRecord = {
      entryId: entryId,
      originalEntryData: {
        customerName: entry.customerName,
        customerMobile: entry.customerMobile,
        customerCity: entry.customerCity || 'Unknown', // Add fallback for undefined
        locationId: entry.locationId,
        locationName: entry.locationName || 'Unknown Location', // Add fallback for undefined
        numberOfLockers: entry.numberOfLockers,
        potsPerLocker: entry.potsPerLocker,
        totalPots: entry.totalPots,
        entryDate: entry.entryDate,
        operatorId: entry.operatorId,
        operatorName: operatorMap.get(entry.operatorId) || entry.operatorName || 'Unknown Operator' // Use operator map
      },
      dispatchInfo: {
        lockerNumber: dispatchData.lockerNumber,
        potsDispatched: dispatchData.potsToDispatch,
        remainingPotsInLocker: updatedLockerDetails.find(ld => ld.lockerNumber === dispatchData.lockerNumber)?.remainingPots || 0,
        totalRemainingPots: totalRemainingPots,
        // NEW: Record pots remaining BEFORE this dispatch for historical accuracy
        potsInLockerBeforeDispatch: lockerDetail.remainingPots || 0,
        dispatchType: totalRemainingPots === 0 ? 'full' : 'partial',
        dispatchDate: new Date(),
        dispatchReason: dispatchData.dispatchReason || 'Partial collection',
        handoverPersonName: dispatchData.handoverPersonName,
        handoverPersonMobile: dispatchData.handoverPersonMobile,
        paymentMethod: dispatchData.paymentMethod || 'cash', // Default to 'cash' if not provided
        paymentAmount: dispatchData.paymentAmount || 0,
        dispatchedBy: dispatchData.dispatchedBy
      }
    };

    // Add to dispatchedLockers collection
    await addDoc(collection(db, 'dispatchedLockers'), dispatchedLockerRecord);

    return {
      success: true,
      totalRemainingPots,
      lockerStatus: totalRemainingPots === 0 ? 'fully_dispatched' : 'partially_dispatched'
    };
  } catch (error) {
    console.error('Error in partial dispatch:', error);
    throw error;
  }
};

// Get Dispatched Lockers Records
export const getDispatchedLockers = async (filters?: {
  locationId?: string;
  dateRange?: { from: Date; to: Date };
}) => {
  try {
    console.log('🔍 [DEBUG] getDispatchedLockers called with filters:', filters);
    
    // Get locations data for mapping
    const locationsSnapshot = await getDocs(query(collection(db, 'locations')));
    const locationMap = new Map();
    locationsSnapshot.docs.forEach(doc => {
      const locationData = doc.data();
      locationMap.set(doc.id, locationData.venueName || 'Unknown Location');
    });
    
    // Get users data for operator mapping
    const usersSnapshot = await getDocs(query(collection(db, 'users')));
    const operatorMap = new Map();
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      operatorMap.set(doc.id, userData.name || 'Unknown Operator');
    });
    
    // Fetch from both collections: 'dispatchedLockers' and 'deliveries'
    const [dispatchedLockersSnapshot, deliveriesSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'dispatchedLockers'))),
      getDocs(query(collection(db, 'deliveries')))
    ]);

    console.log('🔍 [DEBUG] Raw data counts:', {
      dispatchedLockers: dispatchedLockersSnapshot.docs.length,
      deliveries: deliveriesSnapshot.docs.length,
      locations: locationsSnapshot.docs.length,
      operators: usersSnapshot.docs.length
    });

    // Process dispatchedLockers collection data
    const dispatchedLockers = dispatchedLockersSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('🔍 [DEBUG] Processing dispatchedLocker:', { id: doc.id, data });
      return {
        id: doc.id,
        ...data,
        sourceCollection: 'dispatchedLockers'
      };
    });

    // Process deliveries collection data and convert to similar structure
    const deliveries = deliveriesSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('🔍 [DEBUG] Processing delivery:', { id: doc.id, data });
      return {
        id: doc.id,
        sourceCollection: 'deliveries',
        // Keep root level fields for filtering
        locationId: data.locationId || '',
        operatorId: data.operatorId || '',
        amountPaid: data.amountPaid || 0, // Add amountPaid at root level for display logic
        // Create originalEntryData for consistency with proper mapping
        originalEntryData: {
          customerName: data.customerName || '',
          customerMobile: data.customerMobile || '',
          customerCity: data.customerCity || '',
          locationName: locationMap.get(data.locationId) || data.locationName || '',
          locationId: data.locationId || '', // Add locationId for proper filtering
          operatorName: operatorMap.get(data.operatorId) || data.operatorName || '',
          operatorId: data.operatorId || '', // Add operatorId for consistency
          totalPots: data.pots || 0,
          potsPerLocker: data.pots || 0,
          entryDate: data.entryDate || data.createdAt // Add entryDate for consistency
        },
        dispatchInfo: {
          dispatchDate: data.deliveryDate,
          dispatchReason: data.reason || '',
          lockerNumber: 1, // Default for full deliveries
          potsDispatched: data.pots || 0,
          remainingPotsInLocker: 0, // 0 for full deliveries
          // NEW: For full deliveries, all pots were dispatched, so remaining before was equal to total
          potsInLockerBeforeDispatch: data.pots || 0,
          totalRemainingPots: 0,
          dispatchType: 'full',
          handoverPersonName: data.handoverPersonName || '',
          handoverPersonMobile: data.handoverPersonMobile || '',
          // Add payment information
          paymentAmount: data.amountPaid || 0,
          dueAmount: data.dueAmount || 0,
          paymentMethod: 'cash', // Default payment method
          paymentType: data.paymentType || 'free'
        }
      };
    });

    // Combine both datasets
    const allDispatchedItems = [...dispatchedLockers, ...deliveries];
    console.log('🔍 [DEBUG] Combined items before filtering:', allDispatchedItems.length);
    console.log('🔍 [DEBUG] Combined items sample:', allDispatchedItems.slice(0, 2));
    
    // Apply location filter if provided
    let filteredItems = allDispatchedItems;
    if (filters?.locationId) {
      console.log('🔍 [DEBUG] Applying location filter for:', filters.locationId);
      filteredItems = allDispatchedItems.filter(item => {
        // For dispatchedLockers, filter by locationId in originalEntryData
        if (item.sourceCollection === 'dispatchedLockers') {
          const match = item.originalEntryData?.locationId === filters.locationId;
          console.log('🔍 [DEBUG] dispatchedLockers filter:', { 
            itemId: item.id, 
            locationId: item.originalEntryData?.locationId, 
            filterId: filters.locationId, 
            match 
          });
          return match;
        }
        // For deliveries, check both originalEntryData and root level (for backward compatibility)
        if (item.sourceCollection === 'deliveries') {
          const originalDataMatch = item.originalEntryData?.locationId === filters.locationId;
          const rootLevelMatch = item.locationId === filters.locationId; // Check root level as well
          const match = originalDataMatch || rootLevelMatch;
          console.log('🔍 [DEBUG] deliveries filter:', { 
            itemId: item.id, 
            originalLocationId: item.originalEntryData?.locationId,
            rootLocationId: item.locationId,
            filterId: filters.locationId, 
            match 
          });
          return match;
        }
        return false;
      });
    }
    
    // Sort by dispatch date (newest first)
    filteredItems.sort((a, b) => {
      const aTime = a.dispatchInfo?.dispatchDate?.toDate?.() || 
                   new Date(a.dispatchInfo?.dispatchDate) || 
                   new Date(0);
      const bTime = b.dispatchInfo?.dispatchDate?.toDate?.() || 
                   new Date(b.dispatchInfo?.dispatchDate) || 
                   new Date(0);
      return bTime.getTime() - aTime.getTime();
    });
    
    // Apply date range filter if provided
    if (filters?.dateRange) {
      console.log('🔍 [DEBUG] Applying date range filter:', filters.dateRange);
      filteredItems = filteredItems.filter(item => {
        const dispatchDate = item.dispatchInfo?.dispatchDate?.toDate?.() || 
                           new Date(item.dispatchInfo?.dispatchDate) || 
                           new Date(0);
        const inRange = dispatchDate >= filters.dateRange.from && dispatchDate <= filters.dateRange.to;
        console.log('🔍 [DEBUG] Date range filter:', { 
          itemId: item.id, 
          dispatchDate, 
          rangeStart: filters.dateRange.from, 
          rangeEnd: filters.dateRange.to, 
          inRange 
        });
        return inRange;
      });
    }
    
    console.log(`🔍 [DEBUG] Final result: ${filteredItems.length} dispatched items (${dispatchedLockers.length} from dispatchedLockers, ${deliveries.length} from deliveries)`);
    console.log('🔍 [DEBUG] Final result sample:', filteredItems.slice(0, 2));
    
    return filteredItems;
  } catch (error) {
    console.error('Error getting dispatched lockers:', error);
    throw error;
  }
};

// OTP Management
export const generateOTP = async (mobile: string, type: 'renewal' | 'delivery', entryId: string) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    const docRef = await addDoc(collection(db, 'otpVerifications'), {
      mobile,
      otp,
      type,
      entryId,
      generatedAt: serverTimestamp(),
      expiresAt: expiresAt,
      verified: false,
      attempts: 0
    });
    
    return { otpId: docRef.id, otp };
  } catch (error) {
    console.error('Error generating OTP:', error);
    throw error;
  }
};

export const verifyOTP = async (otpId: string, otp: string) => {
  try {
    const otpDoc = await getDoc(doc(db, 'otpVerifications', otpId));
    
    if (!otpDoc.exists()) {
      throw new Error('OTP not found');
    }
    
    const otpData = otpDoc.data();
    
    // Check if OTP is expired
    if (otpData.expiresAt?.toDate() < new Date()) {
      throw new Error('OTP expired');
    }
    
    // Check if OTP is already verified
    if (otpData.verified) {
      throw new Error('OTP already used');
    }
    
    // Check if OTP matches
    if (otpData.otp !== otp) {
      // Increment attempts
      await updateDoc(doc(db, 'otpVerifications', otpId), {
        attempts: (otpData.attempts || 0) + 1
      });
      throw new Error('Invalid OTP');
    }
    
    // Mark OTP as verified
    await updateDoc(doc(db, 'otpVerifications', otpId), {
      verified: true
    });
    
    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// System Stats with Date Range Support
export const getSystemStats = async (locationId?: string, dateRange?: { from: Date; to: Date }) => {
  try {
    console.log('getSystemStats called with:', { locationId, dateRange });
    
    // Get all entries first
    let entries = await getEntries({ locationId });
    
    // Get dispatched lockers from separate collection using unified service
    console.log('🔍 [DEBUG] getSystemStats: About to call getDispatchedLockers with locationId:', locationId);
    const { getUnifiedDispatchRecords } = await import('./unified-dispatch-service');
    const unifiedDispatchRecords = await getUnifiedDispatchRecords({ locationId, dateRange });
    console.log('🔍 [DEBUG] getSystemStats: Received unified dispatch records:', unifiedDispatchRecords.length);
    
    // Calculate statistics from actual entries
    let totalRenewalCollections = 0;
    let totalDeliveryCollections = 0;
    let totalRenewals = 0;
    let totalDeliveries = 0;
    let totalActiveEntries = 0;
    let expiringIn7Days = 0;
    
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    entries.forEach(entry => {
      // Count active entries (ash pots) - only count if within date range or no date range specified
      const entryDate = entry.entryDate?.toDate?.() || entry.createdAt?.toDate?.();
      const isEntryInRange = !dateRange || (entryDate && entryDate >= dateRange.from && entryDate <= dateRange.to);
      
      if (entry.status === 'active' && isEntryInRange) {
        totalActiveEntries += 1;
      }
      
      // Count pending renewals (expired but still active entries)
      if (entry.status === 'active') {
        const expiryDate = entry.expiryDate?.toDate?.() || new Date(entry.expiryDate);
        if (expiryDate <= now && isEntryInRange) {
          totalRenewals += 1; // Count as pending renewal
        }
        
        // Count expiring entries
        if (expiryDate >= now && expiryDate <= sevenDaysFromNow) {
          expiringIn7Days += 1;
        }
      }
      
      // Process payments for collections - include entry and renewal payments ONLY
      // Delivery payments will be handled separately from unified dispatch records to avoid double counting
      if (entry.payments && Array.isArray(entry.payments)) {
        entry.payments.forEach((payment: any) => {
          // Handle both Firestore Timestamp and JavaScript Date
          let paymentDate: Date | null = null;
          if (payment.date) {
            if (typeof payment.date.toDate === 'function') {
              paymentDate = payment.date.toDate();
            } else if (payment.date instanceof Date) {
              paymentDate = payment.date;
            } else {
              paymentDate = new Date(payment.date);
            }
          }
          
          const amount = payment.amount || 0;
          
          // Only count payments within date range if specified
          if (!dateRange || (paymentDate && paymentDate >= dateRange.from && paymentDate <= dateRange.to)) {
            if (payment.type === 'entry') {
              totalRenewalCollections += amount; // Add entry payments to collections
            } else if (payment.type === 'renewal') {
              totalRenewalCollections += amount;
            }
            // NOTE: We deliberately skip 'delivery' payments here to avoid double counting
            // Delivery payments are handled via unified dispatch records below
          }
        });
      }
      
      // Also check if this entry has been dispatched and has a delivery payment
      // If so, we need to ensure we don't count it again from unified dispatch records
      if (entry.status === 'dispatched' && entry.payments && Array.isArray(entry.payments)) {
        const hasDeliveryPayment = entry.payments.some((payment: any) => payment.type === 'delivery');
        if (hasDeliveryPayment) {
          // Mark this entry as having a delivery payment to avoid double counting
          entry._hasDeliveryPayment = true;
        }
      }
    });
    
    // Use unified dispatch records for more accurate delivery counting and revenue
    // But avoid double counting entries that already have delivery payments
    const entriesWithDeliveryPayments = new Set(
      entries.filter(entry => entry._hasDeliveryPayment).map(entry => entry.id)
    );
    
    const deliveryRevenueFromUnified = unifiedDispatchRecords.reduce((sum, record) => {
      const paymentDate = new Date(record.dispatchInfo.dispatchDate);
      const isInDateRange = !dateRange || (paymentDate >= dateRange.from && paymentDate <= dateRange.to);
      
      // Only count if this entry doesn't already have a delivery payment recorded
      const shouldCount = !entriesWithDeliveryPayments.has(record.entryId);
      
      return isInDateRange && shouldCount ? sum + record.dispatchInfo.paymentAmount : sum;
    }, 0);

    // Count unique deliveries from unified records, excluding those already counted
    const uniqueDeliveries = unifiedDispatchRecords.filter(record => {
      const paymentDate = new Date(record.dispatchInfo.dispatchDate);
      const isInDateRange = !dateRange || (paymentDate >= dateRange.from && paymentDate <= dateRange.to);
      const shouldCount = !entriesWithDeliveryPayments.has(record.entryId);
      return isInDateRange && shouldCount;
    }).length;
    
    // Use the more accurate unified data
    totalDeliveries = uniqueDeliveries;
    totalDeliveryCollections = deliveryRevenueFromUnified;
    
    const stats = {
      totalEntries: totalActiveEntries, // This now represents active entries within date range
      totalRenewals: totalRenewals,
      totalDeliveries: totalDeliveries, // Now from unified dispatch records
      currentActive: locationId ? 
        entries.filter(e => e.status === 'active' && e.locationId === locationId).length : 
        entries.filter(e => e.status === 'active').length, // Filter by location if specified
      expiringIn7Days: expiringIn7Days,
      monthlyRevenue: totalRenewalCollections + totalDeliveryCollections, // Total collections
      renewalCollections: totalRenewalCollections,
      deliveryCollections: totalDeliveryCollections,
      lastUpdated: serverTimestamp()
    };
    
    console.log('Calculated stats with unified dispatch data:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting system stats:', error);
    throw error;
  }
};

export const updateSystemStats = async (locationId?: string, updates?: any) => {
  try {
    const statsId = locationId || 'overall';
    await updateDoc(doc(db, 'systemStats', statsId), {
      ...updates,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating system stats:', error);
    throw error;
  }
};

// Operator Performance Tracking
export const getOperatorStats = async (operatorId: string) => {
  try {
    console.log('Getting operator stats for:', operatorId);
    
    // Get all entries for this operator
    const entriesQuery = query(collection(db, 'entries'), where('operatorId', '==', operatorId));
    const entriesSnapshot = await getDocs(entriesQuery);
    const entries = entriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calculate statistics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let totalRevenue = 0;
    let todayRevenue = 0;
    let thisWeekRevenue = 0;
    let thisMonthRevenue = 0;
    let todayEntries = 0;
    let thisWeekEntries = 0;
    let thisMonthEntries = 0;
    let totalRenewals = 0;
    let totalDeliveries = 0;
    
    entries.forEach(entry => {
      // Process payments
      if (entry.payments && Array.isArray(entry.payments)) {
        entry.payments.forEach((payment: any) => {
          // Handle both Firestore Timestamp and JavaScript Date
          let paymentDate: Date | null = null;
          if (payment.date) {
            if (typeof payment.date.toDate === 'function') {
              paymentDate = payment.date.toDate();
            } else if (payment.date instanceof Date) {
              paymentDate = payment.date;
            } else {
              paymentDate = new Date(payment.date);
            }
          }
          
          const amount = payment.amount || 0;
          
          totalRevenue += amount;
          
          if (paymentDate) {
            if (paymentDate >= today) {
              todayRevenue += amount;
              todayEntries += 1;
            }
            if (paymentDate >= weekStart) {
              thisWeekRevenue += amount;
              thisWeekEntries += 1;
            }
            if (paymentDate >= monthStart) {
              thisMonthRevenue += amount;
              thisMonthEntries += 1;
            }
          }
          
          // Count by payment type
          if (payment.type === 'renewal') {
            totalRenewals += 1;
          }
        });
      }
      
      // Count deliveries
      if (entry.status === 'dispatched') {
        totalDeliveries += 1;
      }
    });
    
    const stats = {
      totalEntries: entries.length,
      totalRenewals,
      totalDeliveries,
      totalRevenue,
      todayEntries,
      todayRevenue,
      thisWeekEntries,
      thisWeekRevenue,
      thisMonthEntries,
      thisMonthRevenue
    };
    
    console.log('Operator stats calculated:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting operator stats:', error);
    throw error;
  }
};

export const getOperatorTransactions = async (
  operatorId: string, 
  timeRange: 'today' | 'week' | 'month' | 'custom',
  dateRange?: { from: Date; to: Date }
) => {
  try {
    console.log('Getting operator transactions for:', operatorId, timeRange, dateRange);
    
    // Get all entries for this operator
    const entriesQuery = query(collection(db, 'entries'), where('operatorId', '==', operatorId));
    const entriesSnapshot = await getDocs(entriesQuery);
    const entries = entriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get all deliveries for this operator
    const deliveriesQuery = query(collection(db, 'deliveries'), where('operatorId', '==', operatorId));
    const deliveriesSnapshot = await getDocs(deliveriesQuery);
    const deliveries = deliveriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get location names and operator names for better display
    const locationsSnapshot = await getDocs(collection(db, 'locations'));
    const locationsMap = new Map();
    locationsSnapshot.docs.forEach(doc => {
      locationsMap.set(doc.id, doc.data());
    });
    
    // Get operator names
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersMap = new Map();
    usersSnapshot.docs.forEach(doc => {
      usersMap.set(doc.id, doc.data());
    });
    
    const transactions: any[] = [];
    
    // Calculate date range
    let fromDate: Date, toDate: Date;
    const now = new Date();
    
    switch (timeRange) {
      case 'today':
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        toDate = new Date(fromDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'week':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        toDate = now;
        break;
      case 'month':
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        toDate = now;
        break;
      case 'custom':
        fromDate = dateRange?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        toDate = dateRange?.to || now;
        break;
      default:
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        toDate = now;
    }
    
    // Process each entry's payments as transactions
    entries.forEach(entry => {
      if (entry.payments && Array.isArray(entry.payments)) {
        entry.payments.forEach((payment: any, index: number) => {
          // Handle both Firestore Timestamp and JavaScript Date
          let paymentDate: Date | null = null;
          if (payment.date) {
            if (typeof payment.date.toDate === 'function') {
              paymentDate = payment.date.toDate();
            } else if (payment.date instanceof Date) {
              paymentDate = payment.date;
            } else {
              paymentDate = new Date(payment.date);
            }
          }
          
          // Check if payment is within the specified date range
          if (paymentDate && paymentDate >= fromDate && paymentDate <= toDate) {
            const location = locationsMap.get(entry.locationId);
            
            transactions.push({
              id: `${entry.id}_payment_${index}`,
              type: payment.type || 'entry',
              amount: payment.amount || 0,
              date: paymentDate,
              customerName: entry.customerName || 'Unknown',
              operatorName: usersMap.get(entry.operatorId)?.name || 'Unknown Operator',
              locationName: location?.venueName || 'Unknown Location'
            });
          }
        });
      }
      
      // Also add the entry itself as a transaction
      const entryDate = entry.entryDate?.toDate ? entry.entryDate.toDate() : null;
      if (entryDate && entryDate >= fromDate && entryDate <= toDate) {
        const location = locationsMap.get(entry.locationId);
        
        transactions.push({
          id: entry.id,
          type: 'entry',
          amount: 500, // Default entry amount
          date: entryDate,
          customerName: entry.customerName || 'Unknown',
          operatorName: usersMap.get(entry.operatorId)?.name || 'Unknown Operator',
          locationName: location?.venueName || 'Unknown Location'
        });
      }
    });
    
    // Process deliveries
    deliveries.forEach(delivery => {
      const deliveryDate = delivery.deliveryDate?.toDate ? delivery.deliveryDate.toDate() : null;
      if (deliveryDate && deliveryDate >= fromDate && deliveryDate <= toDate) {
        const location = locationsMap.get(delivery.locationId);
        
        transactions.push({
          id: delivery.id,
          type: 'delivery',
          amount: 0, // Deliveries don't have associated payments
          date: deliveryDate,
          customerName: delivery.customerName || 'Unknown',
          operatorName: usersMap.get(delivery.operatorId)?.name || 'Unknown Operator',
          locationName: location?.venueName || 'Unknown Location'
        });
      }
    });
    
    // Sort transactions by date (newest first)
    transactions.sort((a, b) => {
      const aTime = a.date?.getTime() || 0;
      const bTime = b.date?.getTime() || 0;
      return bTime - aTime;
    });
    
    console.log('Operator transactions found:', transactions.length);
    return transactions;
  } catch (error) {
    console.error('Error getting operator transactions:', error);
    throw error;
  }
};