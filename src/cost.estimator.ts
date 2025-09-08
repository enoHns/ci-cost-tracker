import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import { CloudProvider, CostReport, JobCost } from './types'
import { getPricing } from './pricing'

export async function estimateCost(
  octokit: Octokit,
  owner: string,
  repo: string,
  currentRunId: number,
  provider: CloudProvider,
  lookbackRuns: number,
): Promise<CostReport> {
  core.info(`Estimating run cost (provider: ${provider})...`)

  // Cost for current run
  const { data: jobsData } = await octokit.actions.listJobsForWorkflowRun({
    owner, repo, run_id: currentRunId,
  })

  const jobs: JobCost[] = jobsData.jobs.map(job => {
    const durationMs = job.completed_at && job.started_at
      ? new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()
      : 0
    const durationMin = durationMs / 60000
    const pricing     = getPricing(provider, job.labels?.[0] ?? 'ubuntu-latest')
    const costUsd     = Math.round(durationMin * pricing.pricePerMinute * 10000) / 10000

    return {
      jobName:    job.name,
      runnerType: pricing.runnerLabel,
      durationMin: Math.round(durationMin * 100) / 100,
      costUsd,
    }
  })

  const totalRunCostUsd = jobs.reduce((s, j) => s + j.costUsd, 0)

  // Monthly projection based on historical runs
  const { data: runsData } = await octokit.actions.listWorkflowRunsForRepo({
    owner, repo,
    per_page: Math.min(lookbackRuns, 100),
    status: 'completed',
  })

  const historicalCosts = await Promise.all(
    runsData.workflow_runs.slice(0, 20).map(async run => {
      try {
        const { data: runJobs } = await octokit.actions.listJobsForWorkflowRun({
          owner, repo, run_id: run.id,
        })
        return runJobs.jobs.reduce((sum, job) => {
          const ms  = job.completed_at && job.started_at
            ? new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()
            : 0
          const min = ms / 60000
          const p   = getPricing(provider, job.labels?.[0] ?? 'ubuntu-latest')
          return sum + min * p.pricePerMinute
        }, 0)
      } catch {
        return 0
      }
    })
  )

  const avgRunCostUsd = historicalCosts.length
    ? historicalCosts.reduce((s, c) => s + c, 0) / historicalCosts.length
    : totalRunCostUsd

  // Rough monthly projection: assume same run frequency as observed
  const runsPerMonth = 30 * 8  // conservative: 8 runs/day
  const monthlyProjectionUsd = Math.round(avgRunCostUsd * runsPerMonth * 100) / 100

  core.info(`  Run cost: $${totalRunCostUsd.toFixed(4)} · Monthly projection: $${monthlyProjectionUsd.toFixed(2)}`)

  return {
    runId: currentRunId,
    jobs,
    totalRunCostUsd:      Math.round(totalRunCostUsd * 10000) / 10000,
    avgRunCostUsd:        Math.round(avgRunCostUsd * 10000) / 10000,
    monthlyProjectionUsd,
    provider,
    analyzedRuns:         historicalCosts.length,
  }
}
