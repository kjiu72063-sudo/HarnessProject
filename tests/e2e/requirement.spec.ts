import { test, expect } from './fixtures/harness'

test.describe('RequirementPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('R1: 完整提交流程 → 页面转至流程监控', async ({ page }) => {
    await page.fill('input[placeholder="my-app"]', 'e2e-test-project')
    await page.fill('textarea[placeholder*="描述你想构建"]', '构建一个待办事项应用，支持增删改查')
    const submitBtn = page.getByRole('button', { name: /启动 Harness/ })
    await expect(submitBtn).toBeEnabled()
    await submitBtn.click()
    await expect(page.locator('nav >> button[aria-current="page"]')).toHaveText(/流程监控/)
  })

  test('R2: 空提交拦截 → 提交按钮禁用', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /启动 Harness/ })
    await expect(submitBtn).toBeDisabled()
    await page.fill('input[placeholder="my-app"]', 'only-name')
    await expect(submitBtn).toBeDisabled()
    await page.fill('textarea[placeholder*="描述你想构建"]', 'has-requirement')
    await expect(submitBtn).toBeEnabled()
  })

  test('R3: 最近项目列表渲染', async ({ page, navigateTo }) => {
    await page.route('**/api/harness/sessions', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              session_id: 'sess-001',
              status: 'interrupted',
              project_id: 'proj-1',
              current_stage: 'prototype_confirmation',
              requirement_summary: 'build a todo app',
              started_at: Date.now() / 1000,
            },
          ],
          total: 1,
        }),
      }),
    )
    await page.goto('/')
    const main = page.locator('main')
    await expect(main.getByText('近期生成')).toBeVisible()
    await expect(main.getByText('proj-1')).toBeVisible()
  })
})
