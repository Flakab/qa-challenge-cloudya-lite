# Cloudya Lite — QA Challenge Solution

## Deliverables

| File | Description |
|------|-------------|
| `app/tests/cloudya.spec.js` | Playwright automated test suite (35 tests) |
| `QA-Report.md` | Bug report — 7 bugs with steps, root cause, and fix |
| `Improvements.md` | Security, UX, validation, and automation suggestions |
| `AI-Usage.md` | AI tooling log with honest correction example |

---

## Prerequisites

- **Node.js 18+**
- **npm**

---

## How to Run the Application

```bash
cd app
npm install
npm start
```

App is available at **http://localhost:3000**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@cloudya.com` | `Test1234!` |
| User | `user@cloudya.com` | `Welcome1!` |

---

## How to Run the Tests

### First-time setup

```bash
cd app
npm install
npx playwright install
```

### Run everything

```bash
cd app
npm test
```

Playwright starts the server automatically via `webServer` in `playwright.config.js` and runs all tests in `tests/cloudya.spec.js`.

### Targeted runs

```bash
# By area
npx playwright test --grep "UI"
npx playwright test --grep "API"
npx playwright test --grep "Mobile"

# Bug-documenting tests only
npx playwright test --grep "\[BUG"

# Open the interactive HTML report after a run
npx playwright show-report
```

---

## Testing Strategy

### Why Playwright for everything?

Playwright handles UI automation, API calls, and device emulation in one consistent framework and language (JavaScript). Using a single tool removes context-switching overhead and keeps CI configuration simple.

### Bug-documentation tests (`test.fail()`)

Tests prefixed with `[BUG-XX]` use Playwright's `test.fail()` annotation. This means:

- **While the bug exists:** the test is marked `expected failure` — the suite is green.
- **After the bug is fixed:** the test flips to `unexpected pass` — the suite turns red.

This turns bug tests into automatic regression guards without requiring a separate tracking mechanism.

### Trade-offs and prioritisation

| Decision | Reasoning |
|----------|-----------|
| Cover all 5 contacts in the dataset, not just 1 | Ensures edge cases like Unicode names (Müller, Überall, Özil) don't silently break filtering |
| API tests run against `BASE_URL` directly, not through the page | Isolates backend from frontend; failures are unambiguous |
| Mobile tests use raw `browser.newContext({ viewport })` | More portable than device descriptors; works without Playwright's built-in device database |
| Did not automate every permutation | Focus is on highest-risk paths (auth, data access, PII exposure) and demonstrating approach |

---

## Test Suite Structure

```
app/
├── tests/
│   ├── example.spec.js        # Original (kept unchanged)
│   └── cloudya.spec.js        # Full test suite
├── public/index.html          # Frontend 
├── server.js                  # Express backend
├── playwright.config.js
└── package.json
```

### Test breakdown

| Group | Tests | What is covered |
|-------|-------|-----------------|
| UI – Login | 9 | Page load, both users, invalid creds, empty fields, logout, BUG-01, BUG-06 |
| UI – Contact Search | 8 | All contacts, name/email/dept search, no-results, Enter key, card details, BUG-05 |
| Mobile – Responsiveness | 4 | iPhone 13 render, iPhone 13 E2E, Pixel 5 search, BUG-07 (320px overflow) |
| API – Login | 8 | Valid ×2, wrong password, unknown email, missing fields ×2, BUG-02, BUG-03 |
| API – Contacts | 8 | All contacts, search ×3, by ID, 404, invalid token, BUG-04, BUG-05 |
| API – Logout | 1 | Token invalidation verified by subsequent 401 |
| **Total** | **38** | |

---

## Tools Used

| Tool | Purpose |
|------|---------|
| [Playwright](https://playwright.dev) v1.40 | UI automation, API testing, device emulation |
| Node.js / Express | Application runtime (provided) |
| Browser DevTools | Manual API inspection, session/localStorage analysis |

---

## Assumptions

1. App runs on `localhost:3000`; all tests target this address.
2. Test data (users, contacts) is static and defined in `server.js` — tests rely on those exact values.
3. Sessions are in-memory: each test suite re-authenticates as needed rather than sharing tokens across runs.
4. `[BUG]` tests are intentionally marked with `test.fail()` — they pass while the bug is open and would surface as failures once the bug is resolved.
5. No external services, databases, or environment variables are required.
