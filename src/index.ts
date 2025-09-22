import * as core   from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from '@octokit/rest'
import { estimateCost } from './cost.estimator'
import { renderReport }  from './reporter'
import { CloudProvider } from './types'

async function run(): Promise<void> {
  try {
    const token       = core.getInput('github-token', { required: true })
    const provider    = (core.getInput('cloud-provider') || 'github') as CloudProvider
    const postComment = core.getBooleanInput('post-comment')
    const lookback    = parseInt(core.getInput('lookback-runs') || '30')

    const octokit = new Octokit({ auth: token })
    const ctx     = github.context
    const { owner, repo } = ctx.repo

    const currentRunId = parseInt(process.env.GITHUB_RUN_ID ?? '0')

    core.info(`ci-cost-tracker — ${owner}/${repo} | provider: ${provider}`)

    const report = await estimateCost(octokit, owner, repo, currentRunId, provider, lookback)

    core.setOutput('run-cost-usd',            report.totalRunCostUsd.toFixed(4))
    core.setOutput('monthly-projection-usd',  report.monthlyProjectionUsd.toFixed(2))

    if (postComment && ctx.payload.pull_request) {
      await renderReport(octokit, ctx, report)
      core.info('PR comment posted')
    }

    core.info(`Done — run cost: $${report.totalRunCostUsd.toFixed(4)} | monthly: ~$${report.monthlyProjectionUsd.toFixed(2)}`)
  } catch (err) {
    core.setFailed(`ci-cost-tracker failed: ${(err as Error).message}`)
  }
}

run()
