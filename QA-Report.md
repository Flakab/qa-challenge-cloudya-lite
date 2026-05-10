# QA Report — Cloudya Lite

**App:** Cloudya Lite — http://localhost:3000  
**Scope:** Login · Contact Search · API/Backend · Mobile Responsiveness

---

## Bug Summary

| ID | Title | Severity | Area |
|----|-------|----------|------|
| BUG-01 | Password field uses `type="text"` — input is visible | **High** | UI / Login |
| BUG-02 | Login API returns HTTP 200 for failed authentication | **Medium** | API / Auth |
| BUG-03 | Login response exposes user password in plain text | **Critical** | API / Security |
| BUG-04 | Contacts API bypasses auth when no token is provided | **Critical** | API / Security |
| BUG-05 | Contact search is case-sensitive | **Medium** | API + UI / Search |
| BUG-06 | `localStorage` not cleared on logout — stale token survives reload | **Medium** | UI / Session |
| BUG-07 | Search input overflows viewport on 320 px screens | **Low** | UI / Mobile |

Severity scale: **Critical** (data breach / security) · **High** (core feature broken) · **Medium** (degraded UX or incorrect behaviour) · **Low** 

---

## BUG-01 — Password field is `type="text"` (characters are visible)

**Severity:** High  
**Area:** UI / Login

### Steps to Reproduce
1. Open http://localhost:3000
2. Click the **Password** field and type any text.

### Expected Result
Characters are masked (shown as `•••`). Standard browser behaviour for `<input type="password">`.

### Actual Result
Characters are displayed in plain text. Anyone glancing at the screen — a colleague, a person nearby, a screen recording — can read the password.

---

## BUG-02 — Login API returns HTTP 200 for authentication failure

**Severity:** Medium  
**Area:** API / Auth

### Steps to Reproduce
1. Open http://localhost:3000 in a browser.
2. Enter a valid email address: `admin@cloudya.com`
3. Enter an **incorrect** password: `WrongPassword`
4. Click **Sign In**.
5. Open **DevTools** → **Network** tab → click the `login` request.
6. Check the **Status** column and the **Response** payload.

### Expected Result
- The network request returns **HTTP 401 Unauthorized**.
- The UI shows the "Invalid credentials" error message.

### Actual Result
- The network request returns **HTTP 200 OK** — even though login failed.
- The response body contains `{"success": false, "message": "Invalid credentials"}`.
- The UI correctly shows the error, but the HTTP status is misleading.

### Impact
The UI behaves correctly for the end user, so the bug is invisible in normal use. However, any system that relies on HTTP status codes — monitoring dashboards, API gateways, automated health checks, or client libraries using `response.ok` — will treat a failed login as a success. This makes failures harder to detect and audit in production.

---

## BUG-03 — Login response includes user password in plain text 

**Severity:** Critical  
**Area:** API / Security

### Steps to Reproduce
1. Open http://localhost:3000 in a browser.
2. Enter valid credentials: `admin@cloudya.com` / `Test1234!`
3. Click **Sign In**.
4. Open **DevTools** → **Network** tab → click the `login` request → open the **Response** tab.
5. Inspect the JSON body returned by the server.

### Expected Result
The response contains a `token` and `user.email`. The password is **never** included in any API response.

### Actual Result
The response body contains the user's password in plain text:
```json
{
  "success": true,
  "token": "tok_...",
  "user": {
    "email": "admin@cloudya.com",
    "password": "Test1234!"
  }
}
```
This is visible to anyone who opens DevTools — no special tools required.

### Impact
Every successful login exposes the user's password in the browser's network log, any HTTP proxy, CDN access log, SIEM, or browser extension that inspects traffic. A developer sharing a HAR file for debugging would unknowingly share all active user passwords. This is a direct violation of OWASP API Security Top 10 (API3: Excessive Data Exposure).

---

## BUG-04 — Contacts API accessible without any authentication token ⚠️ Critical

**Severity:** Critical  
**Area:** API / Security

### Steps to Reproduce
1. Open http://localhost:3000 in a browser — do **not** log in.
2. Open **DevTools** → **Console** tab.
3. Paste and run the following:
```js
fetch('/api/contacts').then(r => r.json()).then(console.log)
```
4. Observe the response in the console.

### Expected Result
The server returns **HTTP 401 Unauthorized** and no contact data is returned.

### Actual Result
The server returns **HTTP 200 OK** with the full contacts list — no login required:
```json
[
  { "id": 1, "name": "Anna Schmidt", "email": "anna.schmidt@nfon.com", ... },
  ...
]
```

### Impact
Any visitor to the page — or anyone who knows the API URL — can retrieve the entire contacts directory without logging in. Logging out provides no protection because the data endpoint itself enforces no authentication. This completely defeats the purpose of the login screen.

---

## BUG-05 — Contact search is case-sensitive

**Severity:** Medium  
**Area:** UI + API / Contact Search

### Steps to Reproduce
1. Log in with any valid credentials.
2. In the search box, type `support` (all lowercase) and click **Search**.

### Expected Result
Lisa Weber (department: "Support") is returned — search should be case-insensitive.

### Actual Result
"No contacts found." — the department value `"Support"` does not match the query `"support"`.

> **Note:** Searching `anna` in the UI happens to return Anna Schmidt because the email `anna.schmidt@nfon.com` is fully lowercase — this can mask the bug. The issue is consistently reproduced with department and capitalised name queries.

---

## BUG-06 — localStorage token not cleared on logout

**Severity:** Medium  
**Area:** UI / Session Management

### Steps to Reproduce
1. Log in as admin.
2. Click **Logout** — login page appears.
3. Press **F5** (page refresh).

### Expected Result
Login page is shown — the session has ended.

### Actual Result
The app auto-restores the session from `localStorage` and shows the contacts page. However, the server has already deleted the token, so contacts fail to load silently. The UI shows "logged in" state with a broken data layer.

---

## BUG-07 — Search input overflows viewport on screens ≤ 320 px

**Severity:** Low  
**Area:** UI / Mobile Responsiveness

### Steps to Reproduce
1. Log in and open browser DevTools (F12).
2. Switch to **Responsive** mode and set width to **320 px** (iPhone SE 1st gen).
3. Observe the search section.

### Expected Result
Search input and button fit within the screen width.

### Actual Result
The input extends to ~330 px (10 px beyond the right edge of the viewport), causing a horizontal scrollbar. The Search button may be partially hidden.

---

## Additional Observations (Non-Bug)

| # | Observation | Risk |
|---|-------------|------|
| OBS-01 | No rate limiting on the login endpoint | Brute-force password attacks trivially succeed |
| OBS-02 | Sessions are in-memory only | Server restart silently logs out all users |
| OBS-03 | No Enter key support on the login form | UX inconsistency (search supports Enter, login does not) |
| OBS-04 | No loading indicator during API calls | Users may double-click buttons or be confused on slow connections |

