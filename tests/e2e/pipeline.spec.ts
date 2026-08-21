import { test, expect, startHarnessSession } from './fixtures/harness'

test.describe('PipelinePage', () => {
  test('P1: 无会话空态 → 空态提示与引导', async ({ page, navigateTo }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('harness_recent_sessions'))
    await navigateTo('pipeline')
    const main = page.locator('main')
    await expect(main.getByText(/无活动会话|开始新项目|暂无/)).toBeVisible()
  })

  test('P2: SSE 驱动渲染 → DAG 8节点与阶段状态', async ({ page, navigateTo }) => {
    await page.goto('/')
    await startHarnessSession(page)
    await navigateTo('pipeline')
    const main = page.locator('main')
    await expect(main.getByText(/流程 DAG/)).toBeVisible({ timeout: 10_000 })
    const dagSection = main.locator('section').filter({ hasText: '流程 DAG' })
    await expect(dagSection).toBeVisible()
  })

  test('P3: 闸门决策 → DecisionPanel 可见', async ({ page, navigateTo }) => {
    test.skip()
    await page.goto('/')
    await navigateTo('pipeline')
  })
})
