import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Heading,
  Text,
  VStack,
  useToast,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';
import axios from 'axios';

function UpdateWeeklyScore() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const toast = useToast();

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadResult(null);

    try {
      const response = await axios.post('https://nptel-management-backend.onrender.com/api/students/updateweekscore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data);
      toast({
        title: 'Update successful',
        description: `Processed ${response.data.successful} students for course ${response.data.courseId}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Something went wrong';
      
      // Check if the error is related to filename format
      if (errorMessage.includes('filename format')) {
        toast({
          title: 'Invalid Filename',
          description: 'Please check the filename format: [branch code][number].csv (e.g., cs52.csv)',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Update failed',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  return (
    <Box>
      <Heading mb={6}>Update Weekly Scores</Heading>

      <Box
        {...getRootProps()}
        p={10}
        bg="white"
        borderRadius="lg"
        borderWidth={2}
        borderStyle="dashed"
        borderColor={isDragActive ? "blue.500" : "gray.200"}
        cursor="pointer"
        _hover={{
          borderColor: "blue.500"
        }}
        mb={6}
      >
        <input {...getInputProps()} />
        <VStack spacing={3}>
          <FiUpload size="48px" color={isDragActive ? "#4299E1" : "#A0AEC0"} />
          <Text color="gray.600" textAlign="center">
            {isDragActive
              ? "Drop the CSV file here"
              : "Drag and drop a CSV file here, or click to select"}
          </Text>
          <Text color="gray.500" fontSize="sm">
            File name format: [branch code][number].csv
            <br />
            Example: cs52.csv, me67.csv, etc.
          </Text>
        </VStack>
      </Box>

      {uploading && (
        <Box mb={6}>
          <Text mb={2}>Updating scores...</Text>
          <Progress size="xs" isIndeterminate />
        </Box>
      )}

      {uploadResult && (
        <Alert
          status={uploadResult.failed > 0 ? "warning" : "success"}
          variant="subtle"
          flexDirection="column"
          alignItems="flex-start"
          p={4}
          borderRadius="lg"
        >
          <AlertIcon />
          <AlertTitle mb={2}>Update Complete</AlertTitle>
          <AlertDescription>
            <Text>Course: {uploadResult.courseId}</Text>
            <Text>Successfully updated: {uploadResult.successful} students</Text>
            {uploadResult.failed > 0 && (
              <>
                <Text color="red.500">Failed updates: {uploadResult.failed}</Text>
                <Text fontSize="sm" mt={2}>Check the console for detailed error messages</Text>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </Box>
  );
}

export default UpdateWeeklyScore; 