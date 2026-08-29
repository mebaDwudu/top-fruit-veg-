import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  Unsubscribe,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Product,
  Order,
  Customer,
  Supplier,
  PurchaseOrder,
  StockMovement,
  StoreSettings,
  RegisterShift,
  StaffMember,
  CustomerOnlineOrder,
  CustomerFeedback,
} from '../types/store';

export const COLLECTIONS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  CUSTOMER_ORDERS: 'customer_orders',
  FEEDBACKS: 'feedbacks',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  PURCHASE_ORDERS: 'purchase_orders',
  STOCK_MOVEMENTS: 'stock_movements',
  SETTINGS: 'settings',
  SHIFTS: 'shifts',
  STAFF: 'staff',
} as const;

// Generic collection real-time subscriber
export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as T), id: docSnap.id });
      });
      onUpdate(items);
    },
    (err) => {
      console.warn(`[Firestore] Subscription error for ${collectionName}:`, err);
      if (onError) onError(err);
    }
  );
}

// Subscribe to Customer Online Orders (Cross-device real-time sync)
export function subscribeCustomerOrders(
  onUpdate: (orders: CustomerOnlineOrder[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.CUSTOMER_ORDERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const orders: CustomerOnlineOrder[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ ...(docSnap.data() as CustomerOnlineOrder), id: docSnap.id });
      });
      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(orders);
    },
    (err) => {
      console.warn('[Firestore] Customer orders subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Save or update Customer Online Order in Firestore
export async function saveCustomerOrder(order: CustomerOnlineOrder): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CUSTOMER_ORDERS, order.id);
  await setDoc(docRef, order, { merge: true });
}

// Update Customer Online Order status in Firestore
export async function updateCustomerOrderStatusInFirestore(
  orderId: string,
  status: CustomerOnlineOrder['status'],
  adminNotes?: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CUSTOMER_ORDERS, orderId);
  const updates: Partial<CustomerOnlineOrder> = {
    status,
    updatedAt: new Date().toISOString(),
  };
  if (adminNotes !== undefined) {
    updates.adminNotes = adminNotes;
  }
  await setDoc(docRef, updates, { merge: true });
}

// Delete Customer Online Order from Firestore
export async function deleteCustomerOrderFromFirestore(orderId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CUSTOMER_ORDERS, orderId);
  await deleteDoc(docRef);
}

// Subscribe to POS Store Orders (Sales ledger)
export function subscribeOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.ORDERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ ...(docSnap.data() as Order), id: docSnap.id });
      });
      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(orders);
    },
    (err) => {
      console.warn('[Firestore] Orders subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Save POS Order in Firestore
export async function saveOrderInFirestore(order: Order): Promise<void> {
  const docRef = doc(db, COLLECTIONS.ORDERS, order.id);
  await setDoc(docRef, order, { merge: true });
}

// Subscribe to Customer Feedbacks & Reviews
export function subscribeFeedbacks(
  onUpdate: (feedbacks: CustomerFeedback[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.FEEDBACKS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: CustomerFeedback[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as CustomerFeedback), id: docSnap.id });
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (err) => {
      console.warn('[Firestore] Feedbacks subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Save Customer Feedback in Firestore
export async function saveFeedbackInFirestore(feedback: CustomerFeedback): Promise<void> {
  const docRef = doc(db, COLLECTIONS.FEEDBACKS, feedback.id);
  await setDoc(docRef, feedback, { merge: true });
}

// Update Feedback Status in Firestore
export async function updateFeedbackStatusInFirestore(
  feedbackId: string,
  status: CustomerFeedback['status'],
  adminNote?: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.FEEDBACKS, feedbackId);
  const updates: Partial<CustomerFeedback> = { status };
  if (adminNote !== undefined) {
    updates.adminNote = adminNote;
  }
  await setDoc(docRef, updates, { merge: true });
}

// Delete Customer Feedback from Firestore
export async function deleteFeedbackFromFirestore(feedbackId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.FEEDBACKS, feedbackId);
  await deleteDoc(docRef);
}

// Single document subscriber
export function subscribeDocument<T>(
  collectionName: string,
  docId: string,
  onUpdate: (data: T | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as T);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn(`[Firestore] Subscription error for ${collectionName}/${docId}:`, err);
      if (onError) onError(err);
    }
  );
}

// Save or overwrite a single document
export async function saveDoc<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.error(`[Firestore] Failed to save doc in ${collectionName}/${docId}:`, err);
    throw err;
  }
}

// Delete document
export async function removeDoc(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`[Firestore] Failed to delete doc in ${collectionName}/${docId}:`, err);
    throw err;
  }
}

// Check if database is initialized, and if empty seed initial records
export async function checkAndSeedFirestore(initial: {
  products: Product[];
  categories: string[];
  orders: Order[];
  customers: Customer[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  movements: StockMovement[];
  settings: StoreSettings;
  shift: RegisterShift;
  staff?: StaffMember[];
}): Promise<boolean> {
  try {
    const productsSnap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    if (!productsSnap.empty) {
      return false; // Already populated
    }

    console.log('[Firestore] Empty database detected. Seeding initial store dataset...');
    await resetFirestoreWithData(initial);
    return true;
  } catch (err) {
    console.warn('[Firestore] Auto-seed check error:', err);
    return false;
  }
}

// Reset / Seed all collections with provided demo dataset
export async function resetFirestoreWithData(data: {
  products: Product[];
  categories: string[];
  orders: Order[];
  customers: Customer[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  movements: StockMovement[];
  settings: StoreSettings;
  shift: RegisterShift;
  staff?: StaffMember[];
}): Promise<void> {
  const batch = writeBatch(db);

  // Settings
  batch.set(doc(db, COLLECTIONS.SETTINGS, 'main'), data.settings);

  // Shift
  batch.set(doc(db, COLLECTIONS.SHIFTS, 'current'), data.shift);

  // Staff
  if (data.staff && data.staff.length > 0) {
    data.staff.forEach((st) => {
      batch.set(doc(db, COLLECTIONS.STAFF, st.id), st);
    });
  }

  // Categories
  data.categories.forEach((cat) => {
    const catDocId = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    batch.set(doc(db, COLLECTIONS.CATEGORIES, catDocId), { name: cat, id: catDocId });
  });

  // Products
  data.products.forEach((prod) => {
    batch.set(doc(db, COLLECTIONS.PRODUCTS, prod.id), prod);
  });

  // Customers
  data.customers.forEach((cust) => {
    batch.set(doc(db, COLLECTIONS.CUSTOMERS, cust.id), cust);
  });

  // Suppliers
  data.suppliers.forEach((sup) => {
    batch.set(doc(db, COLLECTIONS.SUPPLIERS, sup.id), sup);
  });

  // Purchase Orders
  data.purchaseOrders.forEach((po) => {
    batch.set(doc(db, COLLECTIONS.PURCHASE_ORDERS, po.id), po);
  });

  // Stock movements
  data.movements.forEach((mov) => {
    batch.set(doc(db, COLLECTIONS.STOCK_MOVEMENTS, mov.id), mov);
  });

  // Orders
  data.orders.forEach((ord) => {
    batch.set(doc(db, COLLECTIONS.ORDERS, ord.id), ord);
  });

  await batch.commit();
  console.log('[Firestore] Batch seed complete.');
}
