/**
 * @file projectRoutes.js
 * @description Routes for project / deal pipeline management.
 */

const express = require('express');
const {
  getAllProjects,
  getProjectById,
  createProject,
  approveProject,
} = require('../controllers/projectController');
const { authenticate, authorizeManager } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.patch('/:id/approve', authorizeManager, approveProject);

module.exports = router;
