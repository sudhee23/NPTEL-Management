import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Select,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Skeleton,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const Stats = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseStats, setCourseStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Add state for overall stats
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalSubmissions: 0,
    averageSubmissionRate: 0
  });

  // Add state for overall weekly stats
  const [overallWeeklyStats, setOverallWeeklyStats] = useState([]);

  // Add state for all students
  const [allStudents, setAllStudents] = useState([]);

  // Update selected week to be null initially
  const [selectedWeek, setSelectedWeek] = useState('');

  // Use Vite's environment variable syntax
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First fetch all students
        const studentsResponse = await axios.get(`${API_BASE_URL}/students`);
        const fetchedStudents = studentsResponse.data;
        setAllStudents(fetchedStudents);
        
        // Initialize counters with better tracking
        let totalSubmissions = 0;
        let totalStudents = new Set();
        const submissionsByBranch = new Map();
        const enrollmentsByBranch = new Map();
        const uniqueStudentsByBranch = new Map();

        // Count submissions and enrollments
        fetchedStudents.forEach(student => {
          totalStudents.add(student.rollNumber);
          
          // Track student's courses by branch
          student.courses?.forEach(course => {
            if (course.courseId.toLowerCase().startsWith('noc')) {
              const branch = course.courseId.split('-')[1]?.replace(/\d+/g, '').toUpperCase();
              if (!branch) return;

              // Track enrollments
              enrollmentsByBranch.set(
                branch, 
                (enrollmentsByBranch.get(branch) || 0) + 1
              );

              // Track unique students per branch
              if (!uniqueStudentsByBranch.has(branch)) {
                uniqueStudentsByBranch.set(branch, new Set());
              }
              uniqueStudentsByBranch.get(branch).add(student.rollNumber);

              // Count submissions
              course.results?.forEach(result => {
                if (result.score > 0) {
                  totalSubmissions++;
                  submissionsByBranch.set(
                    branch,
                    (submissionsByBranch.get(branch) || 0) + 1
                  );
                }
              });
            }
          });
        });

        // Log detailed breakdown for verification
        console.log('Detailed Statistics:', {
          totalSubmissions,
          byBranch: Object.fromEntries(
            Array.from(enrollmentsByBranch.entries()).map(([branch, enrollments]) => [
              branch,
              {
                enrollments,
                uniqueStudents: uniqueStudentsByBranch.get(branch)?.size || 0,
                submissions: submissionsByBranch.get(branch) || 0
              }
            ])
          ),
          totalStudents: totalStudents.size
        });

        // Verify EE branch specifically
        console.log('EE Branch Details:', {
          enrollments: enrollmentsByBranch.get('EE') || 0,
          uniqueStudents: uniqueStudentsByBranch.get('EE')?.size || 0,
          submissions: submissionsByBranch.get('EE') || 0
        });

        // Now fetch course stats
        const response = await axios.get(`${API_BASE_URL}/students/courses/stats`);
        console.log('Full API Response:', response.data);
        
        if (!response.data.courses || response.data.courses.length === 0) {
          console.log('No courses found in response');
          setError('No NOC26-B courses found. Please check if courses are uploaded with correct course IDs.');
          toast({
            title: 'No courses found',
            description: 'No NOC26-B courses are available. Please check if courses are uploaded correctly.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          setCourses([]);
        } else {
          console.log('Found courses:', response.data.courses);
          
          // Format courses for dropdown
          const formattedCourses = response.data.courses.map(course => ({
            ...course,
            displayName: course.courseName 
              ? `${course.courseName} (${course.courseId.toUpperCase()})`
              : `Course ${course.courseId.toUpperCase()}`  // Fallback if no course name
          }));
          setCourses(formattedCourses);

          // Calculate weekly stats
          const weeklyStats = Array.from({ length: 12 }, (_, i) => ({
            week: `Week ${i + 1}`,
            submitted: 0,
            unsubmitted: 0,
            total: 0
          }));

          // Process each student's submissions
          fetchedStudents.forEach(student => {
            student.courses?.forEach(course => {
              course.results?.forEach(result => {
                // Extract week number from the result
                const weekMatch = result.week.match(/Week (\d+)/);
                if (weekMatch) {
                  const weekIndex = parseInt(weekMatch[1]) - 1;
                  if (weekIndex >= 0 && weekIndex < 12) {
                    weeklyStats[weekIndex].total++;
                    if (result.score > 0) {
                      weeklyStats[weekIndex].submitted++;
                    } else {
                      weeklyStats[weekIndex].unsubmitted++;
                    }
                  }
                }
              });
            });
          });

          // Calculate submission rates
          const processedWeeklyStats = weeklyStats.map(week => ({
            ...week,
            submissionRate: week.total > 0 
              ? ((week.submitted / week.total) * 100).toFixed(2)
              : '0'
          }));

          console.log('Weekly Stats:', processedWeeklyStats);

          // Update states
          setOverallStats({
            totalStudents: totalStudents.size,
            totalCourses: formattedCourses.length,
            totalSubmissions,
            averageSubmissionRate: (processedWeeklyStats.reduce((sum, week) => 
              sum + parseFloat(week.submissionRate), 0) / 12).toFixed(2)
          });

          setOverallWeeklyStats(processedWeeklyStats);
        }

        // Log final counts
        console.log('Stats Component Counts:', {
          totalStudents: totalStudents.size,
          totalSubmissions,
          courses: courses.length
        });
      } catch (error) {
        console.error('Error details:', error.response || error);
        const errorMessage = error.response?.status === 404 
          ? 'API endpoint not found. Please check server configuration.'
          : error.response?.data?.message || error.message || 'Failed to fetch courses';
        
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [toast]);

  useEffect(() => {
    if (selectedCourse) {
      const fetchCourseStats = async () => {
        setLoading(true);
        try {
          // Get the course's stats from the overall stats we already have
          const selectedCourseData = courses.find(c => c.courseId === selectedCourse);
          if (!selectedCourseData) {
            throw new Error('Course not found');
          }

          // Calculate course-specific stats
          const courseStudents = allStudents.filter(student => 
            student.courses?.some(course => course.courseId === selectedCourse)
          );

          const weeklyStats = Array.from({ length: 12 }, (_, i) => ({
            week: `Week ${i + 1}`,
            submitted: 0,
            unsubmitted: 0,
            total: 0,
            submissionRate: '0'
          }));

          let totalSubmissions = 0;

          // Calculate weekly stats for this course
          courseStudents.forEach(student => {
            const course = student.courses.find(c => c.courseId === selectedCourse);
            course?.results?.forEach(result => {
              const weekMatch = result.week.match(/Week (\d+)/);
              if (weekMatch) {
                const weekIndex = parseInt(weekMatch[1]) - 1;
                if (weekIndex >= 0 && weekIndex < 12) {
                  weeklyStats[weekIndex].total++;
                  if (result.score > 0) {
                    weeklyStats[weekIndex].submitted++;
                    totalSubmissions++;
                  } else {
                    weeklyStats[weekIndex].unsubmitted++;
                  }
                }
              }
            });
          });

          // Calculate submission rates
          weeklyStats.forEach(week => {
            week.submissionRate = week.total > 0 
              ? ((week.submitted / week.total) * 100).toFixed(2)
              : '0';
          });

          const averageSubmissionRate = weeklyStats.reduce((sum, week) => 
            sum + parseFloat(week.submissionRate), 0) / 12;

          setCourseStats({
            courseName: selectedCourseData.displayName,
            courseId: selectedCourse,
            totalStudents: courseStudents.length,
            overallStats: {
              totalSubmissions,
              averageSubmissionRate: averageSubmissionRate.toFixed(2)
            },
            weeklyStats
          });

        } catch (error) {
          console.error('Error fetching course stats:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch course statistics',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setLoading(false);
        }
      };
      fetchCourseStats();
    }
  }, [selectedCourse, courses, allStudents, toast]);

  // Add debug output for courses state
  console.log('Current courses state:', courses);

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={6}>
        <Heading size="lg" mb={4}>Course Statistics</Heading>

        {error && (
          <Alert status="warning">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Overall Stats Section - Always visible */}
        <Box>
          <Heading size="md" mb={4}>Overall Statistics</Heading>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Courses</StatLabel>
                  <StatNumber>{overallStats.totalCourses}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Students</StatLabel>
                  <StatNumber>{overallStats.totalStudents}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Submissions</StatLabel>
                  <StatNumber>{overallStats.totalSubmissions.toLocaleString()}</StatNumber>
                  <StatHelpText>
                    Across all weeks and courses
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Average Submission Rate</StatLabel>
                  <StatNumber>{overallStats.averageSubmissionRate}%</StatNumber>
                  <StatHelpText>
                    Overall completion rate
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Overall Weekly Statistics - Always visible */}
        <Box>
          <Heading size="md" mb={4}>Overall Weekly Statistics</Heading>
          
          {/* Week Selection Dropdown - Move this to the top */}
          <FormControl mb={6}>
            <FormLabel>Select Week to View Details</FormLabel>
            <Select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              <option value="">Select a week</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Week {i + 1}
                </option>
              ))}
            </Select>
          </FormControl>

          {/* Bar Chart */}
          <Box h="400px" mb={6}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overallWeeklyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="submitted" name="Submitted" fill="#48BB78" />
                <Bar dataKey="unsubmitted" name="Not Submitted" fill="#F56565" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Overall Weekly Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
            {overallWeeklyStats.map((week, index) => (
              <Card key={week.week}>
                <CardHeader>
                  <Heading size="md">Week {index + 1}</Heading>
                </CardHeader>
                <CardBody>
                  <Stack spacing={3}>
                    <Box>
                      <Text color="green.500" fontWeight="medium">
                        Submitted: {week.submitted.toLocaleString()}
                      </Text>
                      <Text color="red.500" fontWeight="medium">
                        Not Submitted: {week.unsubmitted.toLocaleString()}
                      </Text>
                      <Text color="gray.500">
                        Total: {week.total.toLocaleString()}
                      </Text>
                    </Box>
                    <Box>
                      <Text mb={2}>Submission Rate: {week.submissionRate}%</Text>
                      <Progress 
                        value={week.submissionRate} 
                        colorScheme={week.submissionRate > 50 ? "green" : "orange"}
                        borderRadius="full"
                      />
                    </Box>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Selected Week Details - Only show when a week is selected */}
          {selectedWeek && overallWeeklyStats[selectedWeek - 1] && (
            <Box>
              <Heading size="md" mb={4}>Week {selectedWeek} Details</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {/* Submitted Courses */}
                <Card>
                  <CardHeader>
                    <Heading size="sm" color="green.500">
                      Courses with Submissions - Week {selectedWeek}
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={2}>
                      {courses.filter(course => {
                        const weekStats = course.weeklyStats?.[parseInt(selectedWeek) - 1];
                        return weekStats && weekStats.submitted > 0;
                      }).map(course => (
                        <Box
                          key={course.courseId}
                          p={3}
                          bg="green.50"
                          borderRadius="md"
                          _hover={{ bg: 'green.100' }}
                        >
                          <Text fontWeight="medium">
                            {course.displayName || `Course ${course.courseId.toUpperCase()}`}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Course ID: {course.courseId.toUpperCase()}
                          </Text>
                          <Text fontSize="sm" color="green.600">
                            Submissions: {course.weeklyStats[parseInt(selectedWeek) - 1]?.submitted || 0}
                          </Text>
                        </Box>
                      ))}
                    </Stack>
                  </CardBody>
                </Card>

                {/* Courses without Data */}
                <Card>
                  <CardHeader>
                    <Heading size="xs" color="red.500">
                      Pending Courses ({overallWeeklyStats[selectedWeek - 1].unsubmitted})
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={2}>
                      {courses
                        .filter(course => 
                          overallWeeklyStats[selectedWeek - 1].coursesWithoutData
                            .includes(course.courseId)
                        )
                        .map(course => (
                          <Box 
                            key={course.courseId}
                            p={2}
                            bg="red.50"
                            borderRadius="md"
                            cursor="pointer"
                            onClick={() => setSelectedCourse(course.courseId)}
                            _hover={{ bg: 'red.100' }}
                          >
                            <Text fontWeight="medium">{course.displayName}</Text>
                            <Text fontSize="sm" color="gray.600">
                              No data for Week {selectedWeek}
                            </Text>
                          </Box>
                        ))
                      }
                    </Stack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </Box>
          )}
        </Box>

        {/* Course Selection */}
        <Box>
          <Heading size="md" mb={4}>Course Details</Heading>
          <FormControl>
            <FormLabel>Select Course</FormLabel>
            <Select 
              placeholder="Choose a course..."
              value={selectedCourse || ''}
              onChange={(e) => setSelectedCourse(e.target.value)}
              isDisabled={loading || courses.length === 0}
            >
              {courses.map((course) => (
                <option key={course.courseId} value={course.courseId}>
                  {course.displayName}
                </option>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Selected Course Stats - Only visible when course is selected */}
        {selectedCourse && courseStats && (
          <Box>
            <Heading size="md" mb={4}>Course Specific Statistics</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {/* Overall Stats */}
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Students</StatLabel>
                    <StatNumber>{courseStats.totalStudents}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Submissions</StatLabel>
                    <StatNumber>{courseStats.overallStats.totalSubmissions}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Average Submission Rate</StatLabel>
                    <StatNumber>{courseStats.overallStats.averageSubmissionRate}%</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>
        )}

        {/* Weekly Stats - Only visible when course is selected */}
        {selectedCourse && courseStats && (
          <Box>
            <Heading size="md" mb={4}>Weekly Statistics</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {courseStats.weeklyStats.map((week, index) => (
                <Card key={week.week}>
                  <CardHeader>
                    <Heading size="md">Week {index + 1}</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={3}>
                      <Box>
                        <Text color="green.500" fontWeight="medium">
                          Submitted: {week.submitted}
                        </Text>
                        <Text color="red.500" fontWeight="medium">
                          Not Submitted: {week.unsubmitted}
                        </Text>
                        <Text color="gray.500">
                          Total: {week.total}
                        </Text>
                      </Box>
                      <Box>
                        <Text mb={2}>Submission Rate: {week.submissionRate}%</Text>
                        <Progress 
                          value={week.submissionRate} 
                          colorScheme={week.submissionRate > 50 ? "green" : "orange"}
                          borderRadius="full"
                        />
                      </Box>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {loading && (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} height="200px" />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
};

export default Stats; 