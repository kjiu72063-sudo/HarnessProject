/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment:
        '❌ 检测到循环依赖\n' +
        '✅ FIX: 提取公共逻辑到独立模块，打破循环\n' +
        '📖 See: docs/architecture/boundaries.md',
      severity: 'error',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'frontend-no-import-backend',
      comment:
        '❌ 前端禁止直接 import 后端代码（server/）\n' +
        '✅ FIX: 通过相对路径 /api/... 调用后端 API\n' +
        '📖 See: docs/architecture/boundaries.md',
      severity: 'error',
      from: {
        path: '^src/',
      },
      to: {
        path: '^server/',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules|dist|\\.venv|__pycache__',
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
    },
    exclude: {
      path: 'node_modules|dist|\\.venv|__pycache__|scripts|harness-journal|docs',
    },
  },
};
