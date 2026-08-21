import { test, expect } from './fixtures/harness'

test.describe('ConstraintsPage', () => {
  test('C1: 规则列表渲染 → rule_type/enabled/enforcer 可见', async ({ page, navigateTo }) => {
    await page.goto('/')
    await navigateTo('constraints')
    await expect(page.getByText('约束配置')).toBeVisible()
    const table = page.locator('table')
    await expect(table).toBeVisible()
    const rows = table.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 5_000 })
  })

  test('C2: 开关切换 → enabled 状态翻转', async ({ page, navigateTo }) => {
    await page.goto('/')
    await navigateTo('constraints')
    const toggle = page.locator('button[role="switch"]').first()
    await expect(toggle).toBeVisible({ timeout: 5_000 })
    const before = await toggle.getAttribute('aria-checked')
    await toggle.click()
    const after = await toggle.getAttribute('aria-checked')
    expect(after).not.toBe(before)
  })

  test('C3: 新增手动规则 → source=manual', async ({ page, navigateTo }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'harness-recent-sessions',
        JSON.stringify([
          { project_id: 'e2e-constraints', session_id: 'sess-constraints-001', started_at: Date.now() },
        ]),
      )
    })
    await page.reload()
    await navigateTo('constraints')
    await page.getByRole('button', { name: /添加自定义规则/ }).click()
    await page.fill('input[placeholder="标题（必填）"]', 'E2E 手动规则')
    await page.getByRole('button', { name: '提交' }).click()
    await expect(page.getByText('manual')).toBeVisible({ timeout: 5_000 })
  })
})
