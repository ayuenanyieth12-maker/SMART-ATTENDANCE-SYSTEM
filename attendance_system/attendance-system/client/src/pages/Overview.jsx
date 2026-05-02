import { useEffect, useState } from 'react'
import axios from 'axios'
import { Users, CheckCircle, BookOpen } from 'lucide-react'

const API = 'http://localhost:3001'

export default function Overview({ setPage, setSelectedClass }) {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [live, setLive] = useState([])

  useEffect(() => {
    axios.get(`${API}/students`).then(r => setStudents(r.data))
    axios.get(`${API}/classes`).then(r => setClasses(r.data))
    axios.get(`${API}/live`).then(r => setLive(r.data))
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">School Overview</h2>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Users size={20} />} label="Total Students" value={students.length} color="blue" />
        <StatCard icon={<CheckCircle size={20} />} label="Currently IN" value={live.length} color="green" />
        <StatCard icon={<BookOpen size={20} />} label="Classes" value={classes.length} color="purple" />
      </div>

      <h3 className="text-lg font-semibold">Classes</h3>
      <div className="grid grid-cols-2 gap-4">
        {classes.map(cls => (
          <button
            key={cls.class_id}
            onClick={() => { setSelectedClass(cls.class_id); setPage('class') }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-blue-500 transition"
          >
            <p className="text-blue-400 font-semibold">{cls.class_name}</p>
            <p className="text-gray-500 text-sm">{cls.class_id}</p>
            <p className="text-gray-400 text-sm mt-2">
              {live.filter(l => l.class_id === cls.class_id).length} students currently in
            </p>
          </button>
        ))}
      </div>

      <h3 className="text-lg font-semibold">Currently IN</h3>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">Student</th>
              <th className="text-left px-4 py-3">Class</th>
              <th className="text-left px-4 py-3">Entry Time</th>
            </tr>
          </thead>
          <tbody>
            {live.length === 0 ? (
              <tr><td colSpan={3} className="text-center text-gray-600 py-6">No students currently in</td></tr>
            ) : live.map((s, i) => (
              <tr key={i} className="border-t border-gray-800">
                <td className="px-4 py-3">{s.name || s.uid}</td>
                <td className="px-4 py-3 text-blue-400">{s.class_id}</td>
                <td className="px-4 py-3 text-gray-400">{s.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'text-blue-400 bg-blue-900/30',
    green: 'text-green-400 bg-green-900/30',
    purple: 'text-purple-400 bg-purple-900/30',
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}