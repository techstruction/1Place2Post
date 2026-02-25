import { test, expect } from '@playwright/test';

test.describe('1Place2Post - Create Once, Post Everywhere', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the login page and authenticate a test user
        // This assumes your test environment uses a mocked auth provider or dedicated test credentials
        await page.goto('/login');
        await page.fill('input[name="email"]', 'admin@test.local');
        await page.fill('input[name="password"]', 'Test1234!');
        await page.click('button[type="submit"]');

        // Wait for dashboard to load
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('h1:has-text("Unified Inbox")')).toBeVisible();
    });

    test('Should open the compose modal, customize per platform, and schedule the post', async ({ page }) => {
        // 1. Open the "Create Post" modal
        await page.click('button:has-text("Create Post")');
        const composeModal = page.locator('[role="dialog"][aria-label="Compose Post"]');
        await expect(composeModal).toBeVisible();

        // 2. Select predefined Test Social Accounts (e.g. LinkedIn, Instagram)
        await page.click('button:has-text("Select Accounts")');
        await page.check('input#account-linkedin-test');
        await page.check('input#account-instagram-test');

        // 3. Enter the base content
        const baseEditor = page.locator('textarea[name="baseContent"]');
        await baseEditor.fill('This is a test post from the 1Place2Post automated testing suite! 🚀 #automation');

        // 4. Attach Media from Library
        await page.click('button[aria-label="Open Media Library"]');
        // Select the first valid image asset in the test user's library
        await page.click('.media-grid .media-item:first-child');
        await page.click('button:has-text("Attach to Post")');

        // 5. Customize the LinkedIn Variant (simulate "Create Once, Customize per platform")
        await page.click('button[aria-label="Edit LinkedIn Variant"]');
        const lgEditor = page.locator('textarea[name="linkedinContent"]');
        await lgEditor.fill('This is a test post from the 1Place2Post automated testing suite! This version is exclusively customized for our professional network. 🚀 #automation #b2b');

        // 6. Schedule for the future
        await page.click('button:has-text("Schedule Options")');
        await page.click('button:has-text("Schedule for Later")');

        // Select a date one day in the future (this would use a specific date picker implementation)
        // For simplicity, we just type into the date input
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const dateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD
        await page.fill('input[name="scheduleDate"]', dateString);
        await page.fill('input[name="scheduleTime"]', '12:00');

        // 7. Click Schedule / Publish
        await page.click('button[type="submit"]:has-text("Schedule Post")');

        // 8. Assertions: Modal closes and Success Toast appears
        await expect(composeModal).not.toBeVisible();
        await expect(page.locator('.toast:has-text("Post scheduled successfully")')).toBeVisible();

        // 9. Verify in the Visual Calendar
        await page.goto('/calendar');

        // Ensure the calendar displays the scheduled post on the correct day
        // This looks for a calendar block corresponding to the futureDate and checks if our post snippet is inside it
        const calendarCell = page.locator(`[data-date="${dateString}"]`);
        await expect(calendarCell).toContainText('This is a test post from the 1Place2Post');

        // Ensure both platform icons (LinkedIn, Instagram) are visible on the calendar event
        const eventCard = calendarCell.locator('.scheduled-event-card').first();
        await expect(eventCard.locator('svg[aria-label="LinkedIn icon"]')).toBeVisible();
        await expect(eventCard.locator('svg[aria-label="Instagram icon"]')).toBeVisible();
    });
});
