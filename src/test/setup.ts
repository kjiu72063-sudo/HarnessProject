import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

class DOMMatrixReadOnlyStub {
  readonly m22: number

  constructor(transform?: string) {
    const scale = transform?.match(/scale\(([\d.]+)\)/)?.[1]
    this.m22 = scale !== undefined ? Number(scale) : 1
  }
}

// 直接赋值而非 vi.stubGlobal，避免测试内 unstubAllGlobals 移除 @xyflow/react 依赖的桩
globalThis.ResizeObserver = globalThis.ResizeObserver ?? ResizeObserverStub
globalThis.DOMMatrixReadOnly = globalThis.DOMMatrixReadOnly ?? (DOMMatrixReadOnlyStub as never)

Element.prototype.scrollTo = () => undefined
