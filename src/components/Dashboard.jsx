import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Heading,
  Select,
  Stack,
  Card,
  CardBody,
  Text,
  HStack,
  Badge,
  Flex,
  Tooltip,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  Button,
  VStack,
  Skeleton,
  useToast,
} from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { RepeatIcon, InfoIcon, DownloadIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import axios from 'axios';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

function Dashboard() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    weeklyStats: [],
    branchStats: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [unsubmittedStudents, setUnsubmittedStudents] = useState([]);
  const [selectedFacultyStudents, setSelectedFacultyStudents] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isFacultyModalOpen,
    onOpen: onFacultyModalOpen,
    onClose: onFacultyModalClose
  } = useDisclosure();
  const toast = useToast();

  const [filters, setFilters] = useState({
    facultyName: '',
    year: '',
    branch: '',
    courseId: '',
    week: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    facultyNames: [],
    years: [],
    branches: [],
    courseIds: [],
    weeks: []
  });

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://nptel-management-backend.onrender.com/api/students');
        const fetchedStudents = response.data;
        
        console.log('Raw student count:', fetchedStudents.length);
        console.log('Course distribution:', 
          fetchedStudents.reduce((acc, student) => {
            student.courses?.forEach(course => {
              acc[course.courseId] = (acc[course.courseId] || 0) + 1;
            });
            return acc;
          }, {})
        );
        
        setStudents(fetchedStudents);
        
        // Extract filter options
        const options = {
          facultyNames: [...new Set(fetchedStudents.flatMap(s => s.courses?.map(c => c.subjectMentor) || []))],
          years: [...new Set(fetchedStudents.map(s => s.year))],
          branches: [...new Set(fetchedStudents.map(s => s.branch))],
          courseIds: [...new Set(fetchedStudents.flatMap(s => s.courses?.map(c => c.courseId) || []))],
          weeks: [...new Set(fetchedStudents.flatMap(s => 
            s.courses?.flatMap(c => c.results?.map(r => r.week) || []) || []
          ))].sort((a, b) => {
            const weekA = parseInt(a.match(/\d+/)[0]);
            const weekB = parseInt(b.match(/\d+/)[0]);
            return weekA - weekB;
          })
        };
        setFilterOptions(options);
        
        updateStats(fetchedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast({
          title: "Error fetching data",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []); // Only run on mount

  // Separate effect for filter updates
  useEffect(() => {
    if (students.length > 0) {
      updateStats(students);
    }
  }, [filters, students]); // Run when filters or students change

const updateStats = (studentsData) => {
  // First filter students by branch and year
  const filteredStudents = studentsData.filter(student => {
    const branchMatch = !filters.branch || student.branch === filters.branch;
    const yearMatch = !filters.year || student.year === filters.year;
    return branchMatch && yearMatch;
  });

  // Create a dynamic map to store unique students per branch
  const branchStudents = {};
  
  // Initialize branch stats for all courses
  filteredStudents.forEach(student => {
    student.courses?.forEach(course => {
      // Extract branch from course ID (e.g., 'noc25-cs52' -> 'CS')
      const branch = course.courseId.split('-')[1]?.replace(/\d+/g, '').toUpperCase();
      if (!branchStudents[branch]) {
        branchStudents[branch] = new Set();
      }
      const studentId = student._id.toString();
      branchStudents[branch].add(studentId);
    });
  });

  // Calculate total unique students across all branches
  const allUniqueStudents = new Set();
  Object.values(branchStudents).forEach(studentSet => {
    studentSet.forEach(studentId => allUniqueStudents.add(studentId));
  });

  // Calculate weekly stats for filtered students
  let weeklyStats = calculateWeeklyStats(
    filteredStudents,
    filters.courseId,
    filters.facultyName
  );

  if (filters.week) {
    weeklyStats = weeklyStats.filter(stat => stat.week === filters.week);
  }

  // Convert branch stats to the format expected by the UI
  const branchStats = {};
  Object.entries(branchStudents).forEach(([branch, students]) => {
    branchStats[branch] = { totalStudents: students.size };
  });

  // Update stats with correct counts
  setStats({
    totalStudents: allUniqueStudents.size,
    branchStats,
    weeklyStats,
    debug: {
      totalUnique: allUniqueStudents.size,
      branchDistribution: Object.fromEntries(
        Object.entries(branchStudents).map(([branch, students]) => [
          branch,
          students.size
        ])
      )
    }
  });

  // Log the counts for verification
  console.log('Statistics:', {
    total: allUniqueStudents.size,
    branchDistribution: Object.fromEntries(
      Object.entries(branchStudents).map(([branch, students]) => [
        branch,
        students.size
      ])
    ),
    rawStudentCount: studentsData.length,
    filteredCount: filteredStudents.length,
    appliedBranch: filters.branch || 'none',
    appliedYear: filters.year || 'none'
  });
};

const calculateWeeklyStats = (students, courseId, facultyName) => {
  const weeklyData = {};
  
  // First, initialize all weeks with zero counts
  students.forEach(student => {
    student.courses?.forEach(course => {
      course.results?.forEach(result => {
        if (!weeklyData[result.week]) {
          weeklyData[result.week] = { submitted: 0, notSubmitted: 0, total: 0 };
        }
      });
    });
  });

  // Then count submissions for filtered students
  students.forEach(student => {
    // Apply branch and year filters
    if ((filters.branch && student.branch !== filters.branch) ||
        (filters.year && student.year !== filters.year)) {
      return;
    }

    const relevantCourses = student.courses?.filter(c => 
      (!courseId || c.courseId === courseId) &&
      (!facultyName || c.subjectMentor === facultyName)
    );

    relevantCourses?.forEach(course => {
      if (course.results) {
        course.results.forEach(result => {
          if (!weeklyData[result.week]) {
            weeklyData[result.week] = { submitted: 0, notSubmitted: 0, total: 0 };
          }
          
          weeklyData[result.week].total++;
          
          if (result.score > 0) {
            weeklyData[result.week].submitted++;
          } else {
            weeklyData[result.week].notSubmitted++;
          }
        });
      }
    });
  });

  return Object.entries(weeklyData)
    .map(([week, stats]) => ({
      week,
      submitted: stats.submitted,
      notSubmitted: stats.notSubmitted,
      submissionRate: stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0
    }))
    .sort((a, b) => {
      const weekA = parseInt(a.week.match(/\d+/)[0]);
      const weekB = parseInt(b.week.match(/\d+/)[0]);
      return weekA - weekB;
    });
};

const resetFilters = () => {
  setFilters({
    facultyName: '',
    year: '',
    branch: '',
    courseId: '',
    week: ''
  });
  toast({
    title: 'Filters Reset',
    status: 'info',
    duration: 2000,
    isClosable: true,
  });
};

const handleViewUnsubmitted = async (weekData) => {
  console.log("Week Data:", weekData); // Debug log
  
  if (!filters.courseId) {
    toast({
      title: "Please select a course",
      description: "Course selection is required to view unsubmitted students",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
    return;
  }

  try {
    setLoading(true);
    // Log the request parameters
    console.log("Request params:", {
      week: weekData,
      courseId: filters.courseId,
      year: filters.year,
      branch: filters.branch,
      facultyName: filters.facultyName
    });

    const response = await axios.get('http://localhost:3000/api/students/unsubmitted', {
      params: {
        week: weekData,
        courseId: filters.courseId,
        year: filters.year || undefined,
        branch: filters.branch || undefined,
        facultyName: filters.facultyName || undefined
      }
    });
    
    console.log("API Response:", response.data); // Debug log
    
    if (response.data) {
      setSelectedWeek(weekData);
      setUnsubmittedStudents(response.data);
      onOpen();
    }
  } catch (error) {
    console.error('Error fetching unsubmitted students:', error);
    toast({
      title: "Error fetching data",
      description: "Unable to fetch unsubmitted students",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  } finally {
    setLoading(false);
  }
};

const handleFacultyClick = (facultyName) => {
  if (!filters.courseId) {
    toast({
      title: "Please select a course",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
    return;
  }

  const facultyStudents = students.filter(student => {
    const yearMatch = !filters.year || student.year === filters.year;
    const branchMatch = !filters.branch || student.branch === filters.branch;
    return yearMatch && branchMatch && student.courses.some(course => 
      course.subjectMentor === facultyName && 
      course.courseId === filters.courseId
    );
  });

  setSelectedFacultyStudents(facultyStudents);
  onFacultyModalOpen();
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const notSubmittedCount = payload[1]?.value || 0;
    return (
      <Card bg="white" shadow="lg" p={4}>
        <VStack align="start" spacing={3}>
          <Text fontWeight="bold">{label}</Text>
          <VStack align="start" spacing={1}>
            <Text color="green.500">
              Submitted: {payload[0].value} ({Math.round((payload[0].value / (payload[0].value + payload[1].value)) * 100)}%)
            </Text>
            <Text color="red.500">
              Not Submitted: {notSubmittedCount} ({Math.round((notSubmittedCount / (payload[0].value + notSubmittedCount)) * 100)}%)
            </Text>
          </VStack>
       
        </VStack>
      </Card>
    );
  }
  return null;
};

return (
  <Container maxW="container.xl" py={8}>
    <Stack spacing={8}>
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Heading size="lg" mb={2}>Dashboard Overview</Heading>
        <Text color="gray.600">Monitor student performance and submission statistics</Text>
      </MotionBox>

      {/* Filters */}
      <MotionCard
        variant="outline"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <CardBody>
          <Stack spacing={4}>
            <Flex gap={4} flexWrap="wrap">
              <Select
                placeholder="Select Faculty"
                value={filters.facultyName}
                onChange={(e) => {
                  setFilters({...filters, facultyName: e.target.value});
                  if (e.target.value) {
                    handleFacultyClick(e.target.value);
                  }
                }}
                maxW="200px"
              >
                {filterOptions.facultyNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>

              <Select
                placeholder="Select Year"
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: e.target.value})}
                maxW="200px"
              >
                {filterOptions.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>

              <Select
                placeholder="Select Branch"
                value={filters.branch}
                onChange={(e) => setFilters({...filters, branch: e.target.value})}
                maxW="200px"
              >
                {filterOptions.branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </Select>

              <Select
                placeholder="Select Course"
                value={filters.courseId}
                onChange={(e) => setFilters({...filters, courseId: e.target.value})}
                maxW="200px"
              >
                {filterOptions.courseIds.map(id => (
                  <option key={id} value={id}>{id.toUpperCase()}</option>
                ))}
              </Select>

              <Select
                placeholder="Select Week"
                value={filters.week}
                onChange={(e) => setFilters({...filters, week: e.target.value})}
                maxW="200px"
              >
                {filterOptions.weeks.map(week => (
                  <option key={week} value={week}>{week}</option>
                ))}
              </Select>

              <Tooltip label="Reset filters">
                <IconButton
                  icon={<RepeatIcon />}
                  onClick={resetFilters}
                  aria-label="Reset filters"
                  variant="ghost"
                  _hover={{ transform: 'rotate(180deg)', transition: 'transform 0.3s' }}
                />
              </Tooltip>
            </Flex>

            {Object.values(filters).some(Boolean) && (
              <HStack spacing={2} flexWrap="wrap">
                <Badge colorScheme="blue">Filters applied</Badge>
                {filters.courseId && <Badge colorScheme="green">{filters.courseId.toUpperCase()}</Badge>}
                {filters.branch && <Badge colorScheme="purple">{filters.branch}</Badge>}
                {filters.year && <Badge colorScheme="orange">{filters.year}</Badge>}
                {filters.week && <Badge colorScheme="cyan">{filters.week}</Badge>}
              </HStack>
            )}
          </Stack>
        </CardBody>
      </MotionCard>

      <SimpleGrid 
        columns={{ 
          base: 1, 
          md: stats.branchStats ? Object.keys(stats.branchStats).length + 1 : 4 
        }} 
        spacing={5} 
        mb={5}
      >
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CardBody>
            <Stat>
              <StatLabel>Total Students</StatLabel>
              <StatNumber>{stats.totalStudents}</StatNumber>
              <StatHelpText>
                {filters.year && `Year: ${filters.year}`}
                {filters.branch && ` • Branch: ${filters.branch}`}
              </StatHelpText>
            </Stat>
          </CardBody>
        </MotionCard>

        {stats.branchStats && Object.entries(stats.branchStats).map(([branch, data], index) => (
          <MotionCard
            key={branch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
          >
            <CardBody>
              <Stat>
                <StatLabel>{branch} Course Students</StatLabel>
                <StatNumber>{data.totalStudents}</StatNumber>
                <StatHelpText>All NOC25-{branch} Courses</StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>
        ))}
      </SimpleGrid>

      {/* Add this if you want to show current week's submission stats */}
      {stats.weeklyStats.length > 0 && filters.courseId && (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={5}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardBody>
              <Stat>
                <StatLabel>Latest Week Submissions</StatLabel>
                <StatNumber>
                  {stats.weeklyStats[stats.weeklyStats.length - 1]?.submitted || 0}
                </StatNumber>
                <StatHelpText>
                  {stats.weeklyStats[stats.weeklyStats.length - 1]?.week}
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CardBody>
              <Stat>
                <StatLabel>Not Submitted</StatLabel>
                <StatNumber>
                  {stats.weeklyStats[stats.weeklyStats.length - 1]?.notSubmitted || 0}
                </StatNumber>
                <StatHelpText>
                  {stats.weeklyStats[stats.weeklyStats.length - 1]?.week}
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CardBody>
              <Stat>
                <StatLabel>Submission Rate</StatLabel>
                <StatNumber>
                  {Math.round(stats.weeklyStats[stats.weeklyStats.length - 1]?.submissionRate || 0)}%
                </StatNumber>
                <StatHelpText>
                  {stats.weeklyStats[stats.weeklyStats.length - 1]?.week}
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>
        </SimpleGrid>
      )}

      {/* Weekly Submission Stats */}
      <MotionCard>
        <CardBody>
          <HStack justify="space-between" mb={6}>
            <Heading size="md">Weekly Submission Statistics</Heading>
            <Tooltip label={filters.courseId ? 
              "Hover over bars and click 'View Unsubmitted' to see details" : 
              "Please select a course to view unsubmitted students"
            }>
              <InfoIcon color="gray.400" />
            </Tooltip>
          </HStack>
          <Skeleton isLoaded={!loading} h="400px">
            <Box h="400px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={stats.weeklyStats}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 80
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="week" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fill: '#4A5568', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#4A5568' }} />
                  <RechartsTooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'transparent' }}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span style={{ color: '#4A5568' }}>{value}</span>}
                  />
                  <Bar 
                    dataKey="submitted" 
                    name="Submitted" 
                    fill="#48BB78"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="notSubmitted" 
                    name="Not Submitted" 
                    fill="#F56565"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Skeleton>
        </CardBody>
      </MotionCard>

      {/* Unsubmitted Students Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="xl"
        motionPreset="slideInBottom"
        isCentered
      >
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent maxW="900px">
          <ModalHeader>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text>Unsubmitted Students - {selectedWeek}</Text>
                <HStack spacing={2} flexWrap="wrap">
                  {filters.courseId && <Badge colorScheme="green">{filters.courseId.toUpperCase()}</Badge>}
                  {filters.branch && <Badge colorScheme="purple">{filters.branch}</Badge>}
                  {filters.year && <Badge colorScheme="orange">{filters.year}</Badge>}
                  {filters.facultyName && <Badge colorScheme="blue">{filters.facultyName}</Badge>}
                </HStack>
              </VStack>
              <Button
                leftIcon={<DownloadIcon />}
                size="sm"
                colorScheme="blue"
                onClick={() => {
                  if (unsubmittedStudents.length === 0) {
                    toast({
                      title: "No data to export",
                      status: "warning",
                      duration: 2000,
                    });
                    return;
                  }
                  const csvContent = unsubmittedStudents.map(student => 
                    `${student.rollNumber},${student.name},${student.branch},${student.email}`
                  ).join('\n');
                  const blob = new Blob([`Roll Number,Name,Branch,Email\n${csvContent}`], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `unsubmitted-students-${selectedWeek}.csv`;
                  a.click();
                  toast({
                    title: 'CSV Downloaded',
                    status: 'success',
                    duration: 2000,
                  });
                }}
                isDisabled={unsubmittedStudents.length === 0}
              >
                Export CSV
              </Button>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {unsubmittedStudents.length > 0 ? (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Roll Number</Th>
                    <Th>Name</Th>
                    <Th>Branch</Th>
                    <Th>Email</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {unsubmittedStudents.map((student, index) => (
                    <motion.tr
                      key={student._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Td fontWeight="medium">{student.rollNumber}</Td>
                      <Td>{student.name}</Td>
                      <Td>
                        <Badge colorScheme="blue">{student.branch}</Badge>
                      </Td>
                      <Td>{student.email}</Td>
                    </motion.tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">No unsubmitted students found</Text>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Faculty Students Modal */}
      <Modal 
        isOpen={isFacultyModalOpen} 
        onClose={onFacultyModalClose}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            <Text>Students for {filters.facultyName} - {filters.courseId}</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Roll Number</Th>
                  <Th>Name</Th>
                  <Th>Branch</Th>
                  <Th>Results</Th>
                </Tr>
              </Thead>
              <Tbody>
                {selectedFacultyStudents.map((student) => {
                  const course = student.courses.find(c => 
                    c.courseId === filters.courseId
                  );
                  return (
                    <Tr key={student._id}>
                      <Td>{student.rollNumber}</Td>
                      <Td>{student.name}</Td>
                      <Td>{student.branch}</Td>
                      <Td>
                        {course?.results?.length > 0 ? (
                          <VStack align="start">
                            {course.results.map((result, idx) => (
                              <Text key={idx}>
                                Week {result.week}: {result.score}
                              </Text>
                            ))}
                          </VStack>
                        ) : (
                          <Text color="gray.500">No results available</Text>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Stack>
  </Container>
);
}

export default Dashboard;