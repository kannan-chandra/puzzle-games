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
    await expect(archiveRoot).toContainText('#1 · "Fixture Puzzle One" · Jan 1, 2030');
    await expect(archiveRoot).toContainText('#2 · "Fixture Puzzle Two" · Jan 2, 2030');

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
    await expect(title).toContainText('Fixture Puzzle Two');
    await expect(page.locator('#puzzle-date-latest')).toContainText('#2 · Jan 2, 2030');

    const quoteBlock = page.locator('#puzzle-content-latest blockquote.rt-quote');
    await expect(quoteBlock).toHaveCount(1);
    await expect(page.locator('#puzzle-content-latest blockquote.rt-quote h1')).toHaveText('Witness Note');
    await expect(quoteBlock).toContainText('This clue should appear inside a quote block.');
    await expect(puzzleContent).toContainText('This line should appear outside the quote.');

    const codeBlock = page.locator('#puzzle-content-latest pre.rt-code-block code');
    await expect(codeBlock).toHaveCount(1);
    await expect(codeBlock).toContainText('for i in range(3):');
    await expect(codeBlock).toContainText('print("**literal** <tag>")');
    await expect(page.locator('#puzzle-content-latest pre.rt-code-block strong')).toHaveCount(0);
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
    await expect(title).toContainText('Fixture Puzzle Three');
    await expect(page.locator('#puzzle-date-latest')).toContainText('#3 · Jan 3, 2030');

    await context.close();
  });
});
