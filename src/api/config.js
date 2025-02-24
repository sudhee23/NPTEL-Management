export const getApiUrl = (endpoint) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/students';
  return `${baseUrl}${endpoint}`;
};

export const endpoints = {
  facultyNames: '/faculty-names',
  facultyCourses: '/faculty-courses',
  updateWeekScore: '/updateweekscore',
  courseStats: '/courses/stats',
  unsubmittedStudents: (courseId) => `/courses/${courseId}/unsubmitted`,
  facultyCoursesData: '/faculty-courses-data'
}; 