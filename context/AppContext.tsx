
import React, { createContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { User, InspectionReport, Zone, Location, InspectionForm, Notification, CDR, PenaltyInvoice, GlobalPenaltyStatement, InspectionTask, TaskStatus } from '../types';
import { USERS, ZONES, LOCATIONS, FORMS, INITIAL_REPORTS, INITIAL_NOTIFICATIONS, INITIAL_CDRS } from '../constants';
import { db, auth } from '../firebase';
import { collection, onSnapshot, setDoc, doc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

interface AppContextType {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  changePassword: (userId: string, oldPassword: string, newPassword: string) => boolean;
  reports: InspectionReport[];
  submitReport: (report: InspectionReport) => Promise<void>;
  updateReport: (report: InspectionReport) => Promise<void>;
  getReportById: (id: string) => InspectionReport | undefined;
  getInspectorById: (id: string) => User | undefined;
  getLocationById: (id: string) => Location | undefined;
  getZoneByLocationId: (locationId: string) => Zone | undefined;
  getFormById: (formId: string) => InspectionForm | undefined;
  zones: Zone[];
  locations: Location[];
  forms: InspectionForm[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  cdrs: CDR[];
  addCDR: (cdr: CDR) => void;
  updateCDR: (cdr: CDR) => void;
  getCDRById: (id: string) => CDR | undefined;
  penaltyInvoices: PenaltyInvoice[];
  addPenaltyInvoice: (invoice: PenaltyInvoice) => void;
  updatePenaltyInvoice: (invoice: PenaltyInvoice) => void;
  getPenaltyInvoiceById: (id: string) => PenaltyInvoice | undefined;
  globalPenaltyStatements: GlobalPenaltyStatement[];
  addGlobalPenaltyStatement: (stmt: GlobalPenaltyStatement) => void;
  updateGlobalPenaltyStatement: (stmt: GlobalPenaltyStatement) => void;
  getGlobalPenaltyStatementById: (id: string) => GlobalPenaltyStatement | undefined;
  tasks: InspectionTask[];
  addTasks: (newTasks: InspectionTask[]) => void;
  updateTask: (task: InspectionTask) => void;
  completeTask: (taskId: string, reportId: string) => void;
  isFirebaseReady: boolean;
  forceRefresh: () => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(USERS);
  
  const loadFromStorage = (key: string, initial: any) => {
      try {
          const saved = localStorage.getItem(key);
          return saved ? JSON.parse(saved) : initial;
      } catch (e) {
          console.error("Storage load error", e);
          return initial;
      }
  };

  const [reports, setReports] = useState<InspectionReport[]>(() => loadFromStorage('app_reports', INITIAL_REPORTS));
  const [cdrs, setCdrs] = useState<CDR[]>(() => loadFromStorage('app_cdrs', INITIAL_CDRS));
  const [penaltyInvoices, setPenaltyInvoices] = useState<PenaltyInvoice[]>(() => loadFromStorage('app_invoices', []));
  const [globalPenaltyStatements, setGlobalPenaltyStatements] = useState<GlobalPenaltyStatement[]>(() => loadFromStorage('app_statements', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage('app_notifications', INITIAL_NOTIFICATIONS));
  const [tasks, setTasks] = useState<InspectionTask[]>(() => loadFromStorage('app_tasks', []));
  
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const isFirebaseReady = !!(db && auth);

  const forceRefresh = useCallback(() => {
      if (!isFirebaseReady) {
          setReports(loadFromStorage('app_reports', INITIAL_REPORTS));
          setNotifications(loadFromStorage('app_notifications', INITIAL_NOTIFICATIONS));
      }
  }, [isFirebaseReady]);

  // Firebase Listeners
  useEffect(() => {
    if (!db || !auth) return; 
    const reportsUnsub = onSnapshot(collection(db, "reports"), (snapshot) => {
      setReports(snapshot.docs.map(doc => doc.data() as InspectionReport));
    });
    const cdrsUnsub = onSnapshot(collection(db, "cdrs"), (snapshot) => {
      setCdrs(snapshot.docs.map(doc => doc.data() as CDR));
    });
    const notificationsUnsub = onSnapshot(collection(db, "notifications"), (snapshot) => {
        setNotifications(snapshot.docs.map(doc => doc.data() as Notification));
    });
    return () => { reportsUnsub(); cdrsUnsub(); notificationsUnsub(); };
  }, []);

  // Auth
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser && firebaseUser.email) {
            const matchedUser = USERS.find(u => u.email.toLowerCase() === firebaseUser.email?.toLowerCase());
            if (matchedUser) setUser({ ...matchedUser, uid: firebaseUser.uid });
        } else {
            setUser(null);
        }
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<boolean> => {
    if (!auth) {
        const cleanIdentifier = identifier.trim().toLowerCase();
        const foundUser = users.find(u => 
            (u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier) && 
            u.password === password.trim()
        );
        if (foundUser) {
            setUser(foundUser);
            return true;
        }
        return false;
    }
    try {
        await signInWithEmailAndPassword(auth, identifier, password);
        return true;
    } catch (error) {
        return false;
    }
  }, [users]);

  const logout = useCallback(async () => {
    if (!auth) { setUser(null); return; }
    await signOut(auth);
  }, []);

  // Data Actions with Direct Storage Write
  const submitReport = useCallback(async (report: InspectionReport) => {
    if (db) {
        try { await setDoc(doc(db, "reports", report.id), report); } catch (e) { console.error(e); }
    } else {
        setReports(prev => {
            const newState = [report, ...prev];
            localStorage.setItem('app_reports', JSON.stringify(newState));
            return newState;
        });
    }
  }, []);

  const updateReport = useCallback(async (updatedReport: InspectionReport) => {
    if (db) {
        try { await setDoc(doc(db, "reports", updatedReport.id), updatedReport); } catch (e) { console.error(e); }
    } else {
        setReports(prev => {
            const newState = prev.map(r => r.id === updatedReport.id ? updatedReport : r);
            localStorage.setItem('app_reports', JSON.stringify(newState));
            return newState;
        });
    }
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => {
        const newState = [notification, ...prev];
        localStorage.setItem('app_notifications', JSON.stringify(newState));
        return newState;
    });
  }, []);

  const addCDR = useCallback(async (cdr: CDR) => {
    if (db) { try { await setDoc(doc(db, "cdrs", cdr.id), cdr); } catch (e) {} } else {
        setCdrs(prev => { const n = [cdr, ...prev]; localStorage.setItem('app_cdrs', JSON.stringify(n)); return n; });
    }
  }, []);

  const updateCDR = useCallback(async (updatedCDR: CDR) => {
    if (db) { try { await setDoc(doc(db, "cdrs", updatedCDR.id), updatedCDR); } catch (e) {} } else {
        setCdrs(prev => { const n = prev.map(c => c.id === updatedCDR.id ? updatedCDR : c); localStorage.setItem('app_cdrs', JSON.stringify(n)); return n; });
    }
  }, []);

  const addPenaltyInvoice = useCallback(async (invoice: PenaltyInvoice) => {
    if (db) { try { await setDoc(doc(db, "penaltyInvoices", invoice.id), invoice); } catch (e) {} } else {
        setPenaltyInvoices(prev => { const n = [invoice, ...prev]; localStorage.setItem('app_invoices', JSON.stringify(n)); return n; });
    }
  }, []);

  const updatePenaltyInvoice = useCallback(async (invoice: PenaltyInvoice) => {
    if (db) { try { await setDoc(doc(db, "penaltyInvoices", invoice.id), invoice); } catch (e) {} } else {
        setPenaltyInvoices(prev => { const n = prev.map(inv => inv.id === invoice.id ? invoice : inv); localStorage.setItem('app_invoices', JSON.stringify(n)); return n; });
    }
  }, []);

  const addGlobalPenaltyStatement = useCallback(async (stmt: GlobalPenaltyStatement) => {
    if (db) { try { await setDoc(doc(db, "globalPenaltyStatements", stmt.id), stmt); } catch (e) {} } else {
        setGlobalPenaltyStatements(prev => { const n = [stmt, ...prev]; localStorage.setItem('app_statements', JSON.stringify(n)); return n; });
    }
  }, []);

  const updateGlobalPenaltyStatement = useCallback(async (updatedStmt: GlobalPenaltyStatement) => {
    if (db) { try { await setDoc(doc(db, "globalPenaltyStatements", updatedStmt.id), updatedStmt); } catch (e) {} } else {
        setGlobalPenaltyStatements(prev => { const n = prev.map(s => s.id === updatedStmt.id ? updatedStmt : s); localStorage.setItem('app_statements', JSON.stringify(n)); return n; });
    }
  }, []);

  const addTasks = useCallback(async (newTasks: InspectionTask[]) => {
      if (db) { try { const batchPromises = newTasks.map(task => setDoc(doc(db, "tasks", task.id), task)); await Promise.all(batchPromises); } catch(e) {} } else {
          setTasks(prev => { const n = [...prev, ...newTasks]; localStorage.setItem('app_tasks', JSON.stringify(n)); return n; });
      }
  }, []);

  const updateTask = useCallback(async (updatedTask: InspectionTask) => {
      if (db) { try { await setDoc(doc(db, "tasks", updatedTask.id), updatedTask); } catch(e) {} } else {
          setTasks(prev => { const n = prev.map(t => t.id === updatedTask.id ? updatedTask : t); localStorage.setItem('app_tasks', JSON.stringify(n)); return n; });
      }
  }, []);

  const completeTask = useCallback(async (taskId: string, reportId: string) => {
      if (db) { try { await updateDoc(doc(db, "tasks", taskId), { status: TaskStatus.Completed, linkedReportId: reportId }); } catch(e) {} } else {
          setTasks(prev => { const n = prev.map(t => t.id === taskId ? { ...t, status: TaskStatus.Completed, linkedReportId: reportId } : t); localStorage.setItem('app_tasks', JSON.stringify(n)); return n; });
      }
  }, []);

  // Helpers
  const addUser = useCallback((userToAdd: Omit<User, 'id'>) => {
    const newUser: User = { ...userToAdd, id: `user-${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (user?.id === updatedUser.id) setUser(updatedUser);
  }, [user]);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const changePassword = useCallback((userId: string, oldPassword: string, newPassword: string): boolean => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate && userToUpdate.password === oldPassword) {
      const updatedUser = { ...userToUpdate, password: newPassword };
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      if (user?.id === userId) setUser(updatedUser);
      return true;
    }
    return false;
  }, [users, user]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);
  
  const getReportById = useCallback((id: string) => reports.find(r => r.id === id), [reports]);
  const getInspectorById = useCallback((id: string) => users.find(u => u.id === id), [users]);
  const getLocationById = useCallback((id: string) => LOCATIONS.find(l => l.id === id), []);
  const getZoneByLocationId = useCallback((locationId: string) => {
    const location = LOCATIONS.find(l => l.id === locationId);
    return location ? ZONES.find(z => z.id === location.zoneId) : undefined;
  }, []);
  const getFormById = useCallback((formId: string) => FORMS.find(f => f.id === formId), []);
  const getCDRById = useCallback((id: string) => cdrs.find(c => c.id === id), [cdrs]);
  const getPenaltyInvoiceById = useCallback((id: string) => penaltyInvoices.find(inv => inv.id === id), [penaltyInvoices]);
  const getGlobalPenaltyStatementById = useCallback((id: string) => globalPenaltyStatements.find(s => s.id === id), [globalPenaltyStatements]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => { const n = prev.map(n => n.id === id ? { ...n, isRead: true } : n); localStorage.setItem('app_notifications', JSON.stringify(n)); return n; });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => { const n = prev.map(n => ({ ...n, isRead: true })); localStorage.setItem('app_notifications', JSON.stringify(n)); return n; });
  }, []);

  const value = useMemo(() => ({
    user, users, login, logout, addUser, updateUser, deleteUser, changePassword,
    reports, submitReport, updateReport,
    getReportById, getInspectorById, getLocationById, getZoneByLocationId, getFormById,
    zones: ZONES, locations: LOCATIONS, forms: FORMS,
    theme, toggleTheme,
    notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead,
    cdrs, addCDR, updateCDR, getCDRById,
    penaltyInvoices, addPenaltyInvoice, updatePenaltyInvoice, getPenaltyInvoiceById,
    globalPenaltyStatements, addGlobalPenaltyStatement, updateGlobalPenaltyStatement, getGlobalPenaltyStatementById,
    tasks, addTasks, updateTask, completeTask,
    isFirebaseReady, forceRefresh
  }), [user, users, reports, theme, notifications, cdrs, penaltyInvoices, globalPenaltyStatements, tasks, isFirebaseReady, login, logout, addUser, updateUser, deleteUser, changePassword, submitReport, updateReport, getReportById, getInspectorById, getLocationById, getZoneByLocationId, getFormById, toggleTheme, addNotification, markNotificationAsRead, markAllNotificationsAsRead, addCDR, updateCDR, getCDRById, addPenaltyInvoice, updatePenaltyInvoice, getPenaltyInvoiceById, addGlobalPenaltyStatement, updateGlobalPenaltyStatement, getGlobalPenaltyStatementById, addTasks, updateTask, completeTask, forceRefresh]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
