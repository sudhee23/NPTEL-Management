import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  // Check token expiration


  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('tokenExpiration');
    navigate('/login');
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please login again.",
      status: "warning",
      duration: 2000,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const correctPassword = "admin123"; 

      if (password === correctPassword) {
        // Set authentication and expiration time (1 minute from now)
        const expirationTime = new Date().getTime() + 60000; // 60000 ms = 1 minute
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('tokenExpiration', expirationTime.toString());
        
        toast({
          title: "Login Successful",
          description: "Session will expire in 1 minute",
          status: "success",
          duration: 2000,
        });
        navigate('/');
      } else {
        toast({
          title: "Invalid Password",
          status: "error",
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        status: "error",
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      height="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      bg="gray.50"
    >
      <VStack
        as="form"
        onSubmit={handleSubmit}
        spacing={6}
        p={8}
        bg="white"
        borderRadius="lg"
        boxShadow="lg"
        width="100%"
        maxW="400px"
      >
        <Heading size="lg">Login</Heading>
        <InputGroup size="lg">
          <Input
            pr="4.5rem"
            type={show ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputRightElement width="4.5rem">
            <IconButton
              h="1.75rem"
              size="sm"
              onClick={() => setShow(!show)}
              icon={show ? <ViewOffIcon /> : <ViewIcon />}
              aria-label={show ? "Hide password" : "Show password"}
            />
          </InputRightElement>
        </InputGroup>
        <Button
          colorScheme="blue"
          width="100%"
          size="lg"
          type="submit"
          isLoading={loading}
        >
          Login
        </Button>
      </VStack>
    </Box>
  );
}

export default Login; 