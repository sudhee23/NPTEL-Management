const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const logger = require('../utils/logger');

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

// ... other routes ...

module.exports = router; 