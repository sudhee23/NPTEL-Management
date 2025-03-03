import React from 'react';
import { Box, Text, VStack, Stack, Container, Divider } from '@chakra-ui/react';

const Footer = () => {
  const names = [
    ["Siddhartha (N200081)", "Satya Vamsi (N200346)", "Bhanu Vara Prasad (N200532)"],
    ["KMS Sudheer (N200715)", "Dheeraj (N200800)"]
  ];

  return (
    <Box 
      as="footer" 
      bg="gray.800" 
      color="white"
      py={{ base: 8, md: 12 }}
      mt="auto"
    >
      <Container maxW="container.xl">
        <VStack spacing={8}>
          {/* Main Content */}
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={{ base: 8, md: 16 }}
            w="full"
            justify="space-between"
            align={{ base: 'center', md: 'flex-start' }}
          >
            {/* Left Section */}
            <VStack align={{ base: 'center', md: 'flex-start' }} spacing={4}>
              <Text
                fontSize="2xl"
                fontWeight="bold"
                bgGradient="linear(to-r, blue.400, purple.400)"
                bgClip="text"
              >
                NPTEL Management
              </Text>
              <Text
                color="gray.400"
                textAlign={{ base: 'center', md: 'left' }}
                maxW="md"
              >
                Empowering education through efficient course management and student progress tracking.
              </Text>
            </VStack>

            {/* Right Section */}
            <VStack align={{ base: 'center', md: 'flex-start' }} spacing={4}>
              <Text
                fontSize="lg"
                fontWeight="semibold"
                color="gray.300"
              >
                Developed by RGUKT-Nuzvid CSE
              </Text>
              <VStack 
                spacing={3} 
                align={{ base: 'center', md: 'flex-start' }}
                w="full"
              >
                {names.map((row, rowIndex) => (
                  <Stack
                    key={rowIndex}
                    direction={{ base: 'column', sm: 'row' }}
                    spacing={{ base: 2, sm: 4, md: 6 }}
                    justify={{ base: 'center', md: 'flex-start' }}
                    align="center"
                    w="full"
                  >
                    {row.map((name) => (
                      <Text
                        key={name}
                        color="gray.400"
                        fontSize="sm"
                        _hover={{
                          color: 'blue.300',
                          transform: 'translateY(-2px)'
                        }}
                        transition="all 0.3s"
                        cursor="pointer"
                        textAlign="center"
                      >
                        {name}
                      </Text>
                    ))}
                  </Stack>
                ))}
              </VStack>
            </VStack>
          </Stack>

          <Divider borderColor="gray.700" />

          {/* Bottom Section */}
          <Text 
            color="gray.400" 
            fontSize="sm"
            textAlign="center"
          >
            © {new Date().getFullYear()} NPTEL Management. All rights reserved.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default Footer; 