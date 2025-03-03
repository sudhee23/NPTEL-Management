import React from 'react';
import { Box, Text, VStack, Stack } from '@chakra-ui/react';

const Footer = () => {
  return (
    <Box 
      as="footer" 
      py={{ base: 4, md: 8 }}
      px={{ base: 3, md: 8 }} 
      bg="gray.50" 
      borderTop="1px" 
      borderColor="gray.200"
      mt="auto"
      boxShadow="0 -2px 10px rgba(0,0,0,0.05)"
    >
      <VStack 
        spacing={{ base: 4, md: 4 }} 
        maxW="container.xl" 
        mx="auto"
      >
        <Text 
          fontSize={{ base: "md", md: "md" }}
          color="black" 
          textAlign="center"
          fontWeight="medium"
          letterSpacing="wide"
          px={{ base: 2, md: 0 }}
        >
          Developed by students of RGUKT-Nuzvid CSE Department
        </Text>
        
        <Stack 
          direction={{ base: "column", md: "row" }}
          spacing={{ base: 3, md: 4 }}
          justify="center"
          align="center"
          color="black"
          fontSize={{ base: "sm", md: "sm" }}
          fontWeight="normal"
          py={{ base: 2, md: 2 }}
          width="100%"
          px={{ base: 4, md: 0 }}
        >
          {[
            "Siddhartha (N200081)",
            "Satya Vamsi (N200346)",
            "Bhanu Vara Prasad (N200532)",
            "KMS Sudheer (N200715)",
            "Dheeraj (N200800)"
          ].map((name, index, array) => (
            <Text 
              key={name}
              textAlign="center"
              px={{ base: 3, md: 2 }}
              py={{ base: 1, md: 0 }}
              borderRadius="md"
              _hover={{ bg: "gray.100" }}
              transition="background 0.2s"
              width={{ base: "full", md: "auto" }}
            >
              {name}
            </Text>
          ))}
        </Stack>
      </VStack>
    </Box>
  );
};

export default Footer; 