import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Admin Settings Collection
const ADMIN_SETTINGS_COLLECTION = 'adminSettings';
const ADMIN_SETTINGS_DOC_ID = 'config';

export interface AdminSettings {
  helpDeskMobile: string;
  adminMobile: string;
  updatedAt: any;
  createdAt: any;
}

/**
 * Get admin settings from Firestore
 */
export const getAdminSettings = async (): Promise<AdminSettings | null> => {
  try {
    const docRef = doc(db, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        helpDeskMobile: data?.helpDeskMobile || '+91 9395133359',
        adminMobile: data?.adminMobile || '+919014882779',
        updatedAt: data?.updatedAt,
        createdAt: data?.createdAt
      };
    }

    // Return default settings if document doesn't exist
    return {
      helpDeskMobile: '+91 9395133359',
      adminMobile: '+919014882779',
      updatedAt: null,
      createdAt: null
    };
  } catch (error) {
    console.error('Error getting admin settings:', error);
    return null;
  }
};

/**
 * Update help desk mobile number in Firestore
 */
export const updateHelpDeskMobile = async (helpDeskMobile: string): Promise<boolean> => {
  try {
    const docRef = doc(db, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    const updateData: any = {
      helpDeskMobile,
      updatedAt: serverTimestamp()
    };

    // If document doesn't exist, create it with createdAt
    if (!docSnap.exists()) {
      updateData.createdAt = serverTimestamp();
      updateData.adminMobile = '+919014882779'; // Default admin mobile
    }

    await setDoc(docRef, updateData, { merge: true });
    console.log('✅ Help desk mobile updated in Firestore:', helpDeskMobile);
    return true;
  } catch (error) {
    console.error('Error updating help desk mobile:', error);
    return false;
  }
};

/**
 * Update admin mobile number in Firestore
 */
export const updateAdminMobile = async (adminMobile: string): Promise<boolean> => {
  try {
    const docRef = doc(db, ADMIN_SETTINGS_COLLECTION, ADMIN_SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    const updateData: any = {
      adminMobile,
      updatedAt: serverTimestamp()
    };

    // If document doesn't exist, create it with createdAt
    if (!docSnap.exists()) {
      updateData.createdAt = serverTimestamp();
      updateData.helpDeskMobile = '+91 9395133359'; // Default help desk mobile
    }

    await setDoc(docRef, updateData, { merge: true });
    console.log('✅ Admin mobile updated in Firestore:', adminMobile);
    return true;
  } catch (error) {
    console.error('Error updating admin mobile:', error);
    return false;
  }
};
