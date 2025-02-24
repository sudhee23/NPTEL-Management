const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const logger = require('../utils/logger');
const upload = require('../utils/upload');

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    logger.error('Error fetching students:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get course statistics - moved to root level of /courses/stats
router.get('/courses/stats', async (req, res) => {
  try {
    logger.general('Fetching course statistics...');

    const courses = await Student.aggregate([
      { $unwind: '$courses' },
      {
        $group: {
          _id: '$courses.courseId',
          courseName: { $first: '$courses.courseName' },
          totalEnrollments: { $sum: 1 },
          allResults: { $push: '$courses.results' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const courseStats = courses.map(course => {
      const courseId = course._id;
      const [type, branchWithNum] = courseId.split('-');
      const branch = branchWithNum?.replace(/\d+/g, '').toUpperCase();

      return {
        courseId,
        courseName: course.courseName || `${type.toUpperCase()} ${branch} Course`,
        branch,
        type: type.toUpperCase(),
        totalEnrollments: course.totalEnrollments
      };
    });

    logger.general(`Found ${courseStats.length} courses`);
    res.json({
      totalCourses: courseStats.length,
      courses: courseStats
    });

  } catch (error) {
    logger.error('Error fetching course statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update the updateweekscore route
router.post('/updateweekscore', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      logger.error('No file received');
      return res.status(400).json({ error: 'Please upload a CSV file' });
    }

    const filename = req.file.originalname;
    logger.general('Processing file:', filename);

    // Extract course info from filename
    const filenameRegex = /(cs|me|ce|ee|ece|ch|ge|de|mm)(\d+)\.csv$/i;
    const courseMatch = filename.match(filenameRegex);

    if (!courseMatch) {
      logger.error('Invalid filename format:', filename);
      return res.status(400).json({ 
        error: 'Filename format mismatched. Expected format: [branch code][number].csv (e.g., cs52.csv)',
        filename 
      });
    }

    const branch = courseMatch[1].toLowerCase();
    const number = courseMatch[2];
    const courseId = `noc25-${branch}${number}`;
    logger.general('Processing for course:', courseId);

    const { facultyName } = req.body;
    if (!facultyName || !courseId) {
      return res.status(400).json({ 
        message: 'Faculty name and course ID are required' 
      });
    }

    // Process the CSV file
    const errors = [];
    // ... rest of your processing logic ...

    // Add faculty and course context to errors
    const contextualErrors = errors.map(error => ({
      ...error,
      faculty: facultyName,
      course: courseId
    }));

    res.json({
      message: 'File processed',
      errors: contextualErrors
    });

  } catch (error) {
    logger.error('Error in updateweekscore:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add these new routes for faculty and course data
router.get('/faculty-names', async (req, res) => {
  try {
    logger.general('Fetching faculty names...');
    
    const facultyList = await Student.aggregate([
      { $unwind: '$courses' },
      {
        $group: {
          _id: '$courses.facultyName',
          facultyName: { $first: '$courses.facultyName' }
        }
      },
      {
        $match: {
          facultyName: { $exists: true, $ne: null }
        }
      },
      {
        $sort: { facultyName: 1 }
      }
    ]);

    res.json({
      success: true,
      facultyList: facultyList.map(f => ({
        _id: f._id,
        facultyName: f.facultyName
      }))
    });

  } catch (error) {
    logger.error('Error fetching faculty names:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch faculty names'
    });
  }
});

router.get('/faculty-courses', async (req, res) => {
  try {
    const { facultyName } = req.query;
    if (!facultyName) {
      return res.status(400).json({
        success: false,
        error: 'Faculty name is required'
      });
    }

    logger.general(`Fetching courses for faculty: ${facultyName}`);

    const courses = await Student.aggregate([
      { $unwind: '$courses' },
      {
        $match: {
          'courses.facultyName': facultyName
        }
      },
      {
        $group: {
          _id: '$courses.courseId',
          courseId: { $first: '$courses.courseId' },
          courseName: { $first: '$courses.courseName' }
        }
      },
      {
        $sort: { courseId: 1 }
      }
    ]);

    res.json({
      success: true,
      allCourses: courses.map(c => ({
        courseId: c.courseId,
        courseName: c.courseName || c.courseId
      }))
    });

  } catch (error) {
    logger.error('Error fetching faculty courses:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch faculty courses'
    });
  }
});

// Update the faculty-courses-data route
router.get('/faculty-courses-data', async (req, res) => {
  try {
    logger.general('Fetching faculty and course data...');

    // First get all unique faculty names
    const facultyNames = await Student.distinct('courses.subjectMentor', {
      'courses.subjectMentor': { $ne: null, $ne: '' }
    });

    logger.general(`Found ${facultyNames.length} unique faculty names`);

    // Then get courses for each faculty
    const facultyCoursesData = await Promise.all(facultyNames.map(async (facultyName) => {
      const courses = await Student.aggregate([
        { $unwind: '$courses' },
        {
          $match: {
            'courses.subjectMentor': facultyName
          }
        },
        {
          $group: {
            _id: {
              courseId: '$courses.courseId',
              courseName: '$courses.courseName'
            },
            studentCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            courseId: '$_id.courseId',
            courseName: {
              $cond: [
                { $eq: ['$_id.courseName', null] },
                '$_id.courseId',
                '$_id.courseName'
              ]
            },
            studentCount: 1
          }
        },
        {
          $sort: { courseId: 1 }
        }
      ]);

      // Add branch and type information to courses
      const enhancedCourses = courses.map(course => {
        const [type, branchWithNum] = course.courseId.split('-');
        const branch = branchWithNum?.replace(/\d+/g, '').toUpperCase();
        const number = branchWithNum?.match(/\d+/)?.[0];

        return {
          ...course,
          branch,
          type: type.toUpperCase(),
          courseNumber: number,
          displayName: `${course.courseName} (${course.courseId})`
        };
      });

      return {
        facultyName,
        courses: enhancedCourses
      };
    }));

    // Sort faculty by name
    facultyCoursesData.sort((a, b) => a.facultyName.localeCompare(b.facultyName));

    logger.general(`Processed data for ${facultyCoursesData.length} faculty members`);
    logger.general('Sample faculty data:', facultyCoursesData[0]);

    res.json({
      success: true,
      data: facultyCoursesData
    });

  } catch (error) {
    logger.error('Error fetching faculty and course data:', error);
    logger.error('Error details:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch faculty and course data',
      details: error.message
    });
  }
});

// ... other routes ...

module.exports = router; 