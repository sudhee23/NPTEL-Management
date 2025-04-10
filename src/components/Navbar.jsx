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
  useDisclosure,
  Container
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
    <Box bg="white" shadow="lg" position="sticky" top="0" zIndex="1000">
      <Container maxW="container.xl">
        <Flex 
          h={16} 
          alignItems="center" 
          justifyContent="space-between"
          px={{ base: 4, md: 0 }}
        >
          <Heading 
            size="md" 
            bgGradient="linear(to-r, blue.500, purple.500)"
            bgClip="text"
            fontWeight="bold"
          >
            Student Management
          </Heading>
          
          {/* Mobile menu button */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onToggle}
            icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />}
            variant="ghost"
            aria-label="Toggle Navigation"
            _hover={{ bg: 'gray.100' }}
          />

          {/* Desktop Navigation */}
          <Flex
            display={{ base: 'none', md: 'flex' }}
            alignItems="center"
            gap={8}
          >
            <Link 
              as={RouterLink} 
              to="/" 
              color="gray.700" 
              fontWeight="medium"
              _hover={{ color: 'blue.500', textDecoration: 'none' }}
              transition="color 0.2s"
            >
              Dashboard
            </Link>
            <Link 
              as={RouterLink} 
              to="/course-data" 
              color="gray.700" 
              fontWeight="medium"
              _hover={{ color: 'blue.500', textDecoration: 'none' }}
              transition="color 0.2s"
            >
              Faculty Stats
            </Link>
            
            <Link 
              as={RouterLink} 
              to="/students" 
              color="gray.700" 
              fontWeight="medium"
              _hover={{ color: 'blue.500', textDecoration: 'none' }}
              transition="color 0.2s"
            >
              Students
            </Link>
            
            {isAdmin && (
              <Link 
                as={RouterLink} 
                to="/upload" 
                color="gray.700" 
                fontWeight="medium"
                _hover={{ color: 'blue.500', textDecoration: 'none' }}
                transition="color 0.2s"
              >
                Upload Excel
              </Link>
            )}
            <Link 
              as={RouterLink} 
              to="/update-weekly-score" 
              color="gray.700" 
              fontWeight="medium"
              _hover={{ color: 'blue.500', textDecoration: 'none' }}
              transition="color 0.2s"
            >
              Upload Csv
            </Link>
            <Button 
              onClick={handleLogout} 
              colorScheme="red" 
              size="sm"
              _hover={{ transform: 'translateY(-1px)' }}
              transition="all 0.2s"
            >
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
            borderTop="1px"
            borderColor="gray.200"
            alignItems="center"
            textAlign="center"
            w="full"
          >
            <Link 
              as={RouterLink} 
              to="/" 
              color="gray.700" 
              fontWeight="medium"
              p={2}
              w="full"
              display="flex"
              justifyContent="center"
              borderRadius="md"
              _hover={{ bg: 'blue.50', color: 'blue.500', textDecoration: 'none' }}
              transition="all 0.2s"
              onClick={onToggle}
            >
              Dashboard
            </Link>
            <Link 
              as={RouterLink} 
              to="/course-data" 
              color="gray.700" 
              fontWeight="medium"
              p={2}
              w="full"
              display="flex"
              justifyContent="center"
              borderRadius="md"
              _hover={{ bg: 'blue.50', color: 'blue.500', textDecoration: 'none' }}
              transition="all 0.2s"
              onClick={onToggle}
            >
              Faculty Stats
            </Link>
            <Link 
              as={RouterLink} 
              to="/students" 
              color="gray.700" 
              fontWeight="medium"
              p={2}
              w="full"
              display="flex"
              justifyContent="center"
              borderRadius="md"
              _hover={{ bg: 'blue.50', color: 'blue.500', textDecoration: 'none' }}
              transition="all 0.2s"
              onClick={onToggle}
            >
              Students
            </Link>
            {isAdmin && (
              <Link 
                as={RouterLink} 
                to="/upload" 
                color="gray.700" 
                fontWeight="medium"
                p={2}
                w="full"
                display="flex"
                justifyContent="center"
                borderRadius="md"
                _hover={{ bg: 'blue.50', color: 'blue.500', textDecoration: 'none' }}
                transition="all 0.2s"
                onClick={onToggle}
              >
                Upload Excel
              </Link>
            )}
            <Link 
              as={RouterLink} 
              to="/update-weekly-score" 
              color="gray.700" 
              fontWeight="medium"
              p={2}
              w="full"
              display="flex"
              justifyContent="center"
              borderRadius="md"
              _hover={{ bg: 'blue.50', color: 'blue.500', textDecoration: 'none' }}
              transition="all 0.2s"
              onClick={onToggle}
            >
              Upload Csv
            </Link>
            <Box p={2} w="full">
              <Button 
                onClick={() => {
                  handleLogout();
                  onToggle();
                }} 
                colorScheme="red" 
                size="sm" 
                width="full"
                _hover={{ transform: 'translateY(-1px)' }}
                transition="all 0.2s"
              >
                Logout
              </Button>
            </Box>
          </Stack>
        </Collapse>
      </Container>
    </Box>
  );
}

export default Navbar;