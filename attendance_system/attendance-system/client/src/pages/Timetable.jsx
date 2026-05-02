import { useEffect, useState } from 'react'
import axios from 'axios'
import { Clock, Wifi } from 'lucide-react'

const API = 'http://localhost:3001'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CLASS_COLORS = {
  BSE314:  { bg: 'bg-blue-900/40',   border: 'border-blue-700',   text: 'text-blue-300',   dot: 'bg-blue-400'   },
  BDA2104: { bg: 'bg-purple-900/40', border: 'border-purple-700', text: 'text-purple-300', dot: 'bg-purple-400' },
  COM221:  { bg: 'bg-orange-900/40', border: 'border-orange-700', text: 'text-orange-300', dot: 'bg-orange-400' },
  DB2010:  { bg: 'bg-green-900/40',  border: 'border-green-700',  text: 'text-green-300',  dot: 'bg-green-400'  },
}

export default function Timetable() {
  const [timetable,   setTimetable]   = useState([])
  const [activeClass, setActiveClass] = useState(null)
  const [now,         setNow]         = useState(new Date())

  useEffect(() => {
    axios.get(`${API}/timetable`).then(r => setTimetable(r.data))
    axios.get(`${API}/active-class`).then(r => setActiveClass(r.data?.none ? null : r.data))

    // Refresh clock every minute
    const tick = setInterval(() => {
      setNow(new Date())
      axios.get(`${API}/active-class`).then(r => setActiveClass(r.data?.none ? null : r.data))
    }, 60_000)
    return () => clearInterval(tick)
  }, [])

  const today = now.getDay()

  // Group timetable rows by day
  const byDay = DAYS.map((_, i) =>
    timetable.filter(row => row.day_of_week === i)
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
  )

  const fmt12 = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number)
    const suffix = h >= 12 ? 'PM' : 'AM'
    const h12    = h % 12 || 12
    return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`
  }

  const timeNow = now.getHours().toString().padStart(2, '0') + ':' +
                  now.getMinutes().toString().padStart(2, '0')

  const isActive = (row) =>
    row.day_of_week === today &&
    row.start_time <= timeNow &&
    row.end_time   >  timeNow

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weekly Timetable</h2>
          <p className="text-gray-400 text-sm mt-1">
            {DAYS[today]}, {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Active class banner */}
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${
          activeClass
            ? 'bg-green-900/30 border-green-700'
            : 'bg-gray-900 border-gray-700'
        }`}>
          <Wifi size={16} className={activeClass ? 'text-green-400' : 'text-gray-500'} />
          <div>
            <p className="text-xs text-gray-400">Active Right Now</p>
            {activeClass
              ? <p className="text-sm font-semibold text-green-300">{activeClass.class_name}</p>
              : <p className="text-sm text-gray-500">No class running</p>
            }
          </div>
          {activeClass && (
            <span className="ml-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(CLASS_COLORS).map(([id, c]) => {
          const cls = timetable.find(r => r.class_id === id)
          if (!cls) return null
          return (
            <div key={id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${c.bg} ${c.border}`}>
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              <span className={`text-xs font-medium ${c.text}`}>{cls.class_name}</span>
              <span className="text-xs text-gray-500">{id}</span>
            </div>
          )
        })}
      </div>

      {/* Grid — show Mon→Fri only */}
      <div className="grid grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map(dayIdx => (
          <div key={dayIdx}
            className={`rounded-xl border p-3 space-y-2 ${
              dayIdx === today
                ? 'border-blue-600 bg-blue-950/20'
                : 'border-gray-800 bg-gray-900'
            }`}>

            {/* Day header */}
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-bold ${dayIdx === today ? 'text-blue-400' : 'text-gray-300'}`}>
                {DAYS[dayIdx]}
              </p>
              {dayIdx === today && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Today</span>
              )}
            </div>

            {/* Slots */}
            {byDay[dayIdx].length === 0
              ? <p className="text-gray-600 text-xs text-center py-4">No classes</p>
              : byDay[dayIdx].map((slot, i) => {
                  const colors  = CLASS_COLORS[slot.class_id] || { bg: 'bg-gray-800', border: 'border-gray-600', text: 'text-gray-300', dot: 'bg-gray-400' }
                  const running = isActive(slot)
                  return (
                    <div key={i}
                      className={`rounded-lg border p-3 space-y-1 transition ${colors.bg} ${colors.border} ${
                        running ? 'ring-2 ring-white/20 shadow-lg' : ''
                      }`}>
                      <div className="flex items-center gap-1.5">
                        {running && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />}
                        <p className={`text-xs font-bold truncate ${colors.text}`}>
                          {slot.class_name}
                        </p>
                      </div>
                      <p className="text-gray-500 text-xs font-mono">
                        {slot.class_id}
                      </p>
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <Clock size={10} />
                        {fmt12(slot.start_time)} – {fmt12(slot.end_time)}
                      </div>
                      {running && (
                        <p className="text-xs text-green-400 font-medium">● Running now</p>
                      )}
                    </div>
                  )
                })
            }
          </div>
        ))}
      </div>

      {/* Weekend note */}
      <p className="text-gray-600 text-xs text-center">
        Saturday &amp; Sunday — No scheduled classes
      </p>

    </div>
  )
}
