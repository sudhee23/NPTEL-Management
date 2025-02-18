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
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    weeklyStats: [],
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
    facultyNames: [],
    years: [],
    branches: [],
    courseIds: [],
    weeks: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/students');
        const students = response.data;
        
        // Extract filter options including weeks
        const options = {
          facultyNames: [...new Set(students.flatMap(s => s.courses.map(c => c.subjectMentor)))],
          years: [...new Set(students.map(s => s.year))],
          branches: [...new Set(students.map(s => s.branch))],
          courseIds: [...new Set(students.flatMap(s => s.courses.map(c => c.courseId)))],
          weeks: [...new Set(students.flatMap(s => 
            s.courses.flatMap(c => c.results?.map(r => r.week) || [])
          ))]
        };
        setFilterOptions(options);

        // Calculate statistics based on filters
        const filteredStudents = students.filter(student => {
          const matchesFaculty = !filters.facultyName || 
            student.courses.some(c => c.subjectMentor === filters.facultyName);
          const matchesYear = !filters.year || student.year === filters.year;
          const matchesBranch = !filters.branch || student.branch === filters.branch;
          const matchesCourse = !filters.courseId || 
            student.courses.some(c => c.courseId === filters.courseId);
          
          return matchesFaculty && matchesYear && matchesBranch && matchesCourse;
        });

        // Calculate weekly stats with week filter
        let weeklyStats = calculateWeeklyStats(filteredStudents, filters.courseId);
        if (filters.week) {
          weeklyStats = weeklyStats.filter(stat => stat.week === filters.week);
        }

        setStats({
          totalStudents: filteredStudents.length,
          totalCourses: new Set(filteredStudents.flatMap(s => 
            s.courses.map(c => c.courseId)
          )).size,
          weeklyStats,
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [filters]);

  const calculateWeeklyStats = (students, courseId) => {
    const weeklyData = {};
    
    students.forEach(student => {
      const course = student.courses.find(c => !courseId || c.courseId === courseId);
      if (course && course.results) {
        course.results.forEach(result => {
          if (!weeklyData[result.week]) {
            weeklyData[result.week] = { submitted: 0, notSubmitted: 0, total: 0 };
          }
          if (result.score > 0) {
            weeklyData[result.week].submitted++;
          } else {
            weeklyData[result.week].notSubmitted++;
          }
          weeklyData[result.week].total++;
        });
      }
    });

    return Object.entries(weeklyData).map(([week, stats]) => ({
      week,
      submitted: stats.submitted,
      notSubmitted: stats.notSubmitted,
      submissionRate: (stats.submitted / stats.total) * 100
    }));
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
            {notSubmittedCount > 0 && (
              <Button
                size="sm"
                colorScheme="red"
                leftIcon={<InfoIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewUnsubmitted(label);
                }}
                isDisabled={!filters.courseId}
                _hover={{ transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                View Unsubmitted
              </Button>
            )}
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
                  onChange={(e) => setFilters({...filters, facultyName: e.target.value})}
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

        {/* Stats Overview */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {[
            { label: 'Total Students', value: stats.totalStudents, helpText: 'Currently enrolled' },
            { label: 'Total Courses', value: stats.totalCourses, helpText: 'Active courses' },
            { 
              label: 'Average Submission Rate', 
              value: `${Math.round(stats.weeklyStats.reduce((acc, curr) => acc + curr.submissionRate, 0) / (stats.weeklyStats.length || 1))}%`,
              helpText: 'Across all weeks'
            }
          ].map((stat, index) => (
            <MotionCard
              key={stat.label}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <CardBody>
                <Stat>
                  <StatLabel fontSize="md" color="gray.600">{stat.label}</StatLabel>
                  <Skeleton isLoaded={!loading}>
                    <StatNumber fontSize="3xl">{stat.value}</StatNumber>
                  </Skeleton>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {stat.helpText}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </MotionCard>
          ))}
        </SimpleGrid>

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
      </Stack>
    </Container>
  );
}

export default Dashboard;