/**
 * Page Object for the Contacts screen.
 * Owns all selectors and interactions for contact search and display.
 */
class ContactsPage {
  constructor(page) {
    this.page = page;

    // Locators
    this.appPage = page.locator('#appPage');
    this.userInfo = page.locator('#userInfo');
    this.searchInput = page.locator('#searchInput');
    this.searchBtn = page.locator('#searchBtn');
    this.contactCards = page.locator('.contact-card');
    this.noResults = page.locator('#noResults');
    this.logoutBtn = page.locator('.btn-logout');
  }

  async search(query) {
    await this.searchInput.fill(query);
    await this.searchBtn.click();
  }

  async searchByEnter(query) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  async logout() {
    await this.logoutBtn.click();
  }

  getCard(index = 0) {
    return this.contactCards.nth(index);
  }

  async getLocalStorageToken() {
    return this.page.evaluate(() => localStorage.getItem('token'));
  }

  async getSearchInputBoundingBox() {
    return this.searchInput.boundingBox();
  }
}

export { ContactsPage };
