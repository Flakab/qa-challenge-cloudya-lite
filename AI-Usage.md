# AI Usage Note

## Tools Used

- **GitHub Copilot / Cursor** — used selectively during test authoring

---

## How AI Assisted

AI was used in two specific moments:

**Test structure** — generating the initial `describe` / `test` skeleton and the `getToken` helper function. This saved time on setup so focus could stay on coverage decisions and what to actually test.

**Report structure** — suggesting a markdown template for the bug report format. All bug descriptions, severity ratings, steps to reproduce, and impact statements were written based on direct findings from manual testing and code inspection.

---

## What Was Done Manually

- Explored the app by hand — login flow, contact search, logout behaviour
- Opened DevTools Network tab to inspect API requests and responses
- Identified all bugs through direct observation, not AI suggestions
- Verified every automated test assertion against live browser or API behaviour before committing
- Designed the test strategy, coverage scope, and Page Object structure independently

---

## Example of Correcting AI Output

When generating the test for BUG-04, AI wrote a standard passing assertion expecting a 401 response. Since the bug means the server currently returns 200, that test would fail on every run and block the suite. I corrected it by applying `test.fail()`, turning it into a regression guard that passes while the bug is open and alerts the team the moment it is fixed.

---

## Summary

AI helped with speed on structure. All testing decisions, bug findings, and quality judgements were made independently.
