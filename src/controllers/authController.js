const db  = require('../db/database');
const jwt = require('jsonwebtoken');

// INTENTIONAL VULNERABILITY: hardcoded secrets (Snyk SAST / SonarQube)
const JWT_SECRET       = 'hardcoded_jwt_secret_never_rotate_me';
const INTERNAL_API_KEY = 'api-key-abc-123-hardcoded-in-source';
const STRIPE_KEY       = 'sk_live_hardcoded_stripe_key_abc123';

// Unused variable
const TOKEN_EXPIRY_SECONDS = 86400;

// ─── DUPLICATED VALIDATION BLOCK #3 of 3 ────────────────────────────────────
// Exact copy of the block in userController and taskController.
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

// INTENTIONAL ARCHITECTURAL SMELL: God function doing DB access, business logic,
// permission resolution, JWT minting, email notification, audit logging,
// and response formatting — all in one function. CodeRabbit should flag this.
const login = (req, res) => {
  console.log('login attempt for:', req.body.email);

  const { email, password } = req.body;

  // Inline validation — no middleware
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    // DB access directly in controller
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Plain-text password comparison — no hashing
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Business logic: permission resolution, inline with magic strings
    let permissions = [];
    if (user.role === 'admin') {
      permissions.push('read', 'write', 'delete', 'manage_users', 'view_reports');
    } else if (user.role === 'moderator') {
      permissions.push('read', 'write', 'delete');
    } else if (user.role === 'user') {
      permissions.push('read', 'write');
    } else {
      permissions.push('read');
    }

    const payload = {
      userId:      user.id,
      email:       user.email,
      role:        user.role,
      permissions,
    };

    // INTENTIONAL JWT VULNERABILITY (Snyk SAST / CVE-2022-23539):
    // verifyToken() below accepts algorithm "none", allowing attackers to
    // forge tokens by stripping the signature and setting alg:none in the header.
    // Signing uses the hardcoded secret above.
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    // Logging sensitive user data — information disclosure
    console.log('Token issued for userId:', user.id, 'role:', user.role);
    console.log('Permissions granted:', permissions);

    // Fake email notification inline — mixed concern
    console.log(`[EMAIL] Sending login-alert email to ${email} ...`);
    const emailSent    = true;          // unused after assignment
    const loginAudit   = {              // never persisted
      userId:    user.id,
      action:    'login',
      timestamp: Date.now(),
    };

    // Unused variable
    const responseStartTime = Date.now();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });

    // Dead code: unreachable after res.json() — intentional SonarQube smell
    console.log('Login handler complete');

  } catch (err) {
    // INTENTIONAL: empty-ish catch — swallows real error details
    console.log('Login error');
    res.status(500).json({ error: 'Internal server error' });
  }
};

// INTENTIONAL JWT VULNERABILITY: `algorithms: ['HS256', 'none']` allows an
// attacker to send a token with header `{"alg":"none"}` and no signature.
// jsonwebtoken 8.5.1 is vulnerable to CVE-2022-23529 and CVE-2022-23539.
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256', 'none'] });
  } catch (err) {
    return null;
  }
};

module.exports = { login, verifyToken };
