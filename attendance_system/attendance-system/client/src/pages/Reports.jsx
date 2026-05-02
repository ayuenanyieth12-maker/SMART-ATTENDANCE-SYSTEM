import { useState } from 'react';
import { useList } from '../hooks/useRealtime';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Reports() {
  const { data: classes } = useList('classes');
  const { data: students } = useList('students');
  const { data: scans } = useList('scans');

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Derive Report Data
  const getReportData = () => {
    // filter scans
    let filteredScans = scans;
    if (selectedClass) {
      filteredScans = filteredScans.filter(s => s.class_id === selectedClass);
    }
    if (selectedMonth) {
      filteredScans = filteredScans.filter(s => {
        // Assuming timestamp is "YYYY-MM-DD HH:MM:SS"
        if (!s.timestamp) return false;
        const month = s.timestamp.split('-')[1];
        return month === selectedMonth;
      });
    }

    // Now build attendance stats per student
    const report = students.map(student => {
      const studentScans = filteredScans.filter(s => s.uid === student.uid);
      const timesPresent = studentScans.filter(s => s.type === 'IN').length;
      
      const uniqueDates = new Set(filteredScans.map(s => s.timestamp.split(' ')[0])).size;
      const totalSessions = uniqueDates > 0 ? uniqueDates : 10;
      
      const percentage = Math.min(Math.round((timesPresent / totalSessions) * 100), 100);

      return {
        StudentName: student.name,
        StudentID: student.student_id,
        Course: student.course,
        Year: student.year_of_study,
        TimesPresent: timesPresent,
        TotalSessions: totalSessions,
        AttendancePercentage: `${percentage}%`,
        Standing: percentage >= 75 ? 'Good' : 'At Risk'
      };
    });

    return report;
  };

  const handleExportCSV = () => {
    const data = getReportData();
    if (data.length === 0) return alert('No data to export');

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_Report_${selectedClass || 'All'}_${selectedMonth || 'All'}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    const data = getReportData();
    if (data.length === 0) return alert('No data to export');

    const doc = new jsPDF();
    doc.text(`Attendance Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Class: ${selectedClass || 'All Classes'} | Month: ${months.find(m => m.value === selectedMonth)?.label || 'All Months'}`, 14, 22);

    const tableColumn = ["Student Name", "Student ID", "Course", "Present", "Total", "%", "Standing"];
    const tableRows = [];

    data.forEach(item => {
      const rowData = [
        item.StudentName,
        item.StudentID,
        item.Course,
        item.TimesPresent,
        item.TotalSessions,
        item.AttendancePercentage,
        item.Standing
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
    });

    doc.save(`Attendance_Report_${selectedClass || 'All'}_${selectedMonth || 'All'}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h2 className="text-2xl font-bold">Advanced Reporting & Exports</h2>
        <p className="text-gray-400 mt-1">Generate and download attendance records for the university.</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Filter by Class</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.class_id} value={c.class_id}>{c.class_name || c.class_id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Filter by Month</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-800">
          <button
            onClick={handleExportCSV}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition flex justify-center items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Export to Excel (CSV)
          </button>
          <button
            onClick={handleExportPDF}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition flex justify-center items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 18H8a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2"></path><path d="M14 18H14.01"></path><path d="M14 10H14.01"></path><path d="M18 10v8"></path></svg>
            Export to PDF
          </button>
        </div>
      </div>
      
      {/* Preview Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl mt-8">
        <div className="p-4 border-b border-gray-800 bg-gray-800/50">
          <h3 className="text-lg font-semibold text-white">Data Preview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="text-left px-4 py-3">Student Name</th>
                <th className="text-left px-4 py-3">Student ID</th>
                <th className="text-left px-4 py-3">Present</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">%</th>
                <th className="text-left px-4 py-3">Standing</th>
              </tr>
            </thead>
            <tbody>
              {getReportData().map((row, i) => (
                <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-white">{row.StudentName}</td>
                  <td className="px-4 py-3 text-gray-400">{row.StudentID}</td>
                  <td className="px-4 py-3 text-blue-400">{row.TimesPresent}</td>
                  <td className="px-4 py-3 text-gray-500">{row.TotalSessions}</td>
                  <td className="px-4 py-3 text-white font-bold">{row.AttendancePercentage}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.Standing === 'Good' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                      {row.Standing}
                    </span>
                  </td>
                </tr>
              ))}
              {getReportData().length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">No records match the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
