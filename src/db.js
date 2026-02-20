import { db } from './firebase.js';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';

// --- Students ---
export const getStudents = async () => {
    const q = query(collection(db, 'students'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addStudent = async (data) => {
    return await addDoc(collection(db, 'students'), data);
};

export const updateStudent = async (id, data) => {
    const docRef = doc(db, 'students', id);
    return await updateDoc(docRef, data);
};

// --- Schedules (Shifts) ---
export const getSchedules = async () => {
    const q = query(collection(db, 'schedules'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const listenToSchedules = (callback) => {
    const q = query(collection(db, 'schedules'));
    return onSnapshot(q, (snapshot) => {
        const schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(schedules);
    });
};

export const addSchedule = async (data) => {
    return await addDoc(collection(db, 'schedules'), data);
};

export const updateScheduleStatus = async (id, status) => {
    const docRef = doc(db, 'schedules', id);
    return await updateDoc(docRef, { status });
};

// --- Templates ---
export const getTemplates = async () => {
    const q = query(collection(db, 'templates'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateTemplate = async (id, body) => {
    const docRef = doc(db, 'templates', id);
    return await updateDoc(docRef, { body });
};
