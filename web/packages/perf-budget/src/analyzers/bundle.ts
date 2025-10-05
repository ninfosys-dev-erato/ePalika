import { gzipSize } from 'gzip-size'
import { globSync } from 'glob'
import { readFileSync, statSync } from 'fs'
import { filesize } from 'filesize'
import { BUNDLE_BUDGETS, BundleBudget } from '../config/budgets.js'

export interface BundleAnalysis {
  path: string
  size: number
  gzipSize: number
  budget: number
  percentUsed: number
  exceeded: boolean
  warning: boolean
}

export interface BundleReport {
  totalSize: number
  totalGzipSize: number
  bundles: BundleAnalysis[]
  violations: BundleAnalysis[]
  warnings: BundleAnalysis[]
  passed: boolean
}

export async function analyzeBundles(distPath: string): Promise<BundleReport> {
  const analyses: BundleAnalysis[] = []

  for (const budget of BUNDLE_BUDGETS) {
    const pattern = budget.path.replace('dist/', `${distPath}/`)
    const files = globSync(pattern)

    for (const file of files) {
      const stats = statSync(file)
      const content = readFileSync(file)
      const gzipped = await gzipSize(content)

      const warnSize = budget.warnSize || budget.maxSize * 0.8
      const percentUsed = (gzipped / budget.maxSize) * 100

      analyses.push({
        path: file.replace(`${distPath}/`, ''),
        size: stats.size,
        gzipSize: gzipped,
        budget: budget.maxSize,
        percentUsed,
        exceeded: gzipped > budget.maxSize,
        warning: gzipped > warnSize && gzipped <= budget.maxSize,
      })
    }
  }

  const totalSize = analyses.reduce((sum, a) => sum + a.size, 0)
  const totalGzipSize = analyses.reduce((sum, a) => sum + a.gzipSize, 0)
  const violations = analyses.filter((a) => a.exceeded)
  const warnings = analyses.filter((a) => a.warning)

  return {
    totalSize,
    totalGzipSize,
    bundles: analyses,
    violations,
    warnings,
    passed: violations.length === 0,
  }
}

export function formatBundleReport(report: BundleReport): string {
  const lines: string[] = []

  lines.push('\n📊 Bundle Size Analysis\n')
  lines.push('─'.repeat(80))

  lines.push(`\nTotal Size: ${filesize(report.totalSize)} (${filesize(report.totalGzipSize)} gzipped)`)
  lines.push(`Bundles: ${report.bundles.length}`)
  lines.push(`Violations: ${report.violations.length}`)
  lines.push(`Warnings: ${report.warnings.length}`)

  if (report.violations.length > 0) {
    lines.push('\n❌ Budget Violations:\n')
    for (const violation of report.violations) {
      lines.push(
        `  ${violation.path}\n` +
          `    Size: ${filesize(violation.gzipSize)} / ${filesize(violation.budget)} (${violation.percentUsed.toFixed(1)}%)\n` +
          `    Exceeded by: ${filesize(violation.gzipSize - violation.budget)}`
      )
    }
  }

  if (report.warnings.length > 0) {
    lines.push('\n⚠️  Warnings (>80% of budget):\n')
    for (const warning of report.warnings) {
      lines.push(
        `  ${warning.path}\n` +
          `    Size: ${filesize(warning.gzipSize)} / ${filesize(warning.budget)} (${warning.percentUsed.toFixed(1)}%)`
      )
    }
  }

  if (report.passed && report.warnings.length === 0) {
    lines.push('\n✅ All bundles within budget!')
  }

  lines.push('\n' + '─'.repeat(80))

  return lines.join('\n')
}
