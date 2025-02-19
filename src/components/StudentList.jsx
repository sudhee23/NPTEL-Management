import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Card,
  CardBody,
  Stack,
  Divider,
  Container,
  useColorModeValue,
  Select,
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import { SearchIcon, InfoIcon, ChevronDownIcon, RepeatIcon } from '@chakra-ui/icons';
import axios from 'axios';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    branch: '',
    year: '',
    courseId: ''
  });

  // Color modes for better UI
  const tableBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  // Extract unique values for filters
  const branches = [...new Set(students.map(student => student.branch))].sort();
  const years = [...new Set(students.map(student => student.year))].sort();
  const courseIds = [...new Set(students.flatMap(student => 
    student.courses.map(course => course.courseId)
  ))].sort();

  // Score color function
  const getScoreColor = (score) => {
    if (score >= 80) return 'green.500';
    if (score >= 60) return 'yellow.500';
    if (score >= 40) return 'orange.500';
    return 'red.500';
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get('https://nptel-management-backend.onrender.com/api/students');
        setStudents(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const resetFilters = () => {
    setFilters({
      branch: '',
      year: '',
      courseId: ''
    });
    setSearchTerm('');
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch = !filters.branch || student.branch === filters.branch;
    const matchesYear = !filters.year || student.year === filters.year;
    const matchesCourse = !filters.courseId || 
      student.courses.some(course => course.courseId === filters.courseId);

    return matchesSearch && matchesBranch && matchesYear && matchesCourse;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Box>
    );
  }

  return (
    <Container maxW="container.xl">
      <Box mb={8}>
        <Heading size="lg" mb={2}>Students Directory</Heading>
        <Text color="gray.600">Manage and view student information</Text>
      </Box>
      
      <Stack spacing={6}>
        {/* Search and Filters */}
        <Card variant="outline">
          <CardBody>
            <Stack spacing={4}>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by name, roll number, or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="lg"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px blue.400',
                  }}
                />
              </InputGroup>

              <Flex gap={4} flexWrap="wrap">
                <Select
                  placeholder="Select Branch"
                  value={filters.branch}
                  onChange={(e) => setFilters({...filters, branch: e.target.value})}
                  maxW="200px"
                >
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </Select>

                <Select
                  placeholder="Select Year"
                  value={filters.year}
                  onChange={(e) => setFilters({...filters, year: e.target.value})}
                  maxW="200px"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>

                <Select
                  placeholder="Select Course"
                  value={filters.courseId}
                  onChange={(e) => setFilters({...filters, courseId: e.target.value})}
                  maxW="200px"
                >
                  {courseIds.map(courseId => (
                    <option key={courseId} value={courseId}>{courseId.toUpperCase()}</option>
                  ))}
                </Select>

                <Tooltip label="Reset all filters">
                  <IconButton
                    icon={<RepeatIcon />}
                    onClick={resetFilters}
                    aria-label="Reset filters"
                    variant="ghost"
                  />
                </Tooltip>
              </Flex>

              <HStack>
                <Text fontSize="sm" color="gray.500">
                  Showing {filteredStudents.length} of {students.length} students
                </Text>
                {(filters.branch || filters.year || filters.courseId) && (
                  <Badge colorScheme="blue">Filters applied</Badge>
                )}
              </HStack>
            </Stack>
          </CardBody>
        </Card>

        {/* Results Table */}
        {filteredStudents.length === 0 ? (
          <Box textAlign="center" py={10}>
            <InfoIcon boxSize={10} color="gray.400" mb={4} />
            <Text fontSize="lg" color="gray.500">No students found matching your criteria</Text>
          </Box>
        ) : (
          <Box overflowX="auto" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Table variant="simple" bg={tableBg}>
              <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                <Tr>
                  <Th>Roll Number</Th>
                  <Th>Name</Th>
                  <Th>Branch</Th>
                  <Th>Year</Th>
                  <Th>Email</Th>
                  <Th>Courses</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredStudents.map((student) => (
                  <Tr 
                    key={student._id}
                    _hover={{ bg: hoverBg }}
                    transition="background 0.2s"
                  >
                    <Td fontWeight="medium">{student.rollNumber}</Td>
                    <Td>{student.name}</Td>
                    <Td>
                      <Badge colorScheme="blue" borderRadius="full" px={2}>
                        {student.branch}
                      </Badge>
                    </Td>
                    <Td>{student.year}</Td>
                    <Td fontSize="sm">{student.email}</Td>
                    <Td>
                      <Accordion allowToggle>
                        <AccordionItem border="none">
                          <AccordionButton 
                            p={2} 
                            borderRadius="md"
                            _hover={{ bg: 'gray.100' }}
                          >
                            <Badge 
                              colorScheme={student.courses.length > 0 ? 'green' : 'gray'}
                              borderRadius="full"
                              px={3}
                              py={1}
                            >
                              {student.courses.length} Courses
                            </Badge>
                            <AccordionIcon ml={2} />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            <Stack spacing={4}>
                              {student.courses.map((course) => (
                                <Card 
                                  key={course._id} 
                                  variant="outline"
                                  borderRadius="md"
                                >
                                  <CardBody>
                                    <Stack spacing={3}>
                                      <Box>
                                        <Text fontWeight="bold" fontSize="lg">
                                          {course.courseId.toUpperCase()}
                                        </Text>
                                        <Text color="gray.600" fontSize="sm">
                                          Mentor: {course.subjectMentor}
                                        </Text>
                                      </Box>
                                      <Divider />
                                      {course.results && course.results.length > 0 ? (
                                        <Table size="sm" variant="simple">
                                          <Thead>
                                            <Tr>
                                              <Th>Week</Th>
                                              <Th isNumeric>Score</Th>
                                            </Tr>
                                          </Thead>
                                          <Tbody>
                                            {course.results.map((result, index) => (
                                              <Tr key={index}>
                                                <Td fontSize="sm">{result.week}</Td>
                                                <Td isNumeric>
                                                  <Badge
                                                    colorScheme={result.score > 0 ? 'green' : 'red'}
                                                    variant="subtle"
                                                    px={2}
                                                    py={1}
                                                  >
                                                    {result.score}%
                                                  </Badge>
                                                </Td>
                                              </Tr>
                                            ))}
                                          </Tbody>
                                        </Table>
                                      ) : (
                                        <Box 
                                          p={4} 
                                          bg="gray.50" 
                                          borderRadius="md"
                                          textAlign="center"
                                        >
                                          <Text color="gray.500">No results available</Text>
                                        </Box>
                                      )}
                                    </Stack>
                                  </CardBody>
                                </Card>
                              ))}
                            </Stack>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Stack>
    </Container>
  );
}

export default StudentList;