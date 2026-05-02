import { db } from './firebase';
import { ref, set, push } from 'firebase/database';

const students = [
  { uid: '77:E3:35:25', name: 'EPAJU PIUS JUNIOR', student_id: 'STU2024001', course: 'Bachelor of Software Engineering', year_of_study: 'Year 3' },
  { uid: '35:7E:DD:E0', name: 'AYUEN AGUEK', student_id: 'STU2024002', course: 'Bachelor of Software Engineering', year_of_study: 'Year 3' }
];

const classes = [
  { class_id: 'BDA2104', class_name: 'ASP.NET & C#' },
  { class_id: 'BSE314', class_name: 'Internet of Things' },
  { class_id: 'COM221', class_name: 'Operating Systems Principles' },
  { class_id: 'DB2010', class_name: 'Database Management Systems' }
];

const timetable = [
  { class_id: 'BSE314', day_of_week: 1, start_time: '08:00', end_time: '10:00' },
  { class_id: 'DB2010', day_of_week: 1, start_time: '14:00', end_time: '16:00' },
  { class_id: 'BDA2104', day_of_week: 2, start_time: '10:00', end_time: '12:00' },
  { class_id: 'COM221', day_of_week: 3, start_time: '08:00', end_time: '10:00' },
  { class_id: 'BSE314', day_of_week: 3, start_time: '14:00', end_time: '16:00' },
  { class_id: 'DB2010', day_of_week: 4, start_time: '10:00', end_time: '12:00' },
  { class_id: 'BDA2104', day_of_week: 5, start_time: '08:00', end_time: '10:00' },
  { class_id: 'COM221', day_of_week: 5, start_time: '12:00', end_time: '14:00' }
];

export const seedDatabase = async () => {
  try {
    console.log('Starting seed...');
    
    for (const student of students) {
      await set(ref(db, 'students/' + student.uid), student);
    }
    
    for (const cls of classes) {
      await set(ref(db, 'classes/' + cls.class_id), cls);
    }
    
    for (const entry of timetable) {
      const id = `${entry.class_id}_${entry.day_of_week}`;
      await set(ref(db, 'timetable/' + id), entry);
    }
    
    console.log('Seed completed successfully!');
    alert('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding Database:', error);
    alert('Error seeding database: ' + error.message);
  }
};
