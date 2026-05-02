import { useState } from 'react';
import { useList } from '../hooks/useRealtime';
import { db } from '../firebase';
import { ref, set } from 'firebase/database';

export default function Registration() {
  const { data: students } = useList('students');
  const { data: scans } = useList('scans');

  const [selectedUid, setSelectedUid] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    course: '',
    year_of_study: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const getAvgForStudent = (uid) => {
    const studentScans = scans.filter(s => s.uid === uid)
    if (studentScans.length === 0) return 0
    const sessions = new Set(studentScans.map(s => s.timestamp.split(' ')[0])).size
    const target = 10 
    return Math.min(Math.round((sessions / target) * 100), 100)
  }

  // Find unique UIDs from scans that are not in students
  const studentUids = new Set(students.map(s => s.uid));
  const scannedUids = new Set(scans.map(s => s.uid).filter(Boolean));
  const unregisteredUids = [...scannedUids].filter(uid => !studentUids.has(uid));

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedUid) {
      setError('Please select a UID to register.');
      return;
    }
    if (!formData.name || !formData.student_id) {
      setError('Name and Student ID are required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await set(ref(db, 'students/' + selectedUid), {
        uid: selectedUid,
        ...formData
      });
      setSuccess(true);
      setFormData({
        name: '',
        student_id: '',
        course: '',
        year_of_study: '',
        email: '',
        password: ''
      });
      setSelectedUid('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to register student: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h2 className="text-2xl font-bold">Dynamic Card Registration</h2>
        <p className="text-gray-400 mt-1">Register new unknown RFID cards scanned by the ESP32.</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Unregistered Cards</h3>
        {unregisteredUids.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-700 rounded-xl bg-gray-800/20">
            No unregistered cards found. Scan a new card at the ESP32 device first.
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-900/30 border border-green-700 text-green-400 text-sm px-4 py-3 rounded-xl animate-pulse">
                Card successfully registered!
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Select Unregistered UID <span className="text-red-500">*</span></label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                value={selectedUid}
                onChange={(e) => setSelectedUid(e.target.value)}
                required
              >
                <option value="">-- Select a UID --</option>
                {unregisteredUids.map(uid => (
                  <option key={uid} value={uid}>{uid}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Student ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="e.g. STU2024005"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Course</label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="e.g. Bachelor of Software Engineering"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Year of Study</label>
                <input
                  type="text"
                  name="year_of_study"
                  value={formData.year_of_study}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="e.g. Year 3"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="e.g. student@university.edu"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Portal Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder="Default password"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition disabled:opacity-50 w-full md:w-auto"
              >
                {loading ? 'Registering...' : 'Register Card'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
          <h3 className="text-lg font-semibold">Registered Cards (Students)</h3>
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">{students.length} Total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="text-left px-4 py-3">UID</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Student ID</th>
                <th className="text-left px-4 py-3">Standing</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={3} className="text-center text-gray-600 py-6">No students registered yet</td></tr>
              ) : (
                students.map((s, i) => (
                  <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">{s.uid}</td>
                    <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{s.student_id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvgForStudent(s.uid) >= 75 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                        {getAvgForStudent(s.uid) >= 75 ? 'Good' : 'At Risk'} ({getAvgForStudent(s.uid)}%)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
