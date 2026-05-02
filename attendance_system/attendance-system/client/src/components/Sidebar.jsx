import { LayoutDashboard, Users, BookOpen, List, CalendarDays } from 'lucide-react'

const links = [
  { id: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { id: 'timetable',  label: 'Timetable',  icon: CalendarDays    },
  { id: 'students',   label: 'Students',   icon: Users            },
  { id: 'class',      label: 'Classes',    icon: BookOpen         },
  { id: 'scans',      label: 'Scan Log',   icon: List             },
]

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col p-4 gap-2">
      <h1 className="text-xl font-bold text-blue-400 mb-6">Smart Attendance System</h1>
      {links.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => setPage(id)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition
            ${page === id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
          <Icon size={16} />{label}
        </button>
      ))}
    </aside>
  )
}
