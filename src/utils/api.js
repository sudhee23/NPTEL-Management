import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nptel-management-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const endpoints = {
  students: '/students',
  courseStats: '/students/courses/stats',
  unsubmitted: (courseId) => `/students/courses/${courseId}/unsubmitted`,
  updateScore: '/students/updateweekscore',
};

export default api; 