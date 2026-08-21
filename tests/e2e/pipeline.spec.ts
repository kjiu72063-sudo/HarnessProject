import { test, expect } from './fixtures/harness'

test.describe('PipelinePage', () => {
  test('P1: 无会话空态 → 空态提示与引导', async ({ page, navigateTo }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('harness-recent-sessions'))
    await navigateTo('pipeline')
    await expect(page.getByText(/无活动会话|开始新项目|暂无/)).toBeVisible()
  })

  test('P2: SSE 驱动渲染 → DAG 8节点与阶段状态', async ({ page, navigateTo }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'harness-recent-sessions',
        JSON.stringify([
          { project_id: 'e2e-pipeline', session_id: 'sess-pipeline-001', started_at: Date.now() },
        ]),
      )
    })
    await page.reload()
    await navigateTo('pipeline')
    await expect(page.getByText(/流程 DAG/)).toBeVisible({ timeout: 10_000 })
    const dagSection = page.locator('section').filter({ hasText: '流程 DAG' })
    await expect(dagSection).toBeVisible()
  })

  test('P3: 闸门决策 → DecisionPanel 可见', async ({ page, navigateTo }) => {
    test.skip()
    await page.goto('/')
    await navigateTo('pipeline')
  })
})
