import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import UploadExcel from './components/UploadExcel';
import UpdateWeeklyScore from './components/UpdateWeeklyScore';
import Login from './components/Login';
import Stats from './components/Stats';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Flex direction="column" minH="100vh">
      <Navbar />
      <Box flex="1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Box p={8}>
                  <Stats/>
                </Box>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <ProtectedRoute>
                <Box p={8}>
                  <Stats />
                </Box>
              </ProtectedRoute>
            }
          />
          <Route
            path="/course-data"
            element={
              <ProtectedRoute>
                <Box p={8}>
                  <Dashboard />
                </Box>
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <Box p={8}>
                  <StudentList />
                </Box>
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Box p={8}>
                  <UploadExcel />
                </Box>
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-weekly-score"
            element={
              <ProtectedRoute>
                <Box p={8}>
                  <UpdateWeeklyScore />
                </Box>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Box>
      <Footer />
    </Flex>
  );
}

export default App;