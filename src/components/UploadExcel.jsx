import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
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

function UploadExcel() {
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
      const response = await axios.post('https://nptel-management-backend.onrender.com/api/students/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data);
      toast({
        title: 'Upload successful',
        description: `Processed ${response.data.successful} students`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.response?.data?.error || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  return (
    <Box>
      <Heading mb={6}>Upload Student Data</Heading>

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
              ? "Drop the Excel file here"
              : "Drag and drop an Excel file here, or click to select"}
          </Text>
          <Text color="gray.500" fontSize="sm">
            Supports .xlsx and .xls files
          </Text>
        </VStack>
      </Box>

      {uploading && (
        <Box mb={6}>
          <Text mb={2}>Uploading...</Text>
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
          <AlertTitle mb={2}>Upload Complete</AlertTitle>
          <AlertDescription>
            <Text>Successfully processed: {uploadResult.successful} students</Text>
            {uploadResult.failed > 0 && (
              <Text color="red.500">Failed entries: {uploadResult.failed}</Text>
            )}
          </AlertDescription>
        </Alert>
      )}
    </Box>
  );
}

export default UploadExcel;