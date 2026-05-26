# Intentional Vulnerabilities & Code Smells

This document catalogs every deliberate flaw introduced into the codebase.
All issues are **intentional** and serve as ground-truth targets for the CI/CD
toolchain (Snyk SAST, Snyk SCA, SonarQube, CodeRabbit).

---

## 1. Security Vulnerabilities (Snyk SAST targets)

### 1.1 SQL Injection
| Field | Detail |
|---|---|
| **File** | `src/controllers/userController.js` — `searchUsers()` |
| **Endpoint** | `GET /users/search?name=<input>` |
| **Mechanism** | User-supplied `name` is concatenated directly into the SQL string: `"… WHERE name LIKE '%" + name + "%'"` — no parameterisation. |
| **Expected tool** | Snyk SAST (CWE-89) |
| **Why introduced** | Demonstrates the classic string-concatenation anti-pattern that Snyk's taint-analysis engine is designed to detect. |

### 1.2 Remote Code Execution via `eval()`
| Field | Detail |
|---|---|
| **File** | `src/controllers/utilController.js` — `calculate()` |
| **Endpoint** | `POST /calc` body `{ "expression": "…" }` |
| **Mechanism** | `eval(expression)` executes arbitrary attacker-controlled JavaScript in the server process. |
| **Expected tool** | Snyk SAST (CWE-95) |
| **Why introduced** | `eval()` on untrusted input is one of the highest-severity SAST findings; included to verify the rule fires reliably. |

### 1.3 Path Traversal
| Field | Detail |
|---|---|
| **File** | `src/controllers/utilController.js` — `getFile()` |
| **Endpoint** | `GET /file?path=../../etc/passwd` |
| **Mechanism** | `fs.readFileSync(filePath, 'utf8')` with no `path.resolve()`, no prefix check, and no extension allow-list. |
| **Expected tool** | Snyk SAST (CWE-22) |
| **Why introduced** | Validates that Snyk catches unsanitised user-controlled file paths reaching filesystem APIs. |

### 1.4 Hardcoded Secrets
| Field | Detail |
|---|---|
| **Files** | `src/db/database.js`, `src/controllers/authController.js` |
| **Secrets** | `JWT_SECRET`, `ADMIN_API_KEY`, `INTERNAL_TOKEN`, `STRIPE_KEY`, `INTERNAL_API_KEY` |
| **Mechanism** | Credentials committed in plain text to source control. |
| **Expected tool** | Snyk SAST (CWE-798), SonarQube (S6706 / S2068) |
| **Why introduced** | Hard-coded secrets are among the most common real-world findings; used to confirm secret-detection rules trigger across multiple files. |

### 1.5 JWT Algorithm Confusion (none-algorithm attack)
| Field | Detail |
|---|---|
| **File** | `src/controllers/authController.js` — `verifyToken()` |
| **Mechanism** | `jwt.verify(token, secret, { algorithms: ['HS256', 'none'] })` accepts tokens whose header declares `"alg":"none"`, requiring no signature. An attacker can forge any payload. |
| **Expected tool** | Snyk SAST (CWE-347), Snyk SCA (CVE-2022-23539 on jsonwebtoken 8.5.1) |
| **Why introduced** | Tests both the SAST taint rule for insecure JWT verification and the SCA rule for the vulnerable library version. |

---

## 2. Dependency Vulnerabilities (Snyk SCA targets)

> **Note:** The following package versions are **deliberately outdated** to provide
> known CVE targets for Snyk Software Composition Analysis. Do not upgrade them.

| Package | Pinned version | Known CVEs |
|---|---|---|
| `express` | `4.17.1` | CVE-2024-29041 — open redirect via malformed URL (fixed in 4.19.2) |
| `lodash` | `4.17.4` | CVE-2019-10744 — prototype pollution via `defaultsDeep`; CVE-2020-28500 — ReDoS; CVE-2021-23337 — command injection via `template` |
| `jsonwebtoken` | `8.5.1` | CVE-2022-23529 — improper restriction of security attributes; CVE-2022-23539 — `algorithms` header confusion allows signature bypass |

---

## 3. Code Quality Issues (SonarQube targets)

### 3.1 High Cyclomatic Complexity
| Field | Detail |
|---|---|
| **File** | `src/controllers/utilController.js` — `processRequest()` |
| **Endpoint** | `POST /process` |
| **Mechanism** | Deeply nested `if/else if/else` chains produce a cyclomatic complexity well above 10 (SonarQube default threshold). |
| **Expected rule** | SonarQube `javascript:S3776` (Cognitive Complexity) |

### 3.2 Significant Code Duplication
| Field | Detail |
|---|---|
| **Files** | `src/controllers/userController.js`, `src/controllers/taskController.js`, `src/controllers/authController.js` |
| **Mechanism** | An identical 16-line `_validateFields()` block is copy-pasted verbatim into all three controllers with no shared abstraction. |
| **Expected rule** | SonarQube copy-paste detection (`common-js:DuplicatedBlocks`) |

### 3.3 Unused Variables & Dead Code
| Field | Detail |
|---|---|
| **Examples** | `MAX_USERS`, `unusedConfig`, `DEBUG_FLAG` in `userController.js`; `TASK_LIMIT`, `debugMode`, `unusedCache` in `taskController.js`; dead `if (false) { … }` block in `getTask()`; code after `res.json()` in `login()` |
| **Expected rules** | SonarQube `javascript:S1481` (unused vars), `javascript:S1764` (identical sub-expressions), `javascript:S1116` (empty statements) |

### 3.4 Empty Catch Blocks
| Field | Detail |
|---|---|
| **Locations** | `searchUsers()` catch in `userController.js`; `getTask()` catch in `taskController.js` |
| **Mechanism** | `catch (err) { }` — error is silently swallowed; no response is sent, leaving the HTTP request hanging. |
| **Expected rule** | SonarQube `javascript:S2486` (empty catch block) |

### 3.5 `console.log` Throughout (no logger)
| Field | Detail |
|---|---|
| **Scope** | Every controller and `database.js` use `console.log` for all output including sensitive data (emails, user IDs, tokens). |
| **Expected rule** | SonarQube `javascript:S2228` / CodeRabbit logging smell |

---

## 4. Architectural Smells (CodeRabbit targets)

### 4.1 Business Logic in Route Handlers / Controllers
No service layer exists. DB queries, permission checks, status-resolution logic, and email simulation all live directly in controller functions. CodeRabbit flags the missing separation of concerns.

### 4.2 No Input Validation Middleware
Validation is performed inline inside each controller, inconsistently. Some fields are checked, others are not. No shared middleware or schema-validation library (e.g., Joi, Zod) is used. CodeRabbit flags the absence of a validation layer.

### 4.3 God Functions
`createUser()` in `userController.js` and `login()` in `authController.js` each exceed 80 lines and perform database access, business logic, fake email sending, audit logging, and response formatting without delegation. CodeRabbit flags these as violations of the Single Responsibility Principle.

### 4.4 No Error-Handling Middleware
There is no `app.use((err, req, res, next) => { … })` middleware in `app.js`. Each route handles errors differently — some return 500, some have empty catch blocks, some send no response at all. CodeRabbit flags this inconsistency.

### 4.5 Magic Numbers & Magic Strings
Inline literals like `255`, `100`, `50`, `'pending'`, `'in_progress'`, `'admin'`, `'user'`, `'moderator'` are scattered across multiple files with no shared constants module. CodeRabbit flags these as maintainability issues.
