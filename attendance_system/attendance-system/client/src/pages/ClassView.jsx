import { useList, useObject } from '../hooks/useRealtime'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

export default function ClassView({ classId }) {
  const { data: cls } = useObject(`classes/${classId}`)
  const { data: allScans } = useList('scans')
  const { data: students } = useList('students')

  const scans = allScans.filter(s => s.class_id === classId)

  // Derive attendance for each student in this class
  // For now, let's just show all students. In a real app, we'd check enrollments.
  const attendance = students.map(s => {
    const studentScans = scans.filter(sc => sc.uid === s.uid)
    const times_present = studentScans.filter(sc => sc.type === 'IN').length
    const total_sessions = new Set(scans.map(sc => sc.timestamp.split(' ')[0])).size
    const percentage = total_sessions > 0 ? Math.round((times_present / total_sessions) * 100) : 0
    return { ...s, times_present, total_sessions, percentage }
  })

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
      <h2 className="text-2xl font-bold">Class: {cls?.class_name || classId}</h2>
      <p className="text-gray-400">{live.length} student(s) currently in this class</p>

      <div className="grid grid-cols-2 gap-4">
        {attendance.map((s, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-16 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="60%"
                  outerRadius="100%"
                  data={[{ value: s.percentage, fill: s.percentage >= 75 ? '#22c55e' : '#ef4444' }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="font-semibold">{s.name}</p>
              <p className={`text-lg font-bold ${s.percentage >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                {s.percentage}%
              </p>
              <p className="text-gray-500 text-xs">{s.times_present} / {s.total_sessions} sessions</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}