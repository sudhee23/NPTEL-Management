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
  courseDetails: (courseId) => `/students/courses/${courseId}/stats`,
  unsubmitted: (courseId, week) => `/students/courses/${courseId}/unsubmitted?week=${week}`,
  updateScore: '/students/updateweekscore',
};

export default api; 