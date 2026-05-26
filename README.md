# CI/CD Test App — User & Task Management API

A deliberately vulnerable and architecturally flawed Node.js/Express REST API built
as a static target for CI/CD pipeline security and quality tooling.

> **WARNING — DO NOT DEPLOY.**
> This application contains intentional security vulnerabilities, outdated
> dependencies with known CVEs, and severe architectural defects. It exists solely
> to exercise Snyk SAST, Snyk SCA, SonarQube, and CodeRabbit in a controlled
> pipeline. See [VULNERABILITIES.md](VULNERABILITIES.md) for the full catalogue.

---

## Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express 4.17.1 (**intentionally outdated — CVE-2024-29041**) |
| Database | SQLite via `better-sqlite3` (file-based, no external server) |
| Auth | `jsonwebtoken` 8.5.1 (**intentionally outdated — CVE-2022-23529, CVE-2022-23539**) |
| Utilities | `lodash` 4.17.4 (**intentionally outdated — CVE-2019-10744, CVE-2020-28500, CVE-2021-23337**) |
| Tests | Jest + Supertest (~60 % coverage by design — gaps are intentional) |

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/users` | Create a user |
| `GET` | `/users/search?name=` | Search users — **SQL injection** |
| `POST` | `/tasks` | Create a task |
| `GET` | `/tasks/:id` | Get a task |
| `POST` | `/auth/login` | Login — **flawed JWT** |
| `GET` | `/file?path=` | Read a file — **path traversal** |
| `POST` | `/calc` | Evaluate an expression — **`eval()` RCE** |
| `POST` | `/process` | Complex branching endpoint — **cyclomatic complexity** |

---

## Quick start

```bash
npm install
cp .env.example .env
npm start          # http://localhost:3000
npm test           # runs Jest with --coverage
```

---

## Intentional dependency vulnerabilities

The following packages are pinned to old versions **on purpose**. Do not upgrade them —
they are the SCA targets for Snyk:

- **express 4.17.1** — CVE-2024-29041
- **lodash 4.17.4** — CVE-2019-10744, CVE-2020-28500, CVE-2021-23337
- **jsonwebtoken 8.5.1** — CVE-2022-23529, CVE-2022-23539
