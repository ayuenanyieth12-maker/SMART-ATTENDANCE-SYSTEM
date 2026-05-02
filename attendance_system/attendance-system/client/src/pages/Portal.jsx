import { useState } from 'react'
import { useList } from '../hooks/useRealtime'
import { LogOut, User, Hash, BookOpen, Calendar, Shield, Menu, X } from 'lucide-react'

export default function Portal() {
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [student, setStudent] = useState(null)
  
  const { data: students } = useList('students')
  const { data: allScans } = useList('scans')
  const { data: classes } = useList('classes')

  const handleLogin = async () => {
    setError('')
    const found = students.find(s => 
      (s.student_id === loginIdentifier || s.name === loginIdentifier || s.email === loginIdentifier) 
      && s.password === password
    )
    
    if (found) {
      // Derive profile data
      const scans = allScans.filter(s => s.uid === found.uid)
      const attendance = classes.map(cls => {
        const classScans = scans.filter(s => s.class_id === cls.class_id)
        const times_present = classScans.filter(s => s.type === 'IN').length
        const total_sessions = 10 
        const percentage = Math.min(Math.round((times_present / total_sessions) * 100), 100)
        return { ...cls, times_present, total_sessions, percentage }
      })
      
      const overallPercentage = attendance.length > 0
        ? Math.round(attendance.reduce((s, a) => s + a.percentage, 0) / attendance.length)
        : 0
        
      setStudent({
        ...found,
        overallPercentage,
        attendance,
        recentScans: scans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)
      })
    } else {
      setError('Invalid Student ID or password')
    }
  }

  if (!student) {
    return (
      <div className="min-h-screen w-full bg-gray-950 flex">

        {/* Left Panel */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-400 blur-3xl" />
            <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-blue-600 blur-3xl" />
          </div>
          <div className="relative z-10 text-center space-y-6">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur">
              <Shield size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Smart Attendance</h1>
            <p className="text-blue-200 text-lg max-w-sm">
              Track your attendance across all classes in one place.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              {['Real-time Tracking', 'Class Breakdown', 'Scan History', 'Attendance %'].map((f, i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-3 text-white text-sm font-medium">
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-950">
          <div className="w-full max-w-md space-y-8">

            <div>
              <h2 className="text-3xl font-bold text-white">Student Portal</h2>
              <p className="text-gray-400 mt-2">Sign in to view your attendance record</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">ID, Name, or Email</label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="Enter your ID, Name, or Email"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="••••••••"
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                Sign In
              </button>
            </div>

            <p className="text-center text-gray-600 text-xs">
              Admin?{' '}
              <a href="/admin-login" className="text-blue-400 hover:underline">Go to Admin Login</a>
            </p>

          </div>
        </div>

      </div>
    )
  }

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const statusGood = student.overallPercentage >= 75

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white flex flex-col lg:flex-row">

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-blue-400" />
          <span className="text-blue-400 font-bold">Portal</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-800 rounded-lg">
          <Menu size={20} />
        </button>
      </div>

      {/* Left Sidebar */}
      <div className={`
        fixed lg:sticky top-0 left-0 z-40 w-72 h-screen bg-gray-900 border-r border-gray-800 flex flex-col p-6 gap-6 transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Overlay for mobile */}
        {isSidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/60 -z-10" onClick={() => setIsSidebarOpen(false)} />}

        {/* Branding */}
        <div className="flex items-center gap-2 mb-2">
          <Shield size={20} className="text-blue-400" />
          <span className="text-blue-400 font-bold text-lg">Student Portal</span>
        </div>

        {/* Avatar + Name */}
        <div className="bg-gray-800 rounded-2xl p-5 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold mx-auto">
            {student.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{student.name}</p>
            <p className="text-gray-400 text-xs mt-1">{student.course}</p>
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            statusGood ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}>
            {statusGood ? 'Good Standing' : 'At Risk'}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3">
          {[
            { icon: <Hash size={14} />, label: 'Student ID', value: student.student_id },
            { icon: <BookOpen size={14} />, label: 'Course', value: student.course },
            { icon: <Calendar size={14} />, label: 'Year', value: student.year_of_study },
            { icon: <User size={14} />, label: 'Card UID', value: student.uid },
          ].map((item, i) => (
            <div key={i} className="bg-gray-800/60 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                {item.icon} {item.label}
              </div>
              <p className="text-white text-xs font-medium truncate">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Sign Out */}
        <button
          onClick={() => {
            setStudent(null);
            window.location.href = '/';
          }}
          className="mt-auto flex items-center gap-2 text-gray-400 hover:text-white text-sm transition px-2 py-2 rounded-lg hover:bg-gray-800"
        >
          <LogOut size={15} /> Sign Out
        </button>

      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-8 space-y-6">

        <div>
          <h2 className="text-2xl font-bold">My Attendance</h2>
          <p className="text-gray-400 text-sm mt-1">Here's your attendance summary across all classes</p>
        </div>

        {/* Overall Attendance Card */}
        <div className={`rounded-2xl p-6 border ${
          statusGood
            ? 'bg-green-900/20 border-green-800'
            : 'bg-red-900/20 border-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Overall Attendance</p>
              <p className={`text-6xl font-bold mt-1 ${statusGood ? 'text-green-400' : 'text-red-400'}`}>
                {student.overallPercentage}%
              </p>
              <p className={`text-sm mt-2 ${statusGood ? 'text-green-500' : 'text-red-500'}`}>
                {statusGood
                  ? 'You are meeting the minimum attendance requirement'
                  : 'Your attendance is below the 75% minimum requirement'}
              </p>
            </div>
            <div className="w-28 h-28 rounded-full border-8 flex items-center justify-center"
              style={{ borderColor: statusGood ? '#16a34a' : '#dc2626' }}>
              <span className={`text-2xl font-bold ${statusGood ? 'text-green-400' : 'text-red-400'}`}>
                {student.overallPercentage}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${statusGood ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${student.overallPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="text-yellow-500">75% minimum</span>
            <span>100%</span>
          </div>
        </div>

        {/* Per Class Attendance */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Attendance Per Class</h3>
          {student.attendance.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">
              No attendance records yet. Scan your card to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {student.attendance.map((cls, i) => {
                const good = cls.percentage >= 75
                return (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-white text-sm">{cls.class_name || cls.class_id}</p>
                        <p className="text-gray-500 text-xs mt-1">{cls.class_id}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        good ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                      }`}>
                        {good ? 'Good' : 'At Risk'}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-400">{cls.times_present} of {cls.total_sessions} sessions</span>
                        <span className={good ? 'text-green-400' : 'text-red-400'}>{cls.percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${good ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${cls.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Scans */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Scans</h3>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400">
                <tr>
                  <th className="text-left px-6 py-3">Class</th>
                  <th className="text-left px-6 py-3">Type</th>
                  <th className="text-left px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {student.recentScans.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-600 py-8">No scans recorded yet</td>
                  </tr>
                ) : student.recentScans.map((scan, i) => (
                  <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="px-6 py-3 text-blue-400">{scan.class_name || scan.class_id}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        scan.type === 'IN'
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-red-900/40 text-red-400'
                      }`}>
                        {scan.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">{scan.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}