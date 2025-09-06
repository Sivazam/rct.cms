import { db } from '@/lib/firebase';
import { collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

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
    const q = query(collection(db, 'locations'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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

// User Management
export const getUsers = async (role?: string, isActive?: boolean) => {
  try {
    let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    console.log('getUsers called with:', { role, isActive });
    
    if (role) {
      q = query(q, where('role', '==', role));
      console.log('Added role filter:', role);
    }
    
    if (isActive !== undefined) {
      q = query(q, where('isActive', '==', isActive));
      console.log('Added isActive filter:', isActive);
    }
    
    console.log('Executing query...');
    const querySnapshot = await getDocs(q);
    console.log('Query snapshot size:', querySnapshot.size);
    
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Users found:', users);
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
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
  numberOfPots: number;
  locationId: string;
  operatorId: string;
  paymentMethod: 'cash' | 'upi';
}) => {
  try {
    const entryDate = new Date();
    const expiryDate = new Date(entryDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    const docRef = await addDoc(collection(db, 'entries'), {
      ...entryData,
      entryDate: entryDate,
      expiryDate: expiryDate,
      status: 'active',
      payments: [{
        amount: 500,
        date: entryDate,
        type: 'entry',
        method: entryData.paymentMethod,
        months: 1
      }],
      renewals: [],
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding entry:', error);
    throw error;
  }
};

export const getEntries = async (filters?: {
  locationId?: string;
  status?: string;
  operatorId?: string;
  expiringSoon?: boolean;
}) => {
  try {
    let q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'));
    
    if (filters?.locationId) {
      q = query(q, where('locationId', '==', filters.locationId));
    }
    
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters?.operatorId) {
      q = query(q, where('operatorId', '==', filters.operatorId));
    }
    
    const querySnapshot = await getDocs(q);
    let entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter for expiring soon entries (client-side filter for now)
    if (filters?.expiringSoon) {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      entries = entries.filter(entry => {
        const expiryDate = entry.expiryDate?.toDate();
        return expiryDate && expiryDate <= sevenDaysFromNow && expiryDate > now;
      });
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

// System Stats
export const getSystemStats = async (locationId?: string) => {
  try {
    const statsId = locationId || 'overall';
    const statsDoc = await getDoc(doc(db, 'systemStats', statsId));
    
    if (statsDoc.exists()) {
      return statsDoc.data();
    }
    
    // Return default stats if not found
    return {
      totalEntries: 0,
      totalRenewals: 0,
      totalDeliveries: 0,
      currentActive: 0,
      expiringIn7Days: 0,
      monthlyRevenue: 0,
      lastUpdated: serverTimestamp()
    };
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