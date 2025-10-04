import type { Plugin } from 'vite'
import { analyzeBundles, formatBundleReport } from './analyzers/bundle.js'
import { BUDGET_MODE } from './config/budgets.js'
import chalk from 'chalk'

export interface PerfBudgetPluginOptions {
  /** Path to dist directory (default: 'dist') */
  distPath?: string
  /** Budget mode: 'error' | 'warn' | 'off' (default: from env) */
  mode?: 'error' | 'warn' | 'off'
  /** Enable detailed reporting (default: true) */
  verbose?: boolean
}

/**
 * Vite plugin for performance budget enforcement
 */
export function perfBudgetPlugin(options: PerfBudgetPluginOptions = {}): Plugin {
  const {
    distPath = 'dist',
    mode = BUDGET_MODE,
    verbose = true,
  } = options

  return {
    name: 'perf-budget',
    apply: 'build',

    async closeBundle() {
      if (mode === 'off') return

      try {
        const report = await analyzeBundles(distPath)

        if (verbose) {
          console.log(formatBundleReport(report))
        }

        if (!report.passed) {
          const message = `Performance budget exceeded! ${report.violations.length} violation(s) found.`

          if (mode === 'error') {
            throw new Error(chalk.red(message))
          } else {
            console.warn(chalk.yellow(message))
          }
        } else if (report.warnings.length > 0) {
          console.warn(
            chalk.yellow(
              `⚠️  ${report.warnings.length} bundle(s) approaching budget limit (>80%)`
            )
          )
        } else {
          console.log(chalk.green('✅ All bundles within performance budget!'))
        }
      } catch (error) {
        if (mode === 'error') {
          throw error
        } else {
          console.error(chalk.red('Performance budget analysis failed:'), error)
        }
      }
    },
  }
}

export default perfBudgetPlugin
