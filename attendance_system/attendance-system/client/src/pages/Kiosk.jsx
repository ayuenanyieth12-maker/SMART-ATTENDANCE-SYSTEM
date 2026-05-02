import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:3001'

export default function Kiosk() {
  const [scan, setScan] = useState(null)
  const [lastId, setLastId] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/kiosk/latest`)
        if (res.data && res.data.id !== lastId) {
          setLastId(res.data.id)
          setScan(res.data)
          setVisible(true)
          setTimeout(() => setVisible(false), 5000)
        }
      } catch (err) {
        console.error(err)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [lastId])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
      {!visible ? (

        // Waiting screen
        <div className="text-center space-y-6">
          <div className="w-32 h-32 rounded-full border-4 border-blue-500 flex items-center justify-center mx-auto animate-pulse">
            <div className="w-14 h-14 rounded-full bg-blue-500" />
          </div>
          <h1 className="text-4xl font-bold text-white">Tap Your Card</h1>
          <p className="text-gray-400 text-lg">Place your RFID card on the reader</p>
        </div>

      ) : (

        // Scan result
        <div className="text-center space-y-6">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto text-5xl font-bold ${
            scan?.type === 'IN' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {scan?.name?.charAt(0)}
          </div>

          <div>
            <h1 className="text-5xl font-bold">{scan?.name}</h1>
            <p className="text-gray-400 text-lg mt-2">{scan?.course}</p>
            <p className="text-gray-500 text-sm mt-1">{scan?.student_id} · {scan?.year_of_study}</p>
          </div>

          <div className={`inline-block px-8 py-4 rounded-full text-2xl font-bold border-2 ${
            scan?.type === 'IN'
              ? 'bg-green-900/40 text-green-400 border-green-500'
              : 'bg-red-900/40 text-red-400 border-red-500'
          }`}>
            {scan?.type === 'IN' ? '✓ Checked In' : '✗ Checked Out'}
          </div>

          <p className="text-gray-500">{scan?.class_id} · {scan?.timestamp}</p>
        </div>

      )}
    </div>
  )
}