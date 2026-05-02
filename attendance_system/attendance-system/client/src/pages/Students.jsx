import { useList } from '../hooks/useRealtime'

export default function Students({ setPage, setSelectedStudent }) {
  const { data: students } = useList('students')
  const { data: scans } = useList('scans')

  const getAvgForStudent = (uid) => {
    const studentScans = scans.filter(s => s.uid === uid)
    if (studentScans.length === 0) return 0
    const sessions = new Set(studentScans.map(s => s.timestamp.split(' ')[0])).size
    const target = 10 
    return Math.min(Math.round((sessions / target) * 100), 100)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Students</h2>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Student ID</th>
              <th className="text-left px-4 py-3">Course</th>
              <th className="text-left px-4 py-3">Avg Attendance</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const avg = getAvgForStudent(s.uid)
              return (
                <tr
                  key={i}
                  className="border-t border-gray-800 hover:bg-gray-800 cursor-pointer transition"
                  onClick={() => {
                    setSelectedStudent(s.uid)
                    setPage('profile')
                  }}
                >
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{s.student_id || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{s.course || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full">
                        <div
                          className={`h-2 rounded-full ${avg >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${avg}%` }}
                        />
                      </div>
                      <span className={avg >= 75 ? 'text-green-400' : 'text-red-400'}>{avg}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${avg >= 75 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                      {avg >= 75 ? 'Good' : 'At Risk'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}