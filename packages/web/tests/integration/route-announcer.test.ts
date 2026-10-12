/** Framework navigation announcements are noise; app live regions remain observable. */

import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';
import { captureTagged } from '../crosscheck/crosscheck.ts';
import { FIXTURE_PAGES } from '../crosscheck/fixtures.ts';

it('omits the Next.js announcer whether empty or populated without hiding app live regions', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const fixture = FIXTURE_PAGES.find((candidate) => candidate.name === 'framework route announcer and app live regions')!;
    await page.setContent(`<title>Acme Notes</title>${fixture.html}`);
    for (const text of ['', 'Acme Notes']) {
      await page.locator('next-route-announcer').evaluate((host, value) => {
        host.shadowRoot!.firstElementChild!.firstChild!.textContent = value;
      }, text);
      const { nodes, elements } = await captureTagged(page);
      try {
        expect(nodes.filter((node) => node.role === 'alert').map((node) => node.testId)).toEqual(['app-alert', 'host-alert', undefined]);
        expect(nodes.filter((node) => node.role === 'status')).toMatchObject([
          { name: 'Acme Notes', testId: 'app-status' }, { name: 'Saved', testId: 'nested-status' },
        ]);
      } finally {
        await Promise.all([...elements.values()].map((element) => element.dispose()));
      }
    }
    // A direct locator still reads the accessible announcer; only observations omit it.
    expect(await page.locator('next-route-announcer').locator('#__next-route-announcer__').innerText()).toContain('Acme Notes');
  } finally {
    await browser.close();
  }
});
