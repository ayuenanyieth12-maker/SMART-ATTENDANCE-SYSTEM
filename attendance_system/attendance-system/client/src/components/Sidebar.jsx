import { useState } from 'react'
import { LayoutDashboard, Users, BookOpen, List, CalendarDays, Monitor, UserCircle, Menu, X, PlusCircle } from 'lucide-react'

const links = [
  { id: 'overview',   label: 'Overview',       icon: LayoutDashboard },
  { id: 'timetable',  label: 'Timetable',      icon: CalendarDays    },
  { id: 'students',   label: 'Students',       icon: Users            },
  { id: 'class',      label: 'Classes',        icon: BookOpen         },
  { id: 'scans',      label: 'Scan Log',       icon: List             },
  { id: 'registration', label: 'Card Registration', icon: PlusCircle   },
  { id: 'kiosk',      label: 'Kiosk Mode',     icon: Monitor          },
]

export default function Sidebar({ page, setPage }) {
  const [isOpen, setIsOpen] = useState(false)

  const SidebarContent = () => (
    <>
      <h1 className="text-xl font-bold text-blue-400 mb-6">Smart Attendance</h1>
      <nav className="flex flex-col gap-1.5">
        {links.map(({ id, label, icon: Icon }) => (
          <button 
            key={id} 
            onClick={() => { setPage(id); setIsOpen(false) }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
              ${page === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-gray-900 border-r border-gray-800 flex-col p-6 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <aside className="relative w-72 bg-gray-900 h-full p-6 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
