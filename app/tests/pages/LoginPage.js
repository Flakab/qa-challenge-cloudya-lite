// @ts-check

/**
 * Page Object for the Login screen.
 * Owns all selectors and interactions related to authentication.
 */
class LoginPage {
  constructor(page) {
    this.page = page;

    // Locators
    this.heading       = page.locator('h1').first();
    this.emailInput    = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.loginBtn      = page.locator('#loginBtn');
    this.errorMessage  = page.locator('#loginError');
    this.loginPage     = page.locator('#loginPage');
    this.appPage       = page.locator('#appPage');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginBtn.click();
  }

  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.loginBtn.click();
  }

  async getPasswordInputType() {
    return this.passwordInput.getAttribute('type');
  }

  async getErrorText() {
    return this.errorMessage.textContent();
  }
}

export { LoginPage };
