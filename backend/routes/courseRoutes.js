const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const logger = require('../utils/logger');

// Get all courses statistics
router.get('/students/courses/stats', async (req, res) => {
  try {
    logger.general('Fetching course statistics...');

    // First, get all courses to check what's available
    const allCourses = await Student.distinct('courses.courseId');
    logger.general('All available courses:', allCourses);

    // Get all unique courses and their details
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

    // Process courses and group by type and branch
    const courseStats = await Promise.all(courses.map(async (course) => {
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
    }));

    // Group courses by type and branch
    const coursesByType = courseStats.reduce((acc, course) => {
      // Initialize type if not exists
      if (!acc[course.type]) {
        acc[course.type] = {
          totalCourses: 0,
          totalEnrollments: 0,
          coursesByBranch: {}
        };
      }

      // Initialize branch if not exists
      if (!acc[course.type].coursesByBranch[course.branch]) {
        acc[course.type].coursesByBranch[course.branch] = [];
      }

      // Add course to its branch
      acc[course.type].coursesByBranch[course.branch].push(course);
      
      // Update totals
      acc[course.type].totalCourses++;
      acc[course.type].totalEnrollments += course.totalEnrollments;

      return acc;
    }, {});

    res.json({
      totalCourses: courseStats.length,
      courses: courseStats,
      coursesByType
    });

  } catch (error) {
    logger.error('Error fetching course statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed statistics for a specific course
router.get('/students/courses/:courseId/stats', async (req, res) => {
  try {
    const { courseId } = req.params;
    logger.general(`Fetching statistics for course: ${courseId}`);

    const studentsInCourse = await Student.find({
      'courses.courseId': courseId.toLowerCase()
    }).select('courses.$');

    const weeklyStats = Array.from({ length: 12 }, (_, i) => ({
      week: `Week ${i + 1} Assignment`,
      submitted: 0,
      unsubmitted: 0,
      total: 0,
      submissionRate: 0
    }));

    studentsInCourse.forEach(student => {
      const courseResults = student.courses[0].results || [];
      
      weeklyStats.forEach((weekStat, idx) => {
        const result = courseResults.find(r => r.week === weekStat.week);
        weekStat.total++;
        if (result && result.score > 0) {
          weekStat.submitted++;
        } else {
          weekStat.unsubmitted++;
        }
      });
    });

    weeklyStats.forEach(week => {
      week.submissionRate = ((week.submitted / week.total) * 100).toFixed(2);
    });

    const courseDetails = await Student.findOne({
      'courses.courseId': courseId.toLowerCase()
    }).select('courses.$');

    const response = {
      courseId,
      courseName: courseDetails?.courses[0]?.courseName || 'N/A',
      totalStudents: studentsInCourse.length,
      weeklyStats,
      overallStats: {
        totalSubmissions: weeklyStats.reduce((sum, week) => sum + week.submitted, 0),
        averageSubmissionRate: (
          weeklyStats.reduce((sum, week) => sum + parseFloat(week.submissionRate), 0) / 
          weeklyStats.length
        ).toFixed(2)
      }
    };

    res.json(response);

  } catch (error) {
    logger.error(`Error fetching statistics for course ${req.params.courseId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 