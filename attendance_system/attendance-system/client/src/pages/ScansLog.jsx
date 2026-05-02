import { useState } from 'react'
import { useList } from '../hooks/useRealtime'

export default function ScansLog() {
  const [filter, setFilter] = useState('')
  const { data: classes } = useList('classes')
  const { data: allScans } = useList('scans')
  
  const scans = filter ? allScans.filter(s => s.class_id === filter) : allScans

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Scan Log</h2>
        <select
          className="bg-gray-800 border border-gray-700 text-sm rounded-lg px-3 py-2 text-white"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map(c => (
            <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">Student</th>
              <th className="text-left px-4 py-3">Class</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {scans.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-gray-600 py-6">No scans yet</td></tr>
            ) : scans.map((s, i) => (
              <tr key={i} className="border-t border-gray-800">
                <td className="px-4 py-3">{s.name || s.uid}</td>
                <td className="px-4 py-3 text-blue-400">{s.class_id}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.type === 'IN' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                    {s.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{s.timestamp}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}