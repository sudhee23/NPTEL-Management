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
  Progress,
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [filters, setFilters] = useState({
    facultyName: '',
    year: '',
    branch: '',
    courseId: '',
    week: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    facultyNames: [
      'Dr. SELVETIKAR ASHOK',
      'Yathati Sankeerth',
      'JANGILI PRASAD',
      'Perumallapalli Krishna',
      'Adavipalli Chandana',
      'Jagu Srinivasa Rao',
      'T Siva Kumar Prudhviraj',
      'MadhuSudhana Reddy Mule',
      'K Lakshmi Kanth',
      'SIVALAL',
      'PERAKA SHYAM',
      'SURESH KALLEPALLI',
      'Priyanka',
      'Satyadev Manepalli',
      'AMIT KUMAR PANIGRAHY',
      'Dr Jyothilal Nayak Bharothu',
      'Subbi Naidu Bora',
      'TADI SUNIL BHAGAT',
      'Deepti Sahoo',
      'D Srilakshmi',
      'SEKHAR VEMPATI',
      'Dr. Charles Stud Angalakurthi',
      'VENKATESWARA RAO KANKATA',
      'Dr. Pavani Udatha',
      'Shravani Kanaka Kumari P',
      'RACHARLA SIVA NARAYANA'
    ],
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
        setFilterOptions({
          ...filterOptions,
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
        });
        
        updateStats(fetchedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      updateStats(students);
    }
  }, [filters, students]);

  const updateStats = (studentsData) => {
    const filteredStudents = studentsData.filter(student => {
      const branchMatch = !filters.branch || student.branch === filters.branch;
      const yearMatch = !filters.year || student.year === filters.year;
      return branchMatch && yearMatch;
    });
  
    const branchEnrollments = {};
    const branchUniqueStudents = {};
    
    filteredStudents.forEach(student => {
      student.courses?.forEach(course => {
        const branch = course.courseId.split('-')[1]?.replace(/\d+/g, '').toUpperCase();
        
        if (!branchEnrollments[branch]) {
          branchEnrollments[branch] = 0;
          branchUniqueStudents[branch] = new Set();
        }
        
        branchEnrollments[branch]++;
        branchUniqueStudents[branch].add(student._id.toString());
      });
    });
  
    const allUniqueStudents = new Set();
    Object.values(branchUniqueStudents).forEach(studentSet => {
      studentSet.forEach(studentId => allUniqueStudents.add(studentId));
    });
  
    let weeklyStats = calculateWeeklyStats(
      filteredStudents,
      filters.courseId,
      filters.facultyName
    );
  
    if (filters.week) {
      weeklyStats = weeklyStats.filter(stat => stat.week === filters.week);
    }
  
    const branchStats = {};
    Object.entries(branchEnrollments).forEach(([branch, enrollments]) => {
      branchStats[branch] = {
        totalStudents: enrollments,
        uniqueStudents: branchUniqueStudents[branch].size
      };
    });
  
    setStats({
      totalStudents: allUniqueStudents.size,
      branchStats,
      weeklyStats,
      debug: {
        totalUnique: allUniqueStudents.size,
        branchDistribution: Object.fromEntries(
          Object.entries(branchStats).map(([branch, stats]) => [
            branch,
            `${stats.totalStudents} enrollments (${stats.uniqueStudents} unique)`
          ])
        )
      }
    });
  
    console.log('Statistics:', {
      totalUniqueStudents: allUniqueStudents.size,
      branchDistribution: Object.fromEntries(
        Object.entries(branchStats).map(([branch, stats]) => [
          branch,
          {
            enrollments: stats.totalStudents,
            uniqueStudents: stats.uniqueStudents
          }
        ])
      ),
      rawStudentCount: studentsData.length,
      filteredCount: filteredStudents.length
    });
  };

const calculateWeeklyStats = (students, courseId, facultyName) => {
  const weeklyData = {};
  
  students.forEach(student => {
    student.courses?.forEach(course => {
      course.results?.forEach(result => {
        if (!weeklyData[result.week]) {
          weeklyData[result.week] = { submitted: 0, notSubmitted: 0, total: 0 };
        }
      });
    });
  });

  students.forEach(student => {
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
      const weekNumA = parseInt(a.week.replace(/\D/g, '')) || 0;
      const weekNumB = parseInt(b.week.replace(/\D/g, '')) || 0;
      return weekNumA - weekNumB;
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
    position: "top",
    containerStyle: {
      marginTop: "120px"
    }
  });
};

const handleViewUnsubmitted = async (weekData) => {
  console.log("Week Data:", weekData);
  
  if (!filters.courseId) {
    toast({
      title: "Please select a course",
      description: "Course selection is required to view unsubmitted students",
      status: "warning",
      duration: 3000,
      isClosable: true,
      position: "top",
      containerStyle: {
        marginTop: "120px"
      }
    });
    return;
  }

  try {
    setLoading(true);
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
    
    console.log("API Response:", response.data);
    
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
      position: "top",
      containerStyle: {
        marginTop: "120px"
      }
    });
  } finally {
    setLoading(false);
  }
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
        <Box>
          <Heading size="lg" mb={6}>Faculty Submission Statistics</Heading>
        </Box>
      </MotionBox>

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
                }}
                maxW="300px"
                size="md"
              >
                {filterOptions.facultyNames.map(name => (
                  <option key={name} value={name}>{name}</option>
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

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
        {loading ? (
          Array.from({ length: 12 }).map((_, index) => (
            <MotionCard
              key={`skeleton-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <CardBody>
                <Stack spacing={4}>
                  <Box>
                    <Skeleton height="24px" width="120px" mb={2} />
                    <Stack spacing={2}>
                      <Skeleton height="20px" width="140px" />
                      <Skeleton height="20px" width="160px" />
                      <Skeleton height="16px" width="100px" />
                    </Stack>
                  </Box>

                  <Box>
                    <Skeleton height="20px" width="180px" mb={2} />
                    <Skeleton height="8px" borderRadius="full" />
                  </Box>

                  <Skeleton height="32px" width="120px" />
                </Stack>
              </CardBody>
            </MotionCard>
          ))
        ) : (
          stats.weeklyStats
            .filter(week => !week.week.includes('Week 0'))
            .map((week, index) => (
              <MotionCard
                key={week.week}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <CardBody>
                  <Stack spacing={4}>
                    <Box>
                      <Heading size="md" mb={2}>{week.week}</Heading>
                      <Stack spacing={2}>
                        <Text color="green.500" fontWeight="medium">
                          Submitted: {week.submitted}
                        </Text>
                        <Text color="red.500" fontWeight="medium">
                          Not Submitted: {week.notSubmitted}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Total: {week.submitted + week.notSubmitted}
                        </Text>
                      </Stack>
                    </Box>

                    <Box>
                      <Text mb={2}>
                        Submission Rate: {Math.round(week.submissionRate)}%
                      </Text>
                      <Progress 
                        value={week.submissionRate} 
                        colorScheme={week.submissionRate > 50 ? "green" : "orange"}
                        borderRadius="full"
                      />
                    </Box>

                    {filters.courseId && (
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleViewUnsubmitted(week.week)}
                        isDisabled={week.submitted + week.notSubmitted === 0}
                      >
                        View Unsubmitted
                      </Button>
                    )}
                  </Stack>
                </CardBody>
              </MotionCard>
            ))
        )}
      </SimpleGrid>

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
    </Stack>
  </Container>
);
}

export default Dashboard;