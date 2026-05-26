const express = require('express');
const router  = express.Router();

// Business logic lives in the controller — no service layer (intentional)
const { createUser, searchUsers } = require('../controllers/userController');

// No validation middleware — all validation is inlined inside the controller
router.post('/',      createUser);
router.get('/search', searchUsers);

module.exports = router;
