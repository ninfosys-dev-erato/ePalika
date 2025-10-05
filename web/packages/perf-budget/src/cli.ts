#!/usr/bin/env node
import { analyzeBundles } from './analyzers/bundle'

async function main() {
  const [,, cmd] = process.argv
  if (cmd === 'analyze') {
    // Analyze shell and mfe-darta bundles
    const shellReport = await analyzeBundles('../../apps/shell/dist')
    const dartaReport = await analyzeBundles('../../apps/mfe-darta/dist')
    console.log('Shell bundle report:', shellReport)
    console.log('MFE-Darta bundle report:', dartaReport)
    if (!shellReport.passed || !dartaReport.passed) {
      process.exit(1)
    }
  } else {
    console.error('Unknown command:', cmd)
    process.exit(1)
  }
}
main()
