import { db } from '@/lib/firebase';
import { collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

// Export the db instance for use in other modules
export { db };

// Location Management
export const addLocation = async (locationData: {
  venueName: string;
  address: string;
  contactNumber?: string;
  numberOfLockers?: number;
  createdBy: string;
}) => {
  try {
    const docRef = await addDoc(collection(db, 'locations'), {
      ...locationData,
      numberOfLockers: locationData.numberOfLockers || 100,
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
  lockerNumber?: number; // Locker number to assign
}) => {
  try {
    const entryDate = entryData.entryDate || new Date();

    // Validate entry date - prevent backdated entries

    // Calculate expiry date
    const expiryDate = new Date(entryDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Calculate total pots and payment - simplified to single locker per entry
    const totalPots = entryData.totalPots || (entryData.numberOfLockers || 1) * (entryData.potsPerLocker || 1);
    const entryFee = 500; // Fixed ₹500 per entry, not per locker

    // Get location details for venue name
    const locations = await getLocations();
    const location = locations.find(loc => loc.id === entryData.locationId);
    const locationName = location?.venueName || 'Unknown Location';

    // Validate locker number
    const lockerNumber = entryData.lockerNumber || 1;
    if (location) {
      const maxLockers = location.numberOfLockers || 100;
      if (lockerNumber < 1 || lockerNumber > maxLockers) {
        throw new Error(`Locker number must be between 1 and ${maxLockers}`);
      }

      // Check if locker is available
      const isAvailable = await isLockerAvailable(entryData.locationId, lockerNumber);
      if (!isAvailable) {
        throw new Error(`Locker ${lockerNumber} is already occupied at this location. Please select a different locker.`);
      }
    }

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
        lockerNumber: lockerNumber, // Use the provided locker number
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

// Check if a locker is available at a specific location
export const isLockerAvailable = async (locationId: string, lockerNumber: number, excludeEntryId?: string) => {
  try {
    // Get all active entries for this location
    const q = query(
      collection(db, 'entries'),
      where('locationId', '==', locationId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);

    // Check if any active entry has this locker number
    for (const doc of querySnapshot.docs) {
      // Skip the entry if it's the one we're editing (for update scenarios)
      if (excludeEntryId && doc.id === excludeEntryId) {
        continue;
      }

      const entryData = doc.data();
      // Check if this entry has the specified locker number
      if (entryData.lockerDetails) {
        const hasLocker = entryData.lockerDetails.some(
          (locker: any) => locker.lockerNumber === lockerNumber && locker.remainingPots > 0
        );
        if (hasLocker) {
          return false; // Locker is occupied
        }
      }
    }

    return true; // Locker is available
  } catch (error) {
    console.error('Error checking locker availability:', error);
    throw error;
  }
};

// Get all occupied lockers for a location
export const getOccupiedLockers = async (locationId: string) => {
  try {
    const q = query(
      collection(db, 'entries'),
      where('locationId', '==', locationId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);

    const occupiedLockers = new Set<number>();
    querySnapshot.docs.forEach(doc => {
      const entryData = doc.data();
      if (entryData.lockerDetails) {
        entryData.lockerDetails.forEach((locker: any) => {
          if (locker.remainingPots > 0) {
            occupiedLockers.add(locker.lockerNumber);
          }
        });
      }
    });

    return Array.from(occupiedLockers);
  } catch (error) {
    console.error('Error getting occupied lockers:', error);
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

    // Check if entry is expired (pending renewal) vs active
    const now = new Date();
    const expiryDate = entry.expiryDate?.toDate?.() || new Date(entry.expiryDate);
    const isExpired = expiryDate <= now;
    const isPendingRenewal = isExpired && entry.status === 'active';

    // According to business rules:
    // - We collect payments for dispatches only for pending renewals (expired entries)
    // - We do NOT collect payments for dispatches of active lockers
    let actualPaymentAmount = dispatchData.paymentAmount || 0;

    if (!isPendingRenewal && dispatchData.paymentAmount > 0) {
      console.log('⚠️ [partialDispatch] Entry is not expired (pending renewal). Payment cannot be collected.', {
        entryId,
        customerName: entry.customerName,
        expiryDate: expiryDate.toISOString(),
        isExpired,
        status: entry.status
      });
      // Zero out payment amount since entry is active
      actualPaymentAmount = 0;
    }

    if (isPendingRenewal && dispatchData.paymentAmount > 0) {
      console.log('✅ [partialDispatch] Entry is expired (pending renewal). Payment will be collected.', {
        entryId,
        customerName: entry.customerName,
        expiryDate: expiryDate.toISOString(),
        isExpired,
        status: entry.status
      });
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
      paymentAmount: actualPaymentAmount, // Use validated payment amount (only for pending renewals)
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
        paymentAmount: actualPaymentAmount, // Use validated payment amount (only for pending renewals)
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
    
    // Fetch from dispatchedLockers collection only
    // Note: Deliveries are fetched separately in getDeliveriesCollection()
    // to avoid duplicates in getUnifiedDispatchRecords()
    const [dispatchedLockersSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'dispatchedLockers')))
    ]);

    console.log('🔍 [DEBUG] Raw data counts:', {
      dispatchedLockers: dispatchedLockersSnapshot.docs.length,
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

    console.log('🔍 [DEBUG] Total dispatchedLockers:', dispatchedLockers.length);

    // Apply location filter if provided
    let filteredItems = dispatchedLockers;
    if (filters?.locationId) {
      console.log('🔍 [DEBUG] Applying location filter for:', filters.locationId);
      filteredItems = dispatchedLockers.filter(item => {
        // Filter by locationId in originalEntryData
        const match = item.originalEntryData?.locationId === filters.locationId;
        console.log('🔍 [DEBUG] dispatchedLockers filter:', {
          itemId: item.id,
          locationId: item.originalEntryData?.locationId,
          filterId: filters.locationId,
          match
        });
        return match;
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
    
    console.log(`🔍 [DEBUG] Final result: ${filteredItems.length} dispatched items (from dispatchedLockers collection)`);
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
    
    // Helper function to check if entry date is backdated (before today)
    const isEntryDateBackdated = (entryDate: Date) => {
      const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
      const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return entryDateOnly < todayOnly;
    };
    
    entries.forEach(entry => {
      // Get entry date and check if backdated
      const entryDate = entry.entryDate?.toDate?.() || entry.createdAt?.toDate?.();
      const isBackdated = entryDate && isEntryDateBackdated(entryDate);
      
      // Count active entries (ash pots) - only count valid entries (not backdated)
      const isEntryInRange = !dateRange || (entryDate && entryDate >= dateRange.from && entryDate <= dateRange.to);

      // Don't skip backdated entries entirely - just exclude them from counts
      // Their payments should still be counted in revenue calculations
      // Skip backdated entries from active and renewal counts only
      // if (isBackdated && entry.status === 'active') {
      //   console.log('⚠️ [getSystemStats] Skipping backdated entry:', {
      //     id: entry.id,
      //     customerName: entry.customerName,
      //     entryDate: entryDate,
      //     status: entry.status
      //   });
      //   return; // Skip this entry entirely
      // }

      if (entry.status === 'active' && isEntryInRange && !isBackdated) {
        totalActiveEntries += 1;
      }

      // Count pending renewals (expired but still active entries)
      // Skip backdated entries from renewal count as they are already expired
      if (entry.status === 'active' && !isBackdated) {
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
      console.log(`💰 [getSystemStats] Processing payments for entry: ${entry.customerName} (status: ${entry.status}, dispatched: ${entry.status === 'dispatched'})`);
      let paymentsProcessed = 0;
      let deliveryPaymentsSkipped = 0;

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
              paymentsProcessed++;
              console.log(`  ✓ Entry payment: ₹${amount} for ${entry.customerName}`);
            } else if (payment.type === 'renewal') {
              totalRenewalCollections += amount;
              paymentsProcessed++;
              console.log(`  ✓ Renewal payment: ₹${amount} for ${entry.customerName}`);
            } else if (payment.type === 'delivery') {
              deliveryPaymentsSkipped++;
              console.log(`  ⊘ Skipped delivery payment: ₹${amount} for ${entry.customerName} (will be counted from unified dispatch records)`);
            }
            // NOTE: We deliberately skip 'delivery' payments here to avoid double counting
            // Delivery payments are handled via unified dispatch records below
          }
        });
        console.log(`  → Processed: ${paymentsProcessed} payments, Skipped: ${deliveryPaymentsSkipped} delivery payments`);
      }
    });
    
    // Use unified dispatch records for delivery counting and revenue
    // The unified dispatch records now contain accurate payment information
    console.log(`💰 [getSystemStats] Calculating delivery revenue from ${unifiedDispatchRecords.length} unified dispatch records`);
    const deliveryRevenueFromUnified = unifiedDispatchRecords.reduce((sum, record) => {
      const paymentDate = new Date(record.dispatchInfo.dispatchDate);
      const isInDateRange = !dateRange || (paymentDate >= dateRange.from && paymentDate <= dateRange.to);
      const amount = record.dispatchInfo.paymentAmount || 0;

      if (isInDateRange && amount > 0) {
        console.log(`  ✓ Delivery payment: ₹${amount} for ${record.customerInfo.name} (entryId: ${record.entryId})`);
      }

      return isInDateRange ? sum + amount : sum;
    }, 0);

    console.log(`💰 [getSystemStats] Total delivery revenue from unified dispatch records: ₹${deliveryRevenueFromUnified}`);

    // Count unique deliveries from unified records
    const uniqueDeliveries = unifiedDispatchRecords.filter(record => {
      const paymentDate = new Date(record.dispatchInfo.dispatchDate);
      const isInDateRange = !dateRange || (paymentDate >= dateRange.from && paymentDate <= dateRange.to);
      return isInDateRange;
    }).length;
    
    // Use the more accurate unified data
    totalDeliveries = uniqueDeliveries;
    totalDeliveryCollections = deliveryRevenueFromUnified;
    
    const stats = {
      totalEntries: totalActiveEntries, // This now represents active entries within date range
      totalRenewals: totalRenewals,
      totalDeliveries: totalDeliveries, // Now from unified dispatch records
      currentActive: locationId ?
        entries.filter(e => {
          const expiryDate = e.expiryDate?.toDate?.() || new Date(e.expiryDate);
          return e.status === 'active' && e.locationId === locationId && expiryDate > now;
        }).length :
        entries.filter(e => {
          const expiryDate = e.expiryDate?.toDate?.() || new Date(e.expiryDate);
          return e.status === 'active' && expiryDate > now;
        }).length, // Only count non-expired active entries
      expiringIn7Days: expiringIn7Days,
      monthlyRevenue: totalRenewalCollections + totalDeliveryCollections, // Total collections
      renewalCollections: totalRenewalCollections,
      deliveryCollections: totalDeliveryCollections,
      lastUpdated: serverTimestamp()
    };

    console.log(`💰 [getSystemStats] Final Revenue Calculation:
  - Renewal Collections: ₹${totalRenewalCollections}
  - Delivery Collections: ₹${totalDeliveryCollections}
  - Total Revenue: ₹${totalRenewalCollections + totalDeliveryCollections}
  - Total Dispatches: ${totalDeliveries}`);

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