import { test, expect } from './fixtures/harness'

test.describe('ArtifactsPage', () => {
  test('A1: 无会话空态 → "无活动会话"提示', async ({ page, navigateTo }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('harness_recent_sessions'))
    await navigateTo('artifacts')
    const main = page.locator('main')
    await expect(main.getByText('无活动会话')).toBeVisible()
  })

  test('A2: 文件树渲染 → FileTree + 统计卡', async ({ page, navigateTo }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'harness_recent_sessions',
        JSON.stringify([
          { project_id: 'e2e-artifacts', session_id: 'sess-artifacts-001', started_at: Date.now() },
        ]),
      )
    })
    await page.reload()
    await navigateTo('artifacts')
    await expect(page.getByRole('heading', { name: '产物管理' })).toBeVisible()
    const main = page.locator('main')
    await expect(main.getByText('产物文件树')).toBeVisible({ timeout: 5_000 })
  })

  test('A3: 闸门详情 → verify_result 渲染 14 项', async ({ page, navigateTo }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'harness_recent_sessions',
        JSON.stringify([
          { project_id: 'e2e-gates', session_id: 'sess-gates-001', started_at: Date.now() },
        ]),
      )
    })
    await page.reload()
    await navigateTo('artifacts')
    await expect(page.getByRole('heading', { name: '闸门详情' })).toBeVisible()
    const main = page.locator('main')
    await expect(main.getByText('14 项')).toBeVisible({ timeout: 5_000 })
  })
})
