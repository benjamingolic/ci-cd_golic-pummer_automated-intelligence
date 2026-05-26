const fs   = require('fs');
const path = require('path');

// Unused variable
const ALLOWED_EXTENSIONS = ['.txt', '.json', '.log'];

// INTENTIONAL PATH TRAVERSAL VULNERABILITY (Snyk SAST)
// The `path` query param is passed directly to fs.readFileSync with no
// sanitisation, allowing `../../../../etc/passwd` style traversal.
const getFile = (req, res) => {
  const filePath = req.query.path;

  console.log('getFile called with path:', filePath);

  if (!filePath) {
    return res.status(400).json({ error: 'path query parameter is required' });
  }

  try {
    // !! PATH TRAVERSAL: no path.resolve(), no prefix-check, no extension allow-list !!
    const content = fs.readFileSync(filePath, 'utf8');
    return res.send(content);
  } catch (err) {
    return res.status(404).json({ error: 'File not found or unreadable' });
  }
};

// INTENTIONAL eval() VULNERABILITY (Snyk SAST / SonarQube)
// Arbitrary user-supplied expressions are evaluated — Remote Code Execution vector.
const calculate = (req, res) => {
  const { expression } = req.body;

  console.log('calculate called with expression:', expression);

  if (!expression) {
    return res.status(400).json({ error: 'expression is required' });
  }

  try {
    // !! CODE INJECTION: eval() on unsanitised user input !!
    const result = eval(expression); // eslint-disable-line no-eval
    return res.json({ result });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid expression' });
  }
};

// INTENTIONAL HIGH CYCLOMATIC COMPLEXITY (SonarQube)
// Deeply nested if/else chains push cyclomatic complexity well above 10.
// CodeRabbit and SonarQube both flag this.
const processRequest = (req, res) => {
  const { type, action, data, mode, priority, format, version, target, source, flags } = req.body;

  console.log('processRequest called, type =', type);

  // Unused variable set before deep branching
  const requestId = Math.random().toString(36).slice(2);

  if (type === 'user') {
    if (action === 'create') {
      if (mode === 'batch') {
        if (data && data.length > 0) {
          if (priority === 'high') {
            if (format === 'json') {
              // Magic number 100 — no constant
              if (data.length > 100) {
                return res.status(400).json({ error: 'JSON batch size exceeds limit of 100' });
              } else {
                return res.json({ status: 'queued', type: 'batch-user-create-high-json' });
              }
            } else if (format === 'csv') {
              // Magic number 50
              if (data.length > 50) {
                return res.status(400).json({ error: 'CSV batch size exceeds limit of 50' });
              } else {
                return res.json({ status: 'queued', type: 'batch-user-create-high-csv' });
              }
            } else if (format === 'xml') {
              return res.json({ status: 'queued', type: 'batch-user-create-high-xml' });
            } else {
              return res.status(400).json({ error: 'Unsupported batch format' });
            }
          } else if (priority === 'normal') {
            if (format === 'json') {
              return res.json({ status: 'queued', type: 'batch-user-create-normal-json' });
            } else {
              return res.json({ status: 'queued', type: 'batch-user-create-normal' });
            }
          } else if (priority === 'low') {
            return res.json({ status: 'queued', type: 'batch-user-create-low' });
          } else {
            return res.json({ status: 'queued', type: 'batch-user-create' });
          }
        } else {
          return res.status(400).json({ error: 'No data provided for batch operation' });
        }
      } else if (mode === 'single') {
        if (data) {
          if (version === 'v1') {
            return res.json({ status: 'processing', type: 'single-user-create-v1' });
          } else if (version === 'v2') {
            if (flags && flags.includes('async')) {
              return res.json({ status: 'async', type: 'single-user-create-v2-async' });
            } else if (flags && flags.includes('dry-run')) {
              return res.json({ status: 'dry-run', type: 'single-user-create-v2-dry' });
            } else {
              return res.json({ status: 'processing', type: 'single-user-create-v2' });
            }
          } else {
            return res.json({ status: 'processing', type: 'single-user-create' });
          }
        } else {
          return res.status(400).json({ error: 'No data provided for single create' });
        }
      } else {
        return res.status(400).json({ error: 'Unknown mode for user create' });
      }
    } else if (action === 'delete') {
      if (target) {
        if (source === 'admin') {
          if (flags && flags.includes('hard-delete')) {
            return res.json({ status: 'hard-deleted', target });
          } else {
            return res.json({ status: 'soft-deleted', target });
          }
        } else {
          return res.status(403).json({ error: 'Only admin source may delete users' });
        }
      } else {
        return res.status(400).json({ error: 'target is required for delete action' });
      }
    } else if (action === 'update') {
      if (data && target) {
        return res.json({ status: 'updated', target });
      } else {
        return res.status(400).json({ error: 'data and target are required for update' });
      }
    } else {
      return res.status(400).json({ error: 'Unknown action for type user' });
    }
  } else if (type === 'task') {
    if (action === 'update') {
      if (data && target) {
        return res.json({ status: 'task-updated', target });
      } else {
        return res.status(400).json({ error: 'data and target are required for task update' });
      }
    } else if (action === 'close') {
      if (target) {
        return res.json({ status: 'task-closed', target });
      } else {
        return res.status(400).json({ error: 'target required for task close' });
      }
    } else {
      return res.status(400).json({ error: 'Unknown action for type task' });
    }
  } else {
    return res.status(400).json({ error: 'Unknown request type' });
  }
};

module.exports = { getFile, calculate, processRequest };
