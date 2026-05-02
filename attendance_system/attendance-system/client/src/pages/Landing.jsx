import { useNavigate } from 'react-router-dom'
import { Shield, UserCircle, GraduationCap } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl text-center space-y-12">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-900/50">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Smart <span className="text-blue-500">Attendance</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
            Cavendish University Attendance Management System. 
            Select your portal to continue.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 px-4">
          {/* Admin Card */}
          <button 
            onClick={() => navigate('/admin-login')}
            className="group relative bg-gray-900/50 border border-gray-800 hover:border-blue-500/50 rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-900/20 text-left"
          >
            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-500">
              <UserCircle size={32} className="text-blue-500 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">University Staff</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Administrative access for lecturers and registrars. Manage classes, reports, and student registrations.
            </p>
            <div className="mt-6 flex items-center text-blue-500 font-semibold text-sm group-hover:translate-x-2 transition-transform">
              Admin Login →
            </div>
          </button>

          {/* Student Card */}
          <button 
            onClick={() => navigate('/portal')}
            className="group relative bg-gray-900/50 border border-gray-800 hover:border-indigo-500/50 rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-900/20 text-left"
          >
            <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-500">
              <GraduationCap size={32} className="text-indigo-500 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Student Portal</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Access your personal attendance records, standing status, and scan history.
            </p>
            <div className="mt-6 flex items-center text-indigo-500 font-semibold text-sm group-hover:translate-x-2 transition-transform">
              Enter Portal →
            </div>
          </button>
        </div>

        <p className="text-gray-600 text-sm pt-8">
          © 2026 Smart Attendance System • Built for Professional Standards
        </p>
      </div>
    </div>
  )
}
