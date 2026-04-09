import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  handleFirestoreError,
  OperationType,
  Timestamp,
  doc,
  setDoc,
  getDocs,
  where
} from './firebase';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  UserPlus,
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Toaster, toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import firebaseConfig from '../firebase-applet-config.json';

// --- Types ---
interface Student {
  id: string;
  uid: string;
  name: string;
  studentId: string;
  email?: string;
  photoUrl?: string;
  createdAt: any;
}

interface AttendanceLog {
  id: string;
  studentUid: string;
  studentName: string;
  timestamp: any;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  deviceId?: string;
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Real-time Data Listeners
  useEffect(() => {
    if (!user) return;

    const studentsQuery = query(collection(db, 'students'), orderBy('name'));
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'students'));

    const attendanceQuery = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog));
      setAttendance(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance'));

    // Tap Processing Logic
    const rawTapsQuery = query(collection(db, 'raw_taps'), orderBy('timestamp', 'desc'));
    const unsubscribeTaps = onSnapshot(rawTapsQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const tapData = change.doc.data();
          const tapId = change.doc.id;
          
          // Process the tap
          const student = students.find(s => s.uid === tapData.uid);
          if (student) {
            // Check if already recorded in the last 5 minutes to prevent double-taps
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const recentAttendance = attendance.find(a => 
              a.studentUid === student.uid && 
              (a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)) > fiveMinutesAgo
            );

            if (!recentAttendance) {
              await addDoc(collection(db, 'attendance'), {
                studentUid: student.uid,
                studentName: student.name,
                timestamp: serverTimestamp(),
                status: 'PRESENT', // Logic for LATE can be added here
                deviceId: tapData.deviceId || 'ESP32-AUTO'
              });
              toast.success(`Attendance recorded for ${student.name}`);
            }
          } else {
            toast.warning(`Unknown card tapped: ${tapData.uid}`);
          }
          
          // Delete the raw tap after processing (optional, depends on architecture)
          // For this demo, we'll keep them but you could delete them to save space
        }
      }
    });

    return () => {
      unsubscribeStudents();
      unsubscribeAttendance();
      unsubscribeTaps();
    };
  }, [user, students, attendance]);

  const simulateTap = async (uid: string) => {
    try {
      await addDoc(collection(db, 'raw_taps'), {
        uid,
        timestamp: serverTimestamp(),
        deviceId: 'SIMULATOR'
      });
    } catch (error) {
      toast.error('Simulation failed');
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully logged in');
    } catch (error) {
      console.error(error);
      toast.error('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out');
    } catch (error) {
      console.error(error);
    }
  };

  const addStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newStudent = {
      uid: formData.get('uid') as string,
      name: formData.get('name') as string,
      studentId: formData.get('studentId') as string,
      email: formData.get('email') as string,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'students'), newStudent);
      toast.success('Student added successfully');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'students');
      toast.error('Failed to add student');
    }
  };

  // --- Analytics Data ---
  const stats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayAttendance = attendance.filter(log => {
      const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      return logDate.setHours(0, 0, 0, 0) === today;
    });

    const presentCount = todayAttendance.filter(a => a.status === 'PRESENT').length;
    const lateCount = todayAttendance.filter(a => a.status === 'LATE').length;
    const totalStudents = students.length;

    return {
      totalStudents,
      todayPresent: presentCount,
      todayLate: lateCount,
      attendanceRate: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0
    };
  }, [students, attendance]);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, 'MMM dd');
    }).reverse();

    return last7Days.map(day => {
      const dayLogs = attendance.filter(log => {
        const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        return format(logDate, 'MMM dd') === day;
      });
      return {
        name: day,
        present: dayLogs.filter(l => l.status === 'PRESENT').length,
        late: dayLogs.filter(l => l.status === 'LATE').length,
      };
    });
  }, [attendance]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-none shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center">
                <ClipboardCheck className="text-primary" size={32} />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold tracking-tight">Smart Attendance</CardTitle>
                <CardDescription className="text-lg">Professional Student Management System</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                Securely manage student attendance with real-time RFID integration and advanced analytics.
              </p>
              <Button onClick={handleLogin} className="w-full h-12 text-lg font-semibold gap-2" size="lg">
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                Sign in with Google
              </Button>
            </CardContent>
            <CardFooter className="justify-center border-t py-4">
              <p className="text-xs text-muted-foreground">Authorized Personnel Only</p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col p-4 gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary rounded-lg p-2">
            <ClipboardCheck className="text-white" size={24} />
          </div>
          <h1 className="font-bold text-xl tracking-tight">SmartAttend</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Users} 
            label="Students" 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')} 
          />
          <SidebarItem 
            icon={ClipboardCheck} 
            label="Attendance" 
            active={activeTab === 'attendance'} 
            onClick={() => setActiveTab('attendance')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="border-t pt-4">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
              <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold text-sm truncate">{user.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight capitalize">{activeTab}</h2>
            <p className="text-muted-foreground">
              {activeTab === 'dashboard' && 'Welcome back! Here is what is happening today.'}
              {activeTab === 'students' && 'Manage your student database and RFID cards.'}
              {activeTab === 'attendance' && 'Real-time attendance logs and history.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search..." 
                className="pl-10 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="bg-white">
              <Bell size={18} />
            </Button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                    <Users className="text-primary" size={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                    <p className="text-xs text-muted-foreground mt-1">+2 from last month</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Present Today</CardTitle>
                    <CheckCircle2 className="text-emerald-500" size={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.todayPresent}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stats.attendanceRate}% attendance rate</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Late Today</CardTitle>
                    <Clock className="text-amber-500" size={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.todayLate}</div>
                    <p className="text-xs text-muted-foreground mt-1">Requires follow-up</p>
                  </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Absent Today</CardTitle>
                    <XCircle className="text-destructive" size={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalStudents - stats.todayPresent}</div>
                    <p className="text-xs text-muted-foreground mt-1">Based on registered students</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-white border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Attendance Trends</CardTitle>
                    <CardDescription>Daily attendance for the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Recent Taps</CardTitle>
                    <CardDescription>Latest RFID activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {attendance.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${
                            log.status === 'PRESENT' ? 'bg-emerald-500' : 
                            log.status === 'LATE' ? 'bg-amber-500' : 'bg-destructive'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{log.studentName}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'hh:mm a') : 'Just now'}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase">{log.status}</Badge>
                        </div>
                      ))}
                      {attendance.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No activity recorded yet.</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="w-full space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Test Simulation</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-[10px]" onClick={() => simulateTap('AA:BB:CC:DD')}>
                          Tap Alice
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-[10px]" onClick={() => simulateTap('AB:CD:12:34')}>
                          Tap Brian
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Student Directory</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <UserPlus size={18} />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Register New Student</DialogTitle>
                      <DialogDescription>
                        Enter student details and link their RFID card UID.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={addStudent} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" placeholder="John Doe" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentId">Student ID</Label>
                        <Input id="studentId" name="studentId" placeholder="STU-2026-001" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="uid">RFID UID</Label>
                        <Input id="uid" name="uid" placeholder="AA:BB:CC:DD" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" placeholder="john@example.com" />
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full">Save Student</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="bg-white border-none shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead>Student</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>RFID UID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {student.name.charAt(0)}
                            </div>
                            {student.name}
                          </div>
                        </TableCell>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell>
                          <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">{student.uid}</code>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{student.email || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {student.createdAt?.toDate ? format(student.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <MoreVertical size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {students.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          No students registered yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Live Attendance Stream</h3>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <Calendar size={18} />
                    Filter Date
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Filter size={18} />
                    Export CSV
                  </Button>
                </div>
              </div>

              <Card className="bg-white border-none shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead>Student Name</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Device</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.filter(a => a.studentName.toLowerCase().includes(searchQuery.toLowerCase())).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.studentName}</TableCell>
                        <TableCell>
                          {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'hh:mm:ss a') : 'Live'}
                        </TableCell>
                        <TableCell>
                          {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'MMM dd, yyyy') : 'Today'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              log.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none' : 
                              log.status === 'LATE' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none' : 
                              'bg-rose-100 text-rose-700 hover:bg-rose-100 border-none'
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {log.deviceId || 'ESP32-MAIN'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {attendance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          No attendance logs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl space-y-8"
            >
              <Card className="bg-white border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Hardware Configuration</CardTitle>
                  <CardDescription>Use these details to configure your ESP32 device.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-900 rounded-lg overflow-x-auto">
                    <pre className="text-xs text-emerald-400 font-mono">
{`// Firebase Configuration for ESP32
#define FIREBASE_HOST "${(firebaseConfig as any).projectId}.firebaseio.com"
#define FIREBASE_AUTH "YOUR_DATABASE_SECRET"
#define DATABASE_URL "https://${(firebaseConfig as any).projectId}-default-rtdb.firebaseio.com/"`}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <Label>Device ID</Label>
                    <Input value="ESP32-MAIN-ROOM-101" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Late Threshold (Minutes after start)</Label>
                    <Input type="number" defaultValue={15} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Configuration</Button>
                </CardFooter>
              </Card>

              <Card className="bg-white border-none shadow-sm">
                <CardHeader>
                  <CardTitle>System Permissions</CardTitle>
                  <CardDescription>Manage teacher and admin access.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">Owner / Administrator</p>
                    </div>
                    <Badge>ACTIVE</Badge>
                  </div>
                  <Button variant="outline" className="w-full gap-2">
                    <UserPlus size={18} />
                    Invite Teacher
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
