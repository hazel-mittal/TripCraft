import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Save a trip to Firestore
export const saveTrip = async (userId, tripData) => {
  if (!db) {
    throw new Error('Firebase not configured. Please set up your environment variables.');
  }
  try {
    const trip = {
      ...tripData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'trips'), trip);
    return docRef.id;
  } catch (error) {
    console.error('Error saving trip:', error);
    throw error;
  }
};

// Get all trips for a user
export const getUserTrips = async (userId) => {
  if (!db) {
    throw new Error('Firebase not configured. Please set up your environment variables.');
  }
  try {
    const q = query(
      collection(db, 'trips'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const trips = [];
    
    querySnapshot.forEach((doc) => {
      trips.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return trips;
  } catch (error) {
    console.error('Error getting user trips:', error);
    throw error;
  }
};

// Delete a trip
export const deleteTrip = async (tripId) => {
  if (!db) {
    throw new Error('Firebase not configured. Please set up your environment variables.');
  }
  try {
    await deleteDoc(doc(db, 'trips', tripId));
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

// Get a specific trip
export const getTrip = async (tripId) => {
  if (!db) {
    throw new Error('Firebase not configured. Please set up your environment variables.');
  }
  try {
    const docRef = doc(db, 'trips', tripId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Trip not found');
    }
  } catch (error) {
    console.error('Error getting trip:', error);
    throw error;
  }
};
