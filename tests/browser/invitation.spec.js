import { test, expect } from '@playwright/test'
import { GAME_DURATION, REQUIRED_HITS, calmSequence, createNotes } from '../../src/game.js'
import { installMediaClock } from './helpers/mediaClock.js'

const laneLabels = ['Нота до', 'Нота ми', 'Нота соль']

test('mobile layout, story modal, accessible close, and interactive record', async ({ page }, testInfo) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('волне.')
  await expect(page.getByText('СОЛНЦЕ, ЭТОТ СЮРПРИЗ ДЛЯ ТЕБЯ')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Покрутить пластинку' }).click()
  await expect(page.locator('.vinyl')).toHaveClass(/is-spinning/)
  expect(await page.locator('.hero').evaluate(element => element.scrollLeft)).toBe(0)
  expect((await page.getByRole('heading', { level: 1 }).boundingBox()).x).toBeGreaterThanOrEqual(18)
  await page.getByRole('button', { name: 'Смотреть первое видео: как всё началось' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const video = page.locator('video')
  await expect(video).toBeVisible()
  await expect(video.locator('source')).toHaveAttribute('src', '/videos/our-story.mp4')
  await expect.poll(() => video.evaluate(e => e.readyState)).toBeGreaterThan(0)
  expect(await video.evaluate(e => e.duration)).toBeGreaterThan(80)
  await video.evaluate(e => e.play())
  await expect.poll(() => video.evaluate(e => e.currentTime)).toBeGreaterThan(.1)
  const videoHandle = await video.elementHandle()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await videoHandle.evaluate(e => e.paused)).toBe(true)
  await page.evaluate(() => document.activeElement?.blur())
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `test-results/${testInfo.project.name}-home.png`, fullPage: true })
  expect(errors).toEqual([])
})

test('calm game unlocks the event, calendar and ticket downloads, RSVP persists', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'У меня для тебя сюрприз' }).click()
  await page.getByRole('button', { name: 'Без спешки', exact: true }).click()
  await page.getByRole('button', { name: 'Начать мелодию', exact: true }).click()
  // Wrong notes do not advance or punish the player.
  await page.getByRole('button', { name: laneLabels[2], exact: true }).click()
  await expect(page.getByText('Попробуй подсвеченную ноту ♡')).toBeVisible()
  for (const lane of calmSequence) await page.getByRole('button', { name: laneLabels[lane], exact: true }).click()
  await expect(page.getByTestId('game-won')).toBeVisible()
  await page.getByRole('button', { name: 'Посмотреть приглашение' }).click()
  await expect(page.getByRole('heading', { name: 'Пойдём на концерт?' })).toBeVisible()
  await expect(page.getByText('Best of NE PROSTO POP', { exact: false })).toBeVisible()
  await expect(page.getByText('QAZAQCONCERT, Астана', { exact: false })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Маршрут' })).toHaveAttribute('href', /QAZAQCONCERT/)
  // Make downloads deterministic instead of opening the operating system share sheet.
  await page.evaluate(() => { Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }) })
  const ticketDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Сохранить приглашение' }).click()
  expect((await ticketDownload).suggestedFilename()).toBe('na-odnoy-volne.svg')
  const calendarDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'В календарь' }).click()
  const calendar = await calendarDownload
  expect(calendar.suggestedFilename()).toBe('nash-vecher-8-november.ics')
  const content = await (await calendar.createReadStream()).toArray()
  expect(Buffer.concat(content).toString()).toContain('DTSTART:20261108T140000Z')
  await page.getByRole('button', { name: 'Да, я иду с тобой' }).click()
  await expect(page.getByText('Значит, это свидание ♡')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Значит, это свидание ♡')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Твоё приглашение' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `test-results/${testInfo.project.name}-unlocked.png`, fullPage: true })
})

test('rhythm mode scores timed touches, pauses, and unlocks', async ({ page }) => {
  await installMediaClock(page)
  await page.clock.install({ time: new Date('2026-11-03T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-03T00:01:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: 'У меня для тебя сюрприз' }).click()
  await page.getByRole('button', { name: 'Давай сыграем' }).click()
  await page.clock.runFor(500)
  await page.getByRole('button', { name: 'Пауза', exact: true }).click()
  await expect(page.getByText('Маленькая пауза')).toBeVisible()
  await page.clock.runFor(5000)
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  // The chart clock resumes from 500ms: wall time on pause must not consume notes.
  const notes = createNotes()
  let time = 500
  for (const note of notes.slice(0, REQUIRED_HITS)) {
    const target = Math.round(note.at)
    await page.clock.runFor(target - time)
    await page.getByRole('button', { name: laneLabels[note.lane], exact: true }).click()
    time = target
    if (note.id === REQUIRED_HITS - 2) await expect(page.getByTestId('game-won')).toHaveCount(0)
  }
  await expect(page.getByTestId('game-won')).toBeVisible()
})

test('missed rhythm chart offers a retry and the untimed mode', async ({ page }) => {
  await installMediaClock(page)
  await page.clock.install({ time: new Date('2026-11-03T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-03T00:01:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: 'У меня для тебя сюрприз' }).click()
  await page.getByRole('button', { name: 'Давай сыграем' }).click()
  await page.clock.runFor(GAME_DURATION + 1000)
  await expect(page.getByText('Продолжим', { exact: false }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Хочу без спешки' }).click()
  await expect(page.getByRole('button', { name: 'Начать мелодию', exact: true })).toBeVisible()
})

test('notes follow audio time and freeze during buffering instead of drifting with wall time', async ({ page }) => {
  await installMediaClock(page)
  await page.clock.install({ time: new Date('2026-11-03T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-03T00:01:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: 'У меня для тебя сюрприз' }).click()
  await page.getByRole('button', { name: 'Давай сыграем' }).click()
  await page.evaluate(() => window.__gameAudio.pause())
  await page.clock.runFor(5000)
  await expect(page.getByText('0 / 50', { exact: false })).toBeVisible()
  const first = createNotes()[0]
  await page.evaluate(at => { window.__gameAudio.currentTime = at / 1000 }, first.at)
  await page.clock.runFor(16)
  await page.getByRole('button', { name: laneLabels[first.lane], exact: true }).click()
  await expect(page.getByText('1 / 50', { exact: false })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('one-wave-invitation-v2')).score)).toBe(1)
})
