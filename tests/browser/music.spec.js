import { test, expect } from '@playwright/test'
import { calmSequence } from '../../src/game.js'

test('like JENNIE plays, pauses, resumes, mutes and stops on win and close', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudio = window.Audio
    window.Audio = function (...args) {
      const audio = new NativeAudio(...args)
      window.__gameAudio = audio
      return audio
    }
    window.Audio.prototype = NativeAudio.prototype
  })
  await page.goto('/')
  await expect(page).toHaveTitle('На одной волне · Нурсултан и солнце')
  await page.getByRole('button', { name: 'У меня для тебя сюрприз' }).click()
  await expect(page.getByRole('link', { name: 'like JENNIE — слушать в Apple Music' })).toBeVisible()
  expect(await page.evaluate(() => window.__gameAudio.paused)).toBe(true)
  await page.getByRole('button', { name: 'Без спешки', exact: true }).click()
  await page.getByRole('button', { name: 'Начать мелодию', exact: true }).click()
  // Decode and play the actual external AAC preview, not a mocked play() promise.
  await expect.poll(() => page.evaluate(() => window.__gameAudio.currentTime), { timeout: 15000 }).toBeGreaterThan(.15)
  expect(await page.evaluate(() => window.__gameAudio.duration)).toBeGreaterThan(13)
  await page.getByRole('button', { name: 'Пауза', exact: true }).click()
  expect(await page.evaluate(() => window.__gameAudio.paused)).toBe(true)
  const pausedTime = await page.evaluate(() => window.__gameAudio.currentTime)
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__gameAudio.currentTime)).toBeGreaterThan(pausedTime)
  await page.getByRole('button', { name: 'Выключить звук игры', exact: true }).click()
  expect(await page.evaluate(() => window.__gameAudio.paused)).toBe(true)
  await page.getByRole('button', { name: 'Включить звук игры', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__gameAudio.paused)).toBe(false)
  for (const lane of calmSequence) await page.getByRole('button', { name: ['Нота до', 'Нота ми', 'Нота соль'][lane], exact: true }).click()
  await expect(page.getByTestId('game-won')).toBeVisible()
  expect(await page.evaluate(() => window.__gameAudio.paused)).toBe(true)
  await page.getByRole('button', { name: 'Посмотреть приглашение' }).click()
  await expect(page.getByText('ДЛЯ СОЛНЦА', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.__gameAudio.paused)).toBe(true)
  expect(await page.evaluate(() => window.__gameAudio.getAttribute('src'))).toBe(null)
})

test('a failed song download does not block the game or invitation', async ({ page }) => {
  await page.route('https://audio-ssl.itunes.apple.com/**', route => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'У меня для тебя сюрприз' }).click()
  await expect(page.getByText('Музыка недоступна · играем дальше')).toBeVisible()
  await page.getByRole('button', { name: 'Без спешки', exact: true }).click()
  await page.getByRole('button', { name: 'Начать мелодию', exact: true }).click()
  for (const lane of calmSequence) await page.getByRole('button', { name: ['Нота до', 'Нота ми', 'Нота соль'][lane], exact: true }).click()
  await expect(page.getByTestId('game-won')).toBeVisible()
})
