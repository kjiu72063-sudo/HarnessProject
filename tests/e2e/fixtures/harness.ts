import { test as base, expect } from '@playwright/test'

export { expect }

interface HarnessFixtures {
  navigateTo: (page: 'requirement' | 'pipeline' | 'constraints' | 'artifacts') => Promise<void>
}

const PAGE_LABELS: Record<string, string> = {
  requirement: '需求输入',
  pipeline: '流程监控',
  constraints: '约束配置',
  artifacts: '产物管理',
}

export const test = base.extend<HarnessFixtures>({
  navigateTo: async ({ page }, use) => {
    const navigateTo = async (target: keyof typeof PAGE_LABELS) => {
      await page.click(`nav >> button:has-text("${PAGE_LABELS[target]}")`)
    }
    await use(navigateTo)
  },
})

export async function startHarnessSession(page: import('@playwright/test').Page): Promise<string> {
  await page.fill('input[placeholder="my-app"]', `e2e-project-${Date.now()}`)
  await page.fill('textarea[placeholder*="描述你想构建"]', 'E2E test: 构建一个简单的计数器应用')
  const submitBtn = page.getByRole('button', { name: /启动 Harness/ })
  await submitBtn.click()
  const url = page.url()
  await page.waitForURL(/pipeline/, { timeout: 15_000 }).catch(() => {})
  return url
}
