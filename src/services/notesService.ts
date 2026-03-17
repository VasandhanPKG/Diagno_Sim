import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  orderBy,
  setDoc,
  getDocs
} from "firebase/firestore";
import { db, auth } from "../firebase";

export interface Note {
  id: string;
  title: string;
  content: string;
  isFavorite?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Bookmark {
  id: string;
  type: "diseases" | "drugs" | "cases";
  itemId: string;
  isFavorite?: boolean;
  savedAt: any;
}

export const notesService = {
  // Notes
  subscribeToNotes: (callback: (notes: Note[]) => void, onError?: (error: any) => void) => {
    if (!auth.currentUser) return () => {};
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/notes`),
      orderBy("updatedAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      callback(notes);
    }, (error) => {
      if (onError) onError(error);
    });
  },

  addNote: async (title: string, content: string) => {
    if (!auth.currentUser) return;
    await addDoc(collection(db, `users/${auth.currentUser.uid}/notes`), {
      title,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  updateNote: async (id: string, title: string, content: string) => {
    if (!auth.currentUser) return;
    const noteRef = doc(db, `users/${auth.currentUser.uid}/notes`, id);
    await updateDoc(noteRef, {
      title,
      content,
      updatedAt: serverTimestamp()
    });
  },

  deleteNote: async (id: string) => {
    if (!auth.currentUser) return;
    const noteRef = doc(db, `users/${auth.currentUser.uid}/notes`, id);
    await deleteDoc(noteRef);
  },

  toggleNoteFavorite: async (id: string, currentStatus: boolean) => {
    if (!auth.currentUser) return;
    const noteRef = doc(db, `users/${auth.currentUser.uid}/notes`, id);
    await updateDoc(noteRef, {
      isFavorite: !currentStatus,
      updatedAt: serverTimestamp()
    });
  },

  // Bookmarks
  subscribeToBookmarks: (callback: (bookmarks: Bookmark[]) => void, onError?: (error: any) => void) => {
    if (!auth.currentUser) return () => {};
    const q = query(collection(db, `users/${auth.currentUser.uid}/bookmarks`));
    return onSnapshot(q, (snapshot) => {
      const bookmarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark));
      callback(bookmarks);
    }, (error) => {
      if (onError) onError(error);
    });
  },

  toggleBookmark: async (type: "diseases" | "drugs" | "cases", itemId: string) => {
    if (!auth.currentUser) return;
    const bookmarkId = `${type}_${itemId}`;
    const bookmarkRef = doc(db, `users/${auth.currentUser.uid}/bookmarks`, bookmarkId);
    
    // Check if exists
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/bookmarks`),
      where("type", "==", type),
      where("itemId", "==", itemId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/bookmarks`, snapshot.docs[0].id));
    } else {
      await setDoc(bookmarkRef, {
        type,
        itemId,
        isFavorite: false,
        savedAt: serverTimestamp()
      });
    }
  },

  toggleBookmarkFavorite: async (id: string, currentStatus: boolean) => {
    if (!auth.currentUser) return;
    const bookmarkRef = doc(db, `users/${auth.currentUser.uid}/bookmarks`, id);
    await updateDoc(bookmarkRef, {
      isFavorite: !currentStatus
    });
  }
};
