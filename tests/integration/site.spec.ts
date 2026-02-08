import { test, expect } from '@playwright/test';

function addFixedDate(page, isoString) {
  const fixed = new Date(isoString).getTime();
  return page.addInitScript(`{
    const fixedTime = ${fixed};
    const OriginalDate = Date;
    class MockDate extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) {
          return new OriginalDate(fixedTime);
        }
        return new OriginalDate(...args);
      }
      static now() {
        return fixedTime;
      }
    }
    MockDate.UTC = OriginalDate.UTC;
    MockDate.parse = OriginalDate.parse;
    MockDate.prototype = OriginalDate.prototype;
    // eslint-disable-next-line no-global-assign
    Date = MockDate;
  }`);
}

test.describe('puzzle site integration', () => {
  test('archive shows past puzzles and excludes future/drafts', async ({ page }) => {
    await addFixedDate(page, '2030-01-02T15:00:00Z');
    await page.goto('archive');

    const archiveRoot = page.locator('#archive-root');
    await expect(archiveRoot).toBeVisible();
    await expect(archiveRoot).toContainText('2030-01-01');
    await expect(archiveRoot).toContainText('2030-01-02');

    await expect(archiveRoot).not.toContainText('2030-01-03');
    await expect(archiveRoot).not.toContainText('Fixture Draft Puzzle');
    await expect(archiveRoot).not.toContainText('DRAFT');
  });

  test('home loads the latest available puzzle in place', async ({ page }) => {
    await addFixedDate(page, '2030-01-02T15:00:00Z');
    await page.goto('');

    const puzzleContent = page.locator('#puzzle-content-latest');
    await expect(puzzleContent).toBeVisible();
    await expect(puzzleContent).toContainText('latest available fixture puzzle');

    const title = page.locator('#puzzle-title-latest');
    await expect(title).toContainText('Puzzle for 2030-01-02');
  });

  test('future puzzle page redirects to home', async ({ page }) => {
    await addFixedDate(page, '2030-01-02T15:00:00Z');
    await page.goto('p/2030-01-03/');
    await page.waitForURL(/\/puzzle-games\/$/);
    await expect(page.locator('#puzzle-content-latest')).toBeVisible();
  });

  test('future puzzle becomes available when date advances without rebuild', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await addFixedDate(page, '2030-01-03T15:00:00Z');
    await page.goto('');

    const puzzleContent = page.locator('#puzzle-content-latest');
    await expect(puzzleContent).toBeVisible();
    await expect(puzzleContent).toContainText('future fixture puzzle');

    const title = page.locator('#puzzle-title-latest');
    await expect(title).toContainText('Puzzle for 2030-01-03');

    await context.close();
  });
});
