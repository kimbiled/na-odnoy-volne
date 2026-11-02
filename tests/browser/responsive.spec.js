import { test, expect } from '@playwright/test'
import { calmSequence } from '../../src/game.js'

const sizes = [[320, 568], [320, 740], [360, 740], [375, 667], [390, 844], [430, 932], [768, 1024], [844, 390], [932, 430]]

for (const [width, height] of sizes) {
  test(`invitation and game stay readable and reachable at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    for (const selector of ['.vinyl', '.art-ticket']) {
      const rect = await page.locator(selector).boundingBox()
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(width)
    }
    const primary = page.getByRole('button', { name: 'У меня для тебя сюрприз' })
    if (width <= 700) {
      expect(await page.locator('.hero-description').evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(13)
      const button = await primary.boundingBox()
      expect(button.height).toBeGreaterThanOrEqual(44)
      expect(button.y + button.height).toBeLessThanOrEqual(height)
    }
    await primary.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.getByRole('button', { name: 'Без спешки', exact: true }).click()
    const start = page.getByRole('button', { name: 'Начать мелодию', exact: true })
    if (width <= 700) {
      const startRect = await start.boundingBox()
      expect(startRect.y + startRect.height).toBeLessThanOrEqual(height)
    }
    await start.click()
    const dialogSize = await dialog.evaluate(e => ({ width: e.clientWidth, contentWidth: e.scrollWidth, height: e.clientHeight, contentHeight: e.scrollHeight }))
    expect(dialogSize.contentWidth).toBeLessThanOrEqual(dialogSize.width)
    expect(dialogSize.contentHeight).toBeLessThanOrEqual(dialogSize.height + 1)
    for (const pad of await page.locator('.game-pad').all()) {
      const rect = await pad.boundingBox()
      expect(rect.height).toBeGreaterThanOrEqual(44)
      expect(rect.y).toBeGreaterThanOrEqual(0)
      expect(rect.y + rect.height).toBeLessThanOrEqual(height)
    }
    if (width === 320 || width === 844) await page.screenshot({ path: `test-results/responsive-${width}-${height}-game.png` })
    for (const lane of calmSequence) await page.getByRole('button', { name: ['Нота до', 'Нота ми', 'Нота соль'][lane], exact: true }).click()
    await page.getByRole('button', { name: 'Посмотреть приглашение' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByText('Best of NE PROSTO POP', { exact: false })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    if (width === 320 || width === 430) {
      await page.locator('.concert-ticket').scrollIntoViewIfNeeded()
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      await page.screenshot({ path: `test-results/responsive-${width}-${height}-ticket.png` })
    }
  })
}
