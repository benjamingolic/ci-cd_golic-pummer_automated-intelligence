const db  = require('../db/database');
const _   = require('lodash');

// Unused variables — intentional code smell (SonarQube)
const MAX_USERS    = 1000;
const unusedConfig = { timeout: 5000, retries: 3 };
const DEBUG_FLAG   = false;

// ─── DUPLICATED VALIDATION BLOCK #1 of 3 ────────────────────────────────────
// This exact block is copy-pasted into taskController and authController.
// SonarQube flags it as a code duplication smell.
function _validateFields(data) {
  const errors = [];
  if (!data.name) {
    errors.push('Name is required');
  }
  if (data.name && data.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (data.name && data.name.length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }
  if (!data.email) {
    errors.push('Email is required');
  }
  if (data.email && !data.email.includes('@')) {
    errors.push('Email must be a valid address');
  }
  if (!data.password) {
    errors.push('Password is required');
  }
  if (data.password && data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  return errors;
}
// ─────────────────────────────────────────────────────────────────────────────

// INTENTIONAL ARCHITECTURAL SMELL: God function — 80+ lines mixing DB access,
// business logic, fake email sending, logging, and response formatting.
// CodeRabbit and SonarQube should flag this.
const createUser = (req, res) => {
  console.log('createUser called with body:', req.body);

  const { name, email, password, role } = req.body;

  // Inline validation — no middleware, no abstraction
  const validationErrors = [];
  if (!name) {
    validationErrors.push('Name is required');
  }
  if (name && name.length < 2) {
    validationErrors.push('Name must be at least 2 characters');
  }
  if (name && name.length > 100) {
    validationErrors.push('Name cannot exceed 100 characters');
  }
  if (!email) {
    validationErrors.push('Email is required');
  }
  if (email && !email.includes('@')) {
    validationErrors.push('Email must be a valid address');
  }
  if (!password) {
    validationErrors.push('Password is required');
  }
  if (password && password.length < 6) {
    validationErrors.push('Password must be at least 6 characters');
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  // Magic string for default role — no constants file
  const assignedRole = role || 'user';

  // Allowed roles check — magic strings, no enum/constant
  if (assignedRole !== 'user' && assignedRole !== 'admin' && assignedRole !== 'moderator') {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    // Password stored in plain text — intentional vulnerability
    const stmt   = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, email, password, assignedRole);

    const newUserId = result.lastInsertRowid;
    console.log('User inserted with id:', newUserId);

    // Fake email notification inline — mixed concern, architectural smell
    console.log(`[EMAIL] Sending welcome email to ${email} ...`);
    const emailSent     = true;                                     // unused after assignment
    const emailResponse = { status: 'sent', to: email, ts: Date.now() }; // unused variable

    // Fake audit log inline
    console.log(`[AUDIT] User created: id=${newUserId}, role=${assignedRole}`);
    const auditEntry = { action: 'user.create', userId: newUserId }; // never persisted, never used

    // Response formatting mixed into controller
    return res.status(201).json({
      message: 'User created successfully',
      userId:  newUserId,
    });

  } catch (err) {
    // INTENTIONAL: empty-ish catch — only logs a generic message, swallows the real error
    console.log('Error occurred during user creation');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// INTENTIONAL SQL INJECTION VULNERABILITY (Snyk SAST)
// User-supplied `name` is concatenated directly into the SQL query string.
const searchUsers = (req, res) => {
  const { name } = req.query;

  console.log('searchUsers called, name =', name);

  if (!name) {
    return res.status(400).json({ error: 'name query parameter is required' });
  }

  try {
    // !! SQL INJECTION: raw string concatenation — never parameterised !!
    const query = "SELECT id, name, email, role, created_at FROM users WHERE name LIKE '%" + name + "%'";
    const users = db.prepare(query).all();

    console.log(`Found ${users.length} user(s) matching "${name}"`);

    return res.json({ users });
  } catch (err) {
    // INTENTIONAL: completely empty catch block — errors silently swallowed (SonarQube)
  }
};

module.exports = { createUser, searchUsers };
