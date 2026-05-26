const express = require('express');
const router  = express.Router();

const { getFile, calculate, processRequest } = require('../controllers/utilController');

// No auth, no rate limiting, no input sanitisation middleware
router.get('/file',    getFile);
router.post('/calc',   calculate);
router.post('/process', processRequest);

module.exports = router;
