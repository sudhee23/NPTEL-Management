import React from 'react';
import { Box, Flex, Link, Heading, useToast, Button } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const toast = useToast();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('tokenExpiration');
    navigate('/login');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
      status: "success",
      duration: 2000,
    });
  };

  return (
    <Box bg="white" px={4} shadow="sm">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Heading size="md">Student Management</Heading>
        <Flex alignItems="center" gap={8}>
          <Link as={RouterLink} to="/" color="gray.600" fontWeight="medium">
            Dashboard
          </Link>
          <Link as={RouterLink} to="/students" color="gray.600" fontWeight="medium">
            Students
          </Link>
          {isAdmin && (
            <Link as={RouterLink} to="/upload" color="gray.600" fontWeight="medium">
              Upload Excel
            </Link>
          )}
          <Link as={RouterLink} to="/update-weekly-score" color="gray.600" fontWeight="medium">
            Upload Csv
          </Link>
          <Button 
            onClick={handleLogout} 
            colorScheme="red" 
            size="sm"
          >
            Logout
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

export default Navbar;