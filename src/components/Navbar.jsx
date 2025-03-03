import React, { useState } from 'react';
import {
  Box,
  Flex,
  Link,
  Heading,
  useToast,
  Button,
  IconButton,
  Stack,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onToggle } = useDisclosure();
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
        
        {/* Mobile menu button */}
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onToggle}
          icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />}
          variant="ghost"
          aria-label="Toggle Navigation"
        />

        {/* Desktop Navigation */}
        <Flex
          display={{ base: 'none', md: 'flex' }}
          alignItems="center"
          gap={8}
        >
          <Link as={RouterLink} to="/" color="gray.600" fontWeight="medium">
            Dashboard
          </Link>
          <Link as={RouterLink} to="/course-data" color="gray.600" fontWeight="medium">
            Faculty Stats
          </Link>
          
          {isAdmin && (
            <Link as={RouterLink} to="/upload" color="gray.600" fontWeight="medium">
              Upload Excel
            </Link>
          )}
          <Link as={RouterLink} to="/update-weekly-score" color="gray.600" fontWeight="medium">
            Upload Csv
          </Link>
          <Button onClick={handleLogout} colorScheme="red" size="sm">
            Logout
          </Button>
        </Flex>
      </Flex>

      {/* Mobile Navigation */}
      <Collapse in={isOpen} animateOpacity>
        <Stack
          bg="white"
          p={4}
          display={{ md: 'none' }}
          spacing={4}
          direction="column"
          align="stretch"
          borderTop="1px"
          borderColor="gray.200"
        >
          <Link 
            as={RouterLink} 
            to="/" 
            color="gray.600" 
            fontWeight="medium"
            p={2}
            _hover={{ bg: 'gray.50' }}
          >
            Dashboard
          </Link>
          <Link 
            as={RouterLink} 
            to="/course-data" 
            color="gray.600" 
            fontWeight="medium"
            p={2}
            _hover={{ bg: 'gray.50' }}
          >
            Course Data
          </Link>
          <Link 
            as={RouterLink} 
            to="/students" 
            color="gray.600" 
            fontWeight="medium"
            p={2}
            _hover={{ bg: 'gray.50' }}
          >
            Students
          </Link>
          {isAdmin && (
            <Link 
              as={RouterLink} 
              to="/upload" 
              color="gray.600" 
              fontWeight="medium"
              p={2}
              _hover={{ bg: 'gray.50' }}
            >
              Upload Excel
            </Link>
          )}
          <Link 
            as={RouterLink} 
            to="/update-weekly-score" 
            color="gray.600" 
            fontWeight="medium"
            p={2}
            _hover={{ bg: 'gray.50' }}
          >
            Upload Csv
          </Link>
          <Box p={2}>
            <Button 
              onClick={handleLogout} 
              colorScheme="red" 
              size="sm" 
              width="full"
            >
              Logout
            </Button>
          </Box>
        </Stack>
      </Collapse>
    </Box>
  );
}

export default Navbar;