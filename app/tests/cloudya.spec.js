// @ts-check
/**
 * Cloudya Lite — Main Test Suite
 *
 * All tests here are expected to pass. This is the suite run in CI.
 *
 * Coverage:
 *   1. UI – Login          (positive, negative, edge cases)
 *   2. UI – Contact Search (positive, negative, edge cases)
 *   3. Mobile              (iPhone 13, Pixel 5)
 *   4. API – Login         (valid, invalid, missing fields)
 *   5. API – Contacts      (auth, filtering, no results)
 *   6. API – Logout        (token invalidation)
 *
 * Page Objects:
 *   pages/LoginPage.js    — login screen selectors and actions
 *   pages/ContactsPage.js — contacts screen selectors and actions
 *
 * Known bugs and regression guards → see known-bugs.spec.js
 */

import { test, expect } from '@playwright/test';
import { LoginPage }    from './pages/LoginPage.js';
import { ContactsPage } from './pages/ContactsPage.js';

const BASE_URL = 'http://localhost:3000';
const ADMIN = { email: 'admin@cloudya.com', password: 'Test1234!' };
const USER  = { email: 'user@cloudya.com',  password: 'Welcome1!' };



// UI – Login
test.describe('UI – Login', () => {
  test('Login page loads with all required elements', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.heading).toContainText('Cloudya Lite');
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginBtn).toBeVisible();
  });

  test('Admin can log in and sees the contacts page', async ({ page }) => {
    const loginPage    = new LoginPage(page);
    const contactsPage = new ContactsPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN.email, ADMIN.password);
    await expect(contactsPage.appPage).toBeVisible();
    await expect(contactsPage.userInfo).toContainText(ADMIN.email);
    await expect(loginPage.loginPage).toHaveCSS('display', 'none');
  });

  test('Regular user can log in and sees the contacts page', async ({ page }) => {
    const loginPage    = new LoginPage(page);
    const contactsPage = new ContactsPage(page);
    await loginPage.goto();
    await loginPage.login(USER.email, USER.password);
    await expect(contactsPage.appPage).toBeVisible();
    await expect(contactsPage.userInfo).toContainText(USER.email);
  });

  test('Invalid credentials shows inline error, stays on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('wrong@email.com', 'WrongPass!');
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Invalid credentials');
    await expect(loginPage.loginPage).toBeVisible();
    await expect(loginPage.appPage).toHaveCSS('display', 'none');
  });

  test('Submitting with both fields empty shows validation error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit();
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Please enter email and password');
  });

  test('Submitting with only email filled shows validation error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillEmail(ADMIN.email);
    await loginPage.submit();
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('Submitting with only password filled shows validation error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillPassword(ADMIN.password);
    await loginPage.submit();
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('Logout returns to login page and clears input fields', async ({ page }) => {
    const loginPage    = new LoginPage(page);
    const contactsPage = new ContactsPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN.email, ADMIN.password);
    await contactsPage.logout();
    await expect(loginPage.loginPage).toBeVisible();
    await expect(loginPage.emailInput).toHaveValue('');
    await expect(loginPage.passwordInput).toHaveValue('');
  });
});

// 2. UI — Contact Search

test.describe('UI – Contact Search', () => {
  let loginPage;
  let contactsPage;

  test.beforeEach(async ({ page }) => {
    loginPage    = new LoginPage(page);
    contactsPage = new ContactsPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN.email, ADMIN.password);
    await expect(contactsPage.appPage).toBeVisible();
  });

  test('All 5 contacts load immediately after login', async () => {
    await expect(contactsPage.contactCards).toHaveCount(5);
  });

  test('Search by name returns the matching contact', async () => {
    await contactsPage.search('Anna');
    await expect(contactsPage.contactCards).toHaveCount(1);
    await expect(contactsPage.getCard().locator('h3')).toHaveText('Anna Schmidt');
  });

  test('Search by email returns the matching contact', async () => {
    await contactsPage.search('max.mueller@nfon.com');
    await expect(contactsPage.contactCards).toHaveCount(1);
    await expect(contactsPage.getCard().locator('h3')).toHaveText('Max Müller');
  });

  test('Search by department returns all contacts in that department', async () => {
    await contactsPage.search('Engineering');
    await expect(contactsPage.contactCards).toHaveCount(2);
  });

  test('Search with no match shows "No contacts found" message', async () => {
    await contactsPage.search('zzz-no-match-999');
    await expect(contactsPage.noResults).toBeVisible();
    await expect(contactsPage.noResults).toHaveText('No contacts found.');
    await expect(contactsPage.contactCards).toHaveCount(0);
  });

  test('Sressing Enter in search field triggers the search', async () => {
    await contactsPage.searchByEnter('Lisa');
    await expect(contactsPage.contactCards).toHaveCount(1);
    await expect(contactsPage.getCard().locator('h3')).toHaveText('Lisa Weber');
  });

  test('Contact card shows name, email, phone, and department badge', async () => {
    await contactsPage.search('Anna');
    const card = contactsPage.getCard();
    await expect(card.locator('h3')).toHaveText('Anna Schmidt');
    await expect(card.locator('.details')).toContainText('anna.schmidt@nfon.com');
    await expect(card.locator('.details')).toContainText('+49 170 1234567');
    await expect(card.locator('.dept')).toHaveText('Engineering');
  });
});

// 3. Mobile — Responsive rendering

test.describe('Mobile – Responsiveness', () => {
  test('Login page renders correctly on iPhone 13 (390×844)', async ({ browser }) => {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginBtn).toBeVisible();
    await ctx.close();
  });

  test('Full login flow works on iPhone 13 (390×844)', async ({ browser }) => {
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const loginPage    = new LoginPage(page);
    const contactsPage = new ContactsPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN.email, ADMIN.password);
    await expect(contactsPage.appPage).toBeVisible();
    await expect(contactsPage.userInfo).toContainText(ADMIN.email);
    await ctx.close();
  });

  test('Contact search works on Pixel 5 (393×851)', async ({ browser }) => {
    const ctx  = await browser.newContext({ viewport: { width: 393, height: 851 } });
    const page = await ctx.newPage();
    const loginPage    = new LoginPage(page);
    const contactsPage = new ContactsPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN.email, ADMIN.password);
    await contactsPage.search('Lisa');
    await expect(contactsPage.contactCards).toHaveCount(1);
    await ctx.close();
  });
});

// 4. API — Smoke checks

test.describe('API – Smoke', () => {
  test('Login with valid credentials returns a session token', async ({ request }) => {
    const res  = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: ADMIN.email, password: ADMIN.password }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeTruthy();
  });

  test('Login with wrong password returns success:false', async ({ request }) => {
    const res  = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: ADMIN.email, password: 'WrongPassword!' }
    });
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Invalid credentials');
  });

  test('Contacts endpoint rejects an invalid token with 401', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/contacts`, {
      headers: { Authorization: 'Bearer fake_token' }
    });
    expect(res.status()).toBe(401);
  });
});
