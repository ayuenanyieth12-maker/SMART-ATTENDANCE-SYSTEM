import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Overview from './pages/Overview'
import ClassView from './pages/ClassView'
import Students from './pages/Students'
import ScansLog from './pages/ScansLog'
import StudentProfile from './pages/StudentProfile'
import Timetable from './pages/Timetable'

export default function App() {
  const [page,            setPage]            = useState('overview')
  const [selectedClass,   setSelectedClass]   = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) navigate('/admin-login')
  }, [])

  const renderPage = () => {
    switch (page) {
      case 'overview':   return <Overview   setPage={setPage} setSelectedClass={setSelectedClass} />
      case 'timetable':  return <Timetable />
      case 'class':      return <ClassView  classId={selectedClass} />
      case 'students':   return <Students   setPage={setPage} setSelectedStudent={setSelectedStudent} />
      case 'profile':    return <StudentProfile uid={selectedStudent} onBack={() => setPage('students')} />
      case 'scans':      return <ScansLog />
      default:           return <Overview />
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar page={page} setPage={setPage} />
      <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>
    </div>
  )
}
