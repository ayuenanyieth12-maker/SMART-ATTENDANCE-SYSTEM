const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./attendance.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to SQLite database.');
});

db.serialize(() => {

  // ── Core tables ──────────────────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    student_id TEXT,
    course TEXT,
    year_of_study TEXT,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT UNIQUE NOT NULL,
    class_name TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT NOT NULL,
    class_id TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp TEXT NOT NULL
  )`);

  // ── NEW: Timetable ────────────────────────────────────────────────────────
  // day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday,
  //              4=Thursday, 5=Friday, 6=Saturday
  // start_time / end_time: "HH:MM" 24-hour format
  db.run(`CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
  )`);

  // ── NEW: Enrollments ──────────────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT NOT NULL,
    class_id TEXT NOT NULL,
    UNIQUE(uid, class_id),
    FOREIGN KEY (uid) REFERENCES students(uid),
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
  )`);

  // ── Seed: Students ────────────────────────────────────────────────────────
  db.run(`INSERT OR IGNORE INTO students (uid, name, student_id, course, year_of_study, password) VALUES
    ('77:E3:35:25', 'EPAJU PIUS JUNIOR',  'STU2024001', 'Bachelor of Software Engineering', 'Year 3', 'pius123'),
    ('35:7E:DD:E0', 'AYUEN AGUEK',        'STU2024002', 'Bachelor of Software Engineering', 'Year 3', 'aguek123')`);

  // ── Seed: Classes ─────────────────────────────────────────────────────────
  db.run(`INSERT OR IGNORE INTO classes (class_id, class_name) VALUES
    ('BDA2104', 'ASP.NET & C#'),
    ('BSE314',  'Internet of Things'),
    ('COM221',  'Operating Systems Principles'),
    ('DB2010',  'Database Management Systems')`);

  // ── Seed: Timetable ───────────────────────────────────────────────────────
  // Only insert if the table is empty so re-runs don't duplicate rows
  db.get(`SELECT COUNT(*) as cnt FROM timetable`, [], (err, row) => {
    if (!err && row.cnt === 0) {
      db.run(`INSERT INTO timetable (class_id, day_of_week, start_time, end_time) VALUES
        ('BSE314',  1, '08:00', '10:00'),   -- Mon  08:00-10:00  IoT
        ('DB2010',  1, '14:00', '16:00'),   -- Mon  14:00-16:00  DBMS
        ('BDA2104', 2, '10:00', '12:00'),   -- Tue  10:00-12:00  ASP.NET
        ('COM221',  3, '08:00', '10:00'),   -- Wed  08:00-10:00  OS
        ('BSE314',  3, '14:00', '16:00'),   -- Wed  14:00-16:00  IoT
        ('DB2010',  4, '10:00', '12:00'),   -- Thu  10:00-12:00  DBMS
        ('BDA2104', 5, '08:00', '10:00'),   -- Fri  08:00-10:00  ASP.NET
        ('COM221',  5, '12:00', '14:00')    -- Fri  12:00-14:00  OS
      `);
    }
  });

  // ── Seed: Enrollments ─────────────────────────────────────────────────────
  // Both students are enrolled in all 4 units (same programme, same year)
  db.run(`INSERT OR IGNORE INTO enrollments (uid, class_id) VALUES
    ('77:E3:35:25', 'BDA2104'),
    ('77:E3:35:25', 'BSE314'),
    ('77:E3:35:25', 'COM221'),
    ('77:E3:35:25', 'DB2010'),
    ('35:7E:DD:E0', 'BDA2104'),
    ('35:7E:DD:E0', 'BSE314'),
    ('35:7E:DD:E0', 'COM221'),
    ('35:7E:DD:E0', 'DB2010')`);
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: get the currently active timetable slot (if any)
// Returns { class_id, class_name, start_time, end_time } or null
// ─────────────────────────────────────────────────────────────────────────────
function getActiveClass(callback) {
  const now  = new Date();
  const day  = now.getDay();                                     // 0-6
  const hhmm = now.getHours().toString().padStart(2, '0') + ':' +
               now.getMinutes().toString().padStart(2, '0');     // "HH:MM"

  db.get(`
    SELECT t.class_id, c.class_name, t.start_time, t.end_time
    FROM timetable t
    LEFT JOIN classes c ON t.class_id = c.class_id
    WHERE t.day_of_week = ?
      AND t.start_time <= ?
      AND t.end_time   >  ?
  `, [day, hhmm, hhmm], (err, row) => {
    if (err) return callback(err, null);
    callback(null, row || null);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /active-class  →  what class is running right now?
// ─────────────────────────────────────────────────────────────────────────────
app.get('/active-class', (req, res) => {
  getActiveClass((err, cls) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(cls || { none: true });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /timetable  →  full weekly timetable (for dashboard)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/timetable', (req, res) => {
  db.all(`
    SELECT t.*, c.class_name
    FROM timetable t
    LEFT JOIN classes c ON t.class_id = c.class_id
    ORDER BY t.day_of_week, t.start_time
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /scan  →  the main endpoint the ESP32 calls
//
// Logic:
//   1. Is the UID known?         → No  → 404 unknown card
//   2. Is there an active class? → No  → 403 no class running
//   3. Is student enrolled?      → No  → 403 not enrolled
//   4. All good                  → record scan ✅
//
// The ESP32 no longer needs to send class_id — it's derived from the timetable.
// (If class_id IS sent, we still validate it; handy for manual/test POSTs.)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/scan', (req, res) => {
  const { uid, type, timestamp } = req.body;
  if (!uid || !type || !timestamp)
    return res.status(400).json({ error: 'Missing fields' });

  // 1. Look up the student
  db.get(`SELECT * FROM students WHERE uid = ?`, [uid], (err, student) => {
    if (err)      return res.status(500).json({ error: err.message });
    if (!student) return res.status(404).json({ error: 'Unknown card', uid });

    // 2. Find the active class right now
    getActiveClass((err2, activeClass) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (!activeClass) {
        return res.status(403).json({
          error: 'No class is running right now',
          student: student.name
        });
      }

      const class_id = activeClass.class_id;

      // 3. Check enrollment
      db.get(`SELECT * FROM enrollments WHERE uid = ? AND class_id = ?`,
        [uid, class_id], (err3, enrolled) => {
          if (err3) return res.status(500).json({ error: err3.message });
          if (!enrolled) {
            return res.status(403).json({
              error: 'Student not enrolled in this class',
              student: student.name,
              class_id,
              class_name: activeClass.class_name
            });
          }

          // 4. Record the scan ✅
          db.run(
            `INSERT INTO scans (uid, class_id, type, timestamp) VALUES (?, ?, ?, ?)`,
            [uid, class_id, type, timestamp],
            function (err4) {
              if (err4) return res.status(500).json({ error: err4.message });
              res.json({
                message: 'Scan recorded',
                id: this.lastID,
                student: student.name,
                class_id,
                class_name: activeClass.class_name
              });
            }
          );
        }
      );
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
app.post('/student-login', (req, res) => {
  const { student_id, password } = req.body;
  if (!student_id || !password)
    return res.status(400).json({ error: 'Missing credentials' });
  db.get(`SELECT * FROM students WHERE student_id = ? AND password = ?`,
    [student_id, password], (err, row) => {
      if (err)  return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: 'Invalid credentials' });
      const { password: _, ...student } = row;
      res.json(student);
    });
});

app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123')
    res.json({ success: true, token: 'admin-token-2024' });
  else
    res.status(401).json({ error: 'Invalid admin credentials' });
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/students', (req, res) => {
  db.all(`SELECT * FROM students`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/students/:uid', (req, res) => {
  const uid = decodeURIComponent(req.params.uid);
  db.get(`SELECT * FROM students WHERE uid = ?`, [uid], (err, student) => {
    if (err)      return res.status(500).json({ error: err.message });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Attendance: based on enrolled classes (not just scanned ones)
    db.all(`
      SELECT
        e.class_id,
        c.class_name,
        COUNT(CASE WHEN sc.type = 'IN' THEN 1 END) as times_present,
        (SELECT COUNT(DISTINCT DATE(timestamp)) FROM scans WHERE class_id = e.class_id) as total_sessions
      FROM enrollments e
      LEFT JOIN classes c ON e.class_id = c.class_id
      LEFT JOIN scans sc ON sc.uid = e.uid AND sc.class_id = e.class_id
      WHERE e.uid = ?
      GROUP BY e.class_id
    `, [uid], (err2, attendance) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const attendanceWithPercentage = attendance.map(row => ({
        ...row,
        percentage: row.total_sessions > 0
          ? Math.round((row.times_present / row.total_sessions) * 100) : 0
      }));

      const totalPresent  = attendanceWithPercentage.reduce((s, r) => s + r.times_present,  0);
      const totalSessions = attendanceWithPercentage.reduce((s, r) => s + r.total_sessions, 0);
      const overallPercentage = totalSessions > 0
        ? Math.round((totalPresent / totalSessions) * 100) : 0;

      db.all(`
        SELECT scans.*, classes.class_name FROM scans
        LEFT JOIN classes ON scans.class_id = classes.class_id
        WHERE scans.uid = ?
        ORDER BY scans.timestamp DESC LIMIT 10
      `, [uid], (err3, recentScans) => {
        if (err3) return res.status(500).json({ error: err3.message });
        const { password: _, ...safeStudent } = student;
        res.json({ ...safeStudent, attendance: attendanceWithPercentage, overallPercentage, recentScans });
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLASSES
// ─────────────────────────────────────────────────────────────────────────────
app.get('/classes', (req, res) => {
  db.all(`SELECT * FROM classes`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SCANS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/scans', (req, res) => {
  const { class_id } = req.query;
  let query  = `SELECT scans.*, students.name FROM scans LEFT JOIN students ON scans.uid = students.uid`;
  let params = [];
  if (class_id) { query += ` WHERE scans.class_id = ?`; params.push(class_id); }
  query += ` ORDER BY scans.timestamp DESC`;
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────
app.get('/attendance', (req, res) => {
  const { class_id } = req.query;
  // Only include enrolled students for the given class
  let query = `
    SELECT s.uid, s.name, e.class_id,
      COUNT(CASE WHEN sc.type = 'IN' THEN 1 END) as times_present,
      (SELECT COUNT(DISTINCT DATE(timestamp)) FROM scans WHERE class_id = e.class_id) as total_sessions
    FROM enrollments e
    JOIN students s ON s.uid = e.uid
    LEFT JOIN scans sc ON sc.uid = e.uid AND sc.class_id = e.class_id
    ${class_id ? 'WHERE e.class_id = ?' : ''}
    GROUP BY s.uid, e.class_id
  `;
  db.all(query, class_id ? [class_id] : [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => ({
      ...row,
      percentage: row.total_sessions > 0
        ? Math.round((row.times_present / row.total_sessions) * 100) : 0
    })));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LIVE
// ─────────────────────────────────────────────────────────────────────────────
app.get('/live', (req, res) => {
  const { class_id } = req.query;
  let query = `
    SELECT scans.uid, students.name, scans.class_id, scans.timestamp
    FROM scans LEFT JOIN students ON scans.uid = students.uid
    WHERE scans.type = 'IN'
    AND scans.id IN (SELECT MAX(id) FROM scans GROUP BY uid, class_id)
    ${class_id ? 'AND scans.class_id = ?' : ''}
  `;
  db.all(query, class_id ? [class_id] : [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// KIOSK
// ─────────────────────────────────────────────────────────────────────────────
app.get('/kiosk/latest', (req, res) => {
  db.get(`
    SELECT scans.*, students.name, students.student_id, students.course, students.year_of_study
    FROM scans LEFT JOIN students ON scans.uid = students.uid
    ORDER BY scans.id DESC LIMIT 1
  `, [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENTS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/enrollments/:uid', (req, res) => {
  const uid = decodeURIComponent(req.params.uid);
  db.all(`
    SELECT e.class_id, c.class_name
    FROM enrollments e
    LEFT JOIN classes c ON e.class_id = c.class_id
    WHERE e.uid = ?
  `, [uid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/enrollments', (req, res) => {
  const { uid, class_id } = req.body;
  db.run(`INSERT OR IGNORE INTO enrollments (uid, class_id) VALUES (?, ?)`,
    [uid, class_id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Enrolled' });
    });
});

app.delete('/enrollments', (req, res) => {
  const { uid, class_id } = req.body;
  db.run(`DELETE FROM enrollments WHERE uid = ? AND class_id = ?`,
    [uid, class_id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Unenrolled' });
    });
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));
