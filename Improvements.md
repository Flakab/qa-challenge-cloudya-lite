# Improvement Suggestions — Cloudya Lite

## 1. Security Improvements

### 1.1 Fix the `type="text"` password field
Change `<input type="text" id="password">` to `<input type="password" id="password">` so password characters are masked.

### 1.2 Never return the password in API responses
Remove `password` from the login response object in `server.js`:
```js
// Before
res.json({ success: true, token, user: { email: user.email, password: user.password } });

// After
res.json({ success: true, token, user: { email: user.email } });
```

### 1.3 Fix the auth middleware to reject unauthenticated requests
```js
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = sessions[token];
  next();
}
```

### 1.4 Return HTTP 401 for failed logins
```js
// Replace
return res.json({ success: false, message: 'Invalid credentials' });
// With
return res.status(401).json({ success: false, message: 'Invalid credentials' });
```

### 1.5 Add rate limiting to the login endpoint
Use a middleware like `express-rate-limit` to prevent brute-force attacks:
```js
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.post('/api/auth/login', loginLimiter, (req, res) => { ... });
```

---

## 2. UX Improvements

### 2.1 Clear localStorage on logout
In `index.html`, add these lines to the `logout()` function:
```js
localStorage.removeItem('token');
localStorage.removeItem('user');
```
Without this, the old (now-invalid) session persists across page refreshes, causing silent API failures.

### 2.2 Add a loading/spinner state
Show a loading indicator while the login request is in flight and while contacts are loading. This prevents users from clicking the button multiple times.

### 2.3 Support pressing Enter to log in
The login form should trigger submission on `Enter`:
```js
document.getElementById('password').addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});
```

### 2.4 Fix mobile overflow on the search bar
Remove or replace the hard-coded `min-width: 300px` on `.search-section input` with a flexible CSS approach:
```css
.search-section input {
  flex: 1;
  min-width: 0; /* allow flex shrinking on small screens */
}
```

---

## 3. Validation Improvements

### 3.1 Validate email format on the login form
Before submitting, check that the email matches a basic email pattern:
```js
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  errorEl.textContent = 'Please enter a valid email address';
  ...
}
```

### 3.2 Make contact search case-insensitive
In `server.js` fix the filter:
```js
const q = search.toLowerCase();
const results = contacts.filter(c =>
  c.name.toLowerCase().includes(q) ||
  c.email.toLowerCase().includes(q) ||
  c.department.toLowerCase().includes(q)
);
```

### 3.3 URL-encode the search query
In `index.html`, use `encodeURIComponent` to handle special characters in search:
```js
const url = query ? `/api/contacts?q=${encodeURIComponent(query)}` : '/api/contacts';
```

---

## 4. Automation / Quality Improvements

### 4.1 Add a CI pipeline
Set up a GitHub Actions or similar workflow to run `npm test` on every push/PR, ensuring regressions are caught automatically.

### 4.2 Add `data-testid` attributes to key elements
Playwright selectors are currently based on IDs and CSS classes that could change. Adding `data-testid="login-btn"` etc. decouples tests from styling.

---

## Optional: What I Would Do With One Additional Day

1. **Expand API test coverage** — test edge cases like extremely long search strings, special characters (SQL injection patterns), concurrent logins, and token expiry.
2. **Add a full E2E smoke suite** — covering the complete user journey: load page → login → search → view contact → logout → verify session is gone.
4. **Set up a GitHub Actions CI pipeline** — so tests run automatically on every commit.
