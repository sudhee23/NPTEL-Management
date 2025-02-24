// Get all courses statistics
router.get('/courses/stats', async (req, res) => {
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

    res.json({
      totalCourses: courseStats.length,
      courses: courseStats
    });

  } catch (error) {
    logger.error('Error fetching course statistics:', error);
    res.status(500).json({ error: error.message });
  }
}); 