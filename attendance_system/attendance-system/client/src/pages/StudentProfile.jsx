import { useEffect, useState } from 'react'
import axios from 'axios'
import { ArrowLeft, User, Hash, BookOpen, Calendar } from 'lucide-react'

const API = 'http://localhost:3001'

export default function StudentProfile({ uid, onBack }) {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    axios.get(`${API}/students/${encodeURIComponent(uid)}`)
      .then(r => {
        setStudent(r.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [uid])

  if (loading) return <p className="text-gray-400">Loading...</p>
  if (!student) return <p className="text-gray-400">Student not found.</p>

  return (
    <div className="space-y-6">

      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm"
      >
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Profile Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
          {student.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{student.name}</h2>
          <p className="text-gray-400 text-sm">{student.course}</p>
        </div>
        <div className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
          student.overallPercentage >= 75
            ? 'bg-green-900/40 text-green-400'
            : 'bg-red-900/40 text-red-400'
        }`}>
          {student.overallPercentage >= 75 ? 'Good Standing' : 'At Risk'}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-4 gap-4">
        <InfoCard icon={<Hash size={16} />} label="Student ID" value={student.student_id} />
        <InfoCard icon={<BookOpen size={16} />} label="Course" value={student.course} />
        <InfoCard icon={<Calendar size={16} />} label="Year of Study" value={student.year_of_study} />
        <InfoCard icon={<User size={16} />} label="Card UID" value={student.uid} mono />
      </div>

      {/* Overall Attendance */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Overall Attendance</h3>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold" style={{
            color: student.overallPercentage >= 75 ? '#22c55e' : '#ef4444'
          }}>
            {student.overallPercentage}%
          </div>
          <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all ${
                student.overallPercentage >= 75 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${student.overallPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Per Class Attendance */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Attendance Per Class</h3>
        <div className="space-y-4">
          {student.attendance.length === 0 ? (
            <p className="text-gray-500 text-sm">No attendance records yet.</p>
          ) : student.attendance.map((cls, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">{cls.class_name || cls.class_id}</span>
                <span className={cls.percentage >= 75 ? 'text-green-400' : 'text-red-400'}>
                  {cls.percentage}% ({cls.times_present}/{cls.total_sessions} sessions)
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full ${cls.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${cls.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Scans */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold">Recent Scans</h3>
        </div>
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
                <td colSpan={3} className="text-center text-gray-600 py-6">No scans yet</td>
              </tr>
            ) : student.recentScans.map((scan, i) => (
              <tr key={i} className="border-t border-gray-800">
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
  )
}

function InfoCard({ icon, label, value, mono }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
        {icon}
        {label}
      </div>
      <p className={`text-sm font-medium truncate ${mono ? 'font-mono text-blue-400' : 'text-white'}`}>
        {value || '—'}
      </p>
    </div>
  )
}