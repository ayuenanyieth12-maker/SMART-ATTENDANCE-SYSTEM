import { useList } from '../hooks/useRealtime'
import { Users, CheckCircle, BookOpen } from 'lucide-react'
import { seedDatabase } from '../seedDatabase'

export default function Overview({ setPage, setSelectedClass }) {
  const { data: students } = useList('students')
  const { data: classes } = useList('classes')
  const { data: scans } = useList('scans')

  // Derive "live" students (those whose latest scan is 'IN')
  const live = Object.values(
    scans.reduce((acc, scan) => {
      if (!acc[scan.uid] || new Date(scan.timestamp) > new Date(acc[scan.uid].timestamp)) {
        acc[scan.uid] = scan
      }
      return acc
    }, {})
  ).filter(s => s.type === 'IN')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">School Overview</h2>
        <button 
          onClick={seedDatabase}
          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-2 rounded-lg transition w-full sm:w-auto"
        >
          Seed Initial Data
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<Users size={20} />} label="Total Students" value={students.length} color="blue" />
        <StatCard icon={<CheckCircle size={20} />} label="Currently IN" value={live.length} color="green" />
        <StatCard icon={<BookOpen size={20} />} label="Classes" value={classes.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Classes List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Classes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.map(cls => (
              <button
                key={cls.class_id}
                onClick={() => { setSelectedClass(cls.class_id); setPage('class') }}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-blue-500 transition group"
              >
                <p className="text-blue-400 font-semibold group-hover:text-blue-300 transition">{cls.class_name}</p>
                <p className="text-gray-500 text-sm">{cls.class_id}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {live.filter(l => l.class_id === cls.class_id).length} currently in
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Live Attendance Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Live Attendance</h3>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-3">Student</th>
                    <th className="text-left px-4 py-3">Class</th>
                    <th className="text-left px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {live.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-gray-600 py-10">No students currently in</td></tr>
                  ) : live.map((s, i) => (
                    <tr key={i} className="border-t border-gray-800">
                      <td className="px-4 py-3 truncate max-w-[120px]">{students.find(st => st.uid === s.uid)?.name || s.uid}</td>
                      <td className="px-4 py-3 text-blue-400">{s.class_id}</td>
                      <td className="px-4 py-3 text-gray-400">{s.timestamp.split(' ')[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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