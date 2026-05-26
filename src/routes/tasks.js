const express = require('express');
const router  = express.Router();

const { createTask, getTask } = require('../controllers/taskController');

// No auth middleware protecting task creation — intentional
router.post('/',   createTask);
router.get('/:id', getTask);

module.exports = router;
