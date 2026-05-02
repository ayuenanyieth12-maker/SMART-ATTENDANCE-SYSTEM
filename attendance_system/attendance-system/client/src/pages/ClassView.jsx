import { useEffect, useState } from 'react'
import axios from 'axios'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

const API = 'http://localhost:3001'

export default function ClassView({ classId }) {
  const [attendance, setAttendance] = useState([])
  const [live, setLive] = useState([])

  useEffect(() => {
    if (!classId) return
    axios.get(`${API}/attendance?class_id=${classId}`).then(r => setAttendance(r.data))
    axios.get(`${API}/live?class_id=${classId}`).then(r => setLive(r.data))
  }, [classId])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Class: {classId}</h2>
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