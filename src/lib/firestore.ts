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
  customerCity?: string; // Add optional customerCity field
  deceasedPersonName?: string; // New field for deceased person details
  numberOfLockers: number; // Changed from numberOfPots to numberOfLockers
  potsPerLocker: number; // New field - number of pots in each locker
  locationId: string;
  operatorId: string;
  paymentMethod: 'cash' | 'upi';
  entryDate?: Date; // Optional entry date - defaults to now
}) => {
  try {
    const entryDate = entryData.entryDate || new Date();
    const expiryDate = new Date(entryDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    // Calculate total pots and payment - simplified to single locker per entry
    const totalPots = entryData.numberOfPots || entryData.numberOfLockers * entryData.potsPerLocker; // Backward compatibility
    const entryFee = 500; // Fixed ₹500 per entry, not per locker
    
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
      // Track pots per locker for partial dispatches
      lockerDetails: Array.from({ length: entryData.numberOfLockers }, (_, index) => ({
        lockerNumber: index + 1,
        totalPots: entryData.potsPerLocker,
        remainingPots: entryData.potsPerLocker, // Initially all pots are remaining
        dispatchedPots: [] // Track which pots have been dispatched
      })),
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
        operatorName: entry.operatorName || 'Unknown Operator' // Add fallback for undefined
      },
      dispatchInfo: {
        lockerNumber: dispatchData.lockerNumber,
        potsDispatched: dispatchData.potsToDispatch,
        remainingPotsInLocker: updatedLockerDetails.find(ld => ld.lockerNumber === dispatchData.lockerNumber)?.remainingPots || 0,
        totalRemainingPots: totalRemainingPots,
        dispatchType: totalRemainingPots === 0 ? 'full' : 'partial',
        dispatchDate: new Date(),
        dispatchReason: dispatchData.dispatchReason || 'Partial collection',
        handoverPersonName: dispatchData.handoverPersonName,
        handoverPersonMobile: dispatchData.handoverPersonMobile,
        paymentMethod: dispatchData.paymentMethod,
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
    let q = query(collection(db, 'dispatchedLockers'));
    
    // Apply location filter if provided
    if (filters?.locationId) {
      q = query(
        collection(db, 'dispatchedLockers'),
        where('originalEntryData.locationId', '==', filters.locationId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const dispatchedLockers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort manually by dispatch date
    dispatchedLockers.sort((a, b) => {
      const aTime = a.dispatchInfo?.dispatchDate?.toDate?.() || new Date(a.dispatchInfo?.dispatchDate);
      const bTime = b.dispatchInfo?.dispatchDate?.toDate?.() || new Date(b.dispatchInfo?.dispatchDate);
      return bTime.getTime() - aTime.getTime(); // desc order
    });
    
    // Apply date range filter if provided
    let filteredLockers = dispatchedLockers;
    if (filters?.dateRange) {
      filteredLockers = dispatchedLockers.filter(locker => {
        const dispatchDate = locker.dispatchInfo?.dispatchDate?.toDate?.() || new Date(locker.dispatchInfo?.dispatchDate);
        return dispatchDate >= filters.dateRange.from && dispatchDate <= filters.dateRange.to;
      });
    }
    
    return filteredLockers;
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
      
      // Count dispatched entries (both 'delivered' and 'dispatched' status)
      if ((entry.status === 'delivered' || entry.status === 'dispatched') && isEntryInRange) {
        totalDeliveries += 1; // Count as dispatched
      }
      
      // Process payments for collections - include entry, renewal and delivery payments
      if (entry.payments && Array.isArray(entry.payments)) {
        entry.payments.forEach((payment: any) => {
          const paymentDate = payment.date?.toDate?.();
          const amount = payment.amount || 0;
          
          // Only count payments within date range if specified
          if (!dateRange || (paymentDate && paymentDate >= dateRange.from && paymentDate <= dateRange.to)) {
            if (payment.type === 'entry') {
              totalRenewalCollections += amount; // Add entry payments to collections
            } else if (payment.type === 'renewal') {
              totalRenewalCollections += amount;
            } else if (payment.type === 'delivery') {
              totalDeliveryCollections += amount;
            }
          }
        });
      }
    });
    
    const stats = {
      totalEntries: totalActiveEntries, // This now represents active entries within date range
      totalRenewals: totalRenewals,
      totalDeliveries: totalDeliveries,
      currentActive: entries.filter(e => e.status === 'active').length, // Total active regardless of date range
      expiringIn7Days: expiringIn7Days,
      monthlyRevenue: totalRenewalCollections + totalDeliveryCollections, // Total collections
      renewalCollections: totalRenewalCollections,
      deliveryCollections: totalDeliveryCollections,
      lastUpdated: serverTimestamp()
    };
    
    console.log('Calculated stats:', stats);
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
          const paymentDate = payment.date?.toDate ? payment.date.toDate() : null;
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
          const paymentDate = payment.date?.toDate ? payment.date.toDate() : null;
          
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