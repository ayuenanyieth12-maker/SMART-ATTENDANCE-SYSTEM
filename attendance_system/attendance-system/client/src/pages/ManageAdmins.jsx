import { useState } from 'react';
import { secondaryAuth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function ManageAdmins() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and Password are required');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use secondaryAuth to prevent logging out the current admin
      await createUserWithEmailAndPassword(secondaryAuth, email, password);
      setSuccess(`Admin account created for ${email}`);
      setEmail('');
      setPassword('');
      
      // Auto-dismiss success message
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to create admin: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h2 className="text-2xl font-bold">Manage Administrators</h2>
        <p className="text-gray-400 mt-1">Create new admin accounts with access to this dashboard.</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Add New Admin</h3>
        
        <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-md">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/30 border border-green-700 text-green-400 text-sm px-4 py-3 rounded-xl animate-pulse">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              placeholder="admin@university.edu"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              placeholder="Minimum 6 characters"
              required
              minLength="6"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Admin Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
