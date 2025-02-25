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
  useToast,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td
} from '@chakra-ui/react';
import api, { endpoints } from '../utils/api';
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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First fetch all students
        const studentsResponse = await api.get(endpoints.students);
        console.log('Students response:', studentsResponse.data);
        const fetchedStudents = studentsResponse.data;
        setAllStudents(fetchedStudents);
        
        // Now fetch course stats
        const courseStatsResponse = await api.get(endpoints.courseStats);
        console.log('Course stats response:', courseStatsResponse.data);
        
        if (!courseStatsResponse.data.courses) {
          throw new Error('Invalid response format - missing courses data');
        }

        // Format courses for dropdown
        const formattedCourses = courseStatsResponse.data.courses.map(course => {
          // Define course names mapping
          const courseNames = {
            'noc25-ce04': 'Air Pollution and Control',
            'noc25-ee25': 'Digital VLSI Testing',
            'noc25-cs43': 'Introduction To Industry 4.0 And Industrial Internet Of Things',
            'noc25-ee76': 'Sensors and Actuators',
            'noc25-ch40': 'Renewable Energy Engineering: Solar, Wind And Biomass Energy Systems',
            'noc25-mm17': 'Introduction to Materials Science and Engineering',
            'noc25-ch06': 'Aspen Plus Simulation Software - A Basic Course for Chemical Engineers',
            'noc25-ch37': 'Physico-chemical Processes for Wastewater Treatment',
            'noc25-cs11': 'Cloud Computing',
            'noc25-cs21': 'Deep Learning - IIT Ropar',
            'noc25-ee83': 'VLSI Physical Design with Timing Analysis',
            'noc25-ee48': 'Microprocessors and Interfacing',
            'noc25-ee31': 'Embedded Sensing, Actuation and Interfacing System Design',
            'noc25-ee77': 'Signal Processing Techniques And Its Applications',
            'noc25-ee43': 'Integrated Circuits and Applications',
            'noc25-mm31': 'Welding Processes',
            'noc25-de02': 'Fundamentals of Automotive Systems',
            'noc25-ee79': 'Smart Grid: Basics to Advanced Technologies',
            'noc25-ce38': 'Maintenance and Repair of Concrete Structures',
            'noc25-ge11': 'Entrepreneurship Essentials',
            'noc25-cs52': 'Object Oriented System Development Using UML, Java And Patterns',
            'noc25-de07': 'Understanding Incubation and Entrepreneurship',
            'noc25-cs49': 'Machine Learning for Engineering and Science Applications',
            'noc25-de04': 'Strategies for Sustainable Design',
            'noc25-me67': 'Product Design and Manufacturing',
            'noc25-cs25': 'Digital Design with Verilog'
          };

          const courseName = courseNames[course.courseId.toLowerCase()] || course.courseName;
          
          return {
            ...course,
            courseName,
            displayName: `${courseName} (${course.courseId.toUpperCase()})`
          };
        });

        setCourses(formattedCourses);

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
      } catch (error) {
        console.error('API Error:', error);
        console.error('Error response:', error.response);
        const errorMessage = error.response 
          ? `Server error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`
          : error.request 
            ? 'Network error - No response from server'
            : error.message;
        
        setError(errorMessage);
        toast({
          title: 'Error fetching data',
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
    <Container 
      maxW="container.xl" 
      py={8} 
      px={{ base: 2, md: 8 }}
    >
      <Stack 
        spacing={{ base: 4, md: 8 }} 
        width="100%"
      >
        <Box>
          <Heading size="lg" mb={6}>Dashboard</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 6 }}>
            <Card width="100%" bg="blue.50">
              <CardBody>
                <Stat>
                  <StatLabel fontSize="lg" color="blue.700">Total Registrations</StatLabel>
                  <StatNumber fontSize="4xl" color="blue.600">3,017</StatNumber>
                  <StatHelpText color="blue.600">
                    Total NPTEL subject registrations
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card width="100%" bg="purple.50">
              <CardBody>
                <Stat>
                  <StatLabel fontSize="lg" color="purple.700">Total Courses</StatLabel>
                  <StatNumber fontSize="4xl" color="purple.600">26</StatNumber>
                  <StatHelpText color="purple.600">
                    Available NPTEL courses
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card width="100%" bg="green.50">
              <CardBody>
                <Stat>
                  <StatLabel fontSize="lg" color="green.700">Total Students</StatLabel>
                  <StatNumber fontSize="4xl" color="green.600">2,073</StatNumber>
                  <StatHelpText color="green.600">
                    Enrolled students
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        <Box mt={8}>
          <Heading size="lg" mb={6}>Branch-wise Statistics</Heading>
          <Box 
            overflowX="auto"
            borderRadius="lg"
            boxShadow="sm"
            bg="white"
          >
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th bg="gray.50" borderTopLeftRadius="lg">Branch</Th>
                  <Th isNumeric color="blue.700">E3 Students</Th>
                  <Th isNumeric color="blue.700">E4 Students</Th>
                  <Th isNumeric color="green.700">Total Students</Th>
                  <Th isNumeric color="purple.700">E3 Subjects</Th>
                  <Th isNumeric color="purple.700">E4 Subjects</Th>
                  <Th isNumeric color="purple.700">Total Subjects</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td fontWeight="semibold">CE</Td>
                  <Td isNumeric>63</Td>
                  <Td isNumeric>112</Td>
                  <Td isNumeric fontWeight="medium">175</Td>
                  <Td isNumeric>1</Td>
                  <Td isNumeric>1</Td>
                  <Td isNumeric>2</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="semibold">CHE</Td>
                  <Td isNumeric>42</Td>
                  <Td isNumeric>86</Td>
                  <Td isNumeric fontWeight="medium">128</Td>
                  <Td isNumeric>3</Td>
                  <Td isNumeric>2</Td>
                  <Td isNumeric>5</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="semibold">CSE</Td>
                  <Td isNumeric>363</Td>
                  <Td isNumeric>356</Td>
                  <Td isNumeric fontWeight="medium">719</Td>
                  <Td isNumeric>2</Td>
                  <Td isNumeric>1</Td>
                  <Td isNumeric>3</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="semibold">ECE</Td>
                  <Td isNumeric>361</Td>
                  <Td isNumeric>350</Td>
                  <Td isNumeric fontWeight="medium">711</Td>
                  <Td isNumeric>9</Td>
                  <Td isNumeric>2</Td>
                  <Td isNumeric>11</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="semibold">EEE</Td>
                  <Td isNumeric>118</Td>
                  <Td isNumeric>69</Td>
                  <Td isNumeric fontWeight="medium">187</Td>
                  <Td isNumeric>2</Td>
                  <Td isNumeric>1</Td>
                  <Td isNumeric>3</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="semibold">ME</Td>
                  <Td isNumeric>60</Td>
                  <Td isNumeric>50</Td>
                  <Td isNumeric fontWeight="medium">110</Td>
                  <Td isNumeric>3</Td>
                  <Td isNumeric>1</Td>
                  <Td isNumeric>4</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="semibold">MME</Td>
                  <Td isNumeric>25</Td>
                  <Td isNumeric>18</Td>
                  <Td isNumeric fontWeight="medium">43</Td>
                  <Td isNumeric>1</Td>
                  <Td isNumeric>1</Td>
                  <Td isNumeric>2</Td>
                </Tr>
                <Tr bg="gray.50">
                  <Td fontWeight="bold">Total</Td>
                  <Td isNumeric fontWeight="bold">1,032</Td>
                  <Td isNumeric fontWeight="bold">1,041</Td>
                  <Td isNumeric fontWeight="bold">2,073</Td>
                  <Td isNumeric fontWeight="bold">21</Td>
                  <Td isNumeric fontWeight="bold">9</Td>
                  <Td isNumeric fontWeight="bold">30</Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>
        </Box>

        <Heading size="lg" mb={4}>Course Statistics</Heading>

        {loading && (
          <Alert status="info">
            <AlertIcon />
            Loading data...
          </Alert>
        )}

        {error && (
          <Alert status="error">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Error loading data</Text>
              <Text fontSize="sm">{error}</Text>
            </Box>
          </Alert>
        )}

        {/* Overall Stats Section - Always visible */}
        <Box>
          <Heading size="md" mb={4}>Overall Statistics</Heading>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={{ base: 4, md: 6 }}>
            <Card width="100%">
              <CardBody>
                <Stat>
                  <StatLabel>Total Courses</StatLabel>
                  <StatNumber>{overallStats.totalCourses}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card width="100%">
              <CardBody>
                <Stat>
                  <StatLabel>Total Students</StatLabel>
                  <StatNumber>{overallStats.totalStudents}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card width="100%">
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
            <Card width="100%">
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
          <Heading size="md" mb={4}>Weekly Assignment Statistics</Heading>
          
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

          {/* Updated Weekly Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 6 }}>
            {overallWeeklyStats.map((week, index) => (
              <Card key={week.week} width="100%">
                <CardHeader>
                  <Heading size="md">Week {index + 1}</Heading>
                </CardHeader>
                <CardBody>
                  <Stack spacing={4}>
                    {/* Total Mentee Data Section */}
                    <Box borderBottom="1px" borderColor="gray.200" pb={3}>
                      <Text fontSize="md" fontWeight="bold" color="gray.700" mb={2}>
                        Total Mentee Data
                      </Text>
                      <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                        3,017
                      </Text>
                      <Text color="red.500" fontSize="sm">
                        Mentee Data Not Submitted: {3017 - (week.submitted + week.unsubmitted)}
                      </Text>
                    </Box>

                    {/* Assignment Data Section */}
                    <Box>
                      <Text fontSize="md" fontWeight="bold" color="gray.700" mb={2}>
                        Assignment Data
                      </Text>
                      <Stack spacing={2}>
                        <Text color="green.500" fontWeight="medium">
                          Submitted: {week.submitted}
                        </Text>
                        <Text color="red.500" fontWeight="medium">
                          Assignment Incomplete: {week.unsubmitted}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Total Processed: {week.submitted + week.unsubmitted}
                        </Text>
                      </Stack>
                    </Box>

                    {/* Submission Rate */}
                    <Box pt={2}>
                      <Text mb={2}>
                        Submission Rate: {((week.submitted / (week.submitted + week.unsubmitted)) * 100).toFixed(2)}%
                      </Text>
                      <Progress 
                        value={((week.submitted / (week.submitted + week.unsubmitted)) * 100)} 
                        colorScheme={week.submitted > week.unsubmitted ? "green" : "orange"}
                        borderRadius="full"
                      />
                    </Box>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Course Selection */}
        <Box width="100%" px={{ base: 4, md: 0 }}>
          <FormControl>
            <FormLabel>Select Course</FormLabel>
            <Select 
              placeholder="Choose a course..."
              value={selectedCourse || ''}
              onChange={(e) => setSelectedCourse(e.target.value)}
              isDisabled={loading || courses.length === 0}
              size={{ base: "md", md: "md" }}
              maxHeight="60px"
              overflowY="auto"
              sx={{
                '@media screen and (max-width: 48em)': {
                  // Custom styles for mobile
                  '& option': {
                    fontSize: 'sm',
                    padding: '8px',
                    whiteSpace: 'normal', // Allow text wrapping
                    wordBreak: 'break-word'
                  },
                  '&::-webkit-scrollbar': {
                    width: '4px'
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '2px'
                  }
                }
              }}
            >
              {courses.map((course) => (
                <option 
                  key={course.courseId} 
                  value={course.courseId}
                  style={{
                    padding: '8px',
                    fontSize: '14px'
                  }}
                >
                  {course.displayName}
                </option>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Selected Course Stats - Only visible when course is selected */}
        {selectedCourse && courseStats && (
          <Box>
            <Heading size="md" mb={4}>
              {courses.find(c => c.courseId === selectedCourse)?.courseName || 'Course Details'}
            </Heading>
            <Text color="gray.600" mb={4}>
              Course ID: {selectedCourse.toUpperCase()}
            </Text>
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
            <SimpleGrid 
              columns={{ base: 1, md: 3 }} 
              spacing={{ base: 4, md: 6 }}
              width="100%"
            >
              {courseStats.weeklyStats.map((week, index) => (
                <Card key={week.week} width="100%">
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