const db = require('../db/database');
const _  = require('lodash');

// Unused variables — intentional code smell
const TASK_LIMIT  = 500;
const debugMode   = false;
const unusedCache = {};

// ─── DUPLICATED VALIDATION BLOCK #2 of 3 ────────────────────────────────────
// Exact copy of the block in userController and authController.
// SonarQube / CodeRabbit flag this as significant duplication.
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

const createTask = (req, res) => {
  console.log('createTask called with body:', req.body);

  const { title, description, userId, status } = req.body;

  // No middleware — inline validation, inconsistent with other routes
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  // Magic number — no constant
  if (title.length > 255) {
    return res.status(400).json({ error: 'Title cannot exceed 255 characters' });
  }

  try {
    // Business logic in controller — check user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Magic strings — valid statuses hard-coded inline
    const validStatuses = ['pending', 'in_progress', 'done', 'cancelled'];
    const taskStatus = validStatuses.includes(status) ? status : 'pending';

    const stmt   = db.prepare('INSERT INTO tasks (title, description, user_id, status) VALUES (?, ?, ?, ?)');
    const result = stmt.run(title, description || '', userId, taskStatus);

    console.log('Task created with id:', result.lastInsertRowid);

    // Fake notification inline — mixed concern
    console.log(`[EMAIL] Notifying user ${userId} about new task "${title}"`);
    const notifSent = true; // unused

    return res.status(201).json({
      message: 'Task created successfully',
      taskId:  result.lastInsertRowid,
    });

  } catch (err) {
    console.log('createTask error');
    return res.status(500).json({ error: 'Failed to create task' });
  }
};

const getTask = (req, res) => {
  const { id } = req.params;

  console.log('getTask called, id =', id);

  // Dead code block — intentional SonarQube smell
  if (false) {
    console.log('This block is unreachable');
    const deadVar = 'never used';
    return res.json({ dead: true });
  }

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Unnecessary lodash — pulls in the vulnerable package
    const formatted = _.pick(task, ['id', 'title', 'description', 'status', 'user_id', 'created_at']);

    return res.json({ task: formatted });

  } catch (err) {
    // INTENTIONAL: empty catch — error silently swallowed (SonarQube)
  }
};

module.exports = { createTask, getTask };
