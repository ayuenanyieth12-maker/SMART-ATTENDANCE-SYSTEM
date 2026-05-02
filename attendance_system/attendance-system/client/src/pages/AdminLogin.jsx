import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError('')
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      localStorage.setItem('adminToken', user.accessToken)
      navigate('/admin')
    } catch (err) {
      console.error(err)
      setError('Invalid email or password')
    }
  }

  const handleRegister = async () => {
    setError('')
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      localStorage.setItem('adminToken', userCredential.user.accessToken)
      navigate('/admin')
    } catch (err) {
      console.error(err)
      setError('Failed to create account: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm space-y-6">

        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            A
          </div>
          <h1 className="text-2xl font-bold text-white">{isRegistering ? 'Create Admin' : 'Admin Login'}</h1>
          <p className="text-gray-400 text-sm mt-1">Smart Attendance System</p>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded-lg">{error}</p>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Email</label>
            <input
              type="email"
               value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="admin@university.edu"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (isRegistering ? handleRegister() : handleLogin())}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
           <button
            onClick={isRegistering ? handleRegister : handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
          >
            {isRegistering ? 'Register Admin' : 'Sign In'}
          </button>
          
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full text-blue-400 text-xs hover:underline mt-2"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'Need to create the first Admin account? Sign Up'}
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs">
          Student? <a href="/portal" className="text-blue-400 hover:underline">Go to Student Portal</a>
        </p>

      </div>
    </div>
  )
}