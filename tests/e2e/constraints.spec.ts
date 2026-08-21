import { test, expect, startHarnessSession } from './fixtures/harness'

test.describe('ConstraintsPage', () => {
  test('C1: 规则列表渲染 → rule_type/enabled/enforcer 可见', async ({ page, navigateTo }) => {
    await page.goto('/')
    await navigateTo('constraints')
    await expect(page.getByRole('heading', { name: '约束配置' })).toBeVisible()
    const main = page.locator('main')
    const table = main.locator('table').first()
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
    await expect(toggle).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true', { timeout: 5_000 })
  })

  test('C3: 新增手动规则 → source=manual', async ({ page, navigateTo }) => {
    await page.goto('/')
    await startHarnessSession(page)
    await navigateTo('constraints')
    const main = page.locator('main')
    await main.getByRole('button', { name: /添加自定义规则/ }).click()
    await page.fill('input[placeholder="标题（必填）"]', 'E2E 手动规则')
    const submitBtn = page.getByRole('button', { name: '提交' })
    await expect(submitBtn).toBeEnabled({ timeout: 5_000 })
    await submitBtn.click()
    await expect(main.getByText('manual').first()).toBeVisible({ timeout: 5_000 })
  })
})
