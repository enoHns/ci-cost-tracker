"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderReport = renderReport;
const COMMENT_TAG = '<!-- ci-cost-tracker -->';
async function renderReport(octokit, ctx, report) {
    if (!ctx.payload.pull_request)
        return;
    const body = buildComment(report);
    const { owner, repo } = ctx.repo;
    const prNumber = ctx.payload.pull_request.number;
    const { data: comments } = await octokit.issues.listComments({ owner, repo, issue_number: prNumber });
    const existing = comments.find(c => c.body?.includes(COMMENT_TAG));
    if (existing) {
        await octokit.issues.updateComment({ owner, repo, comment_id: existing.id, body });
    }
    else {
        await octokit.issues.createComment({ owner, repo, issue_number: prNumber, body });
    }
}
function buildComment(report) {
    const lines = [COMMENT_TAG, '## 💰 CI Cost Estimate\n'];
    lines.push(`**This run**: \$${report.totalRunCostUsd.toFixed(4)}  `);
    lines.push(`**Average run**: \$${report.avgRunCostUsd.toFixed(4)}  `);
    lines.push(`**Monthly projection**: ~\$${report.monthlyProjectionUsd.toFixed(2)}/month  `);
    lines.push(`**Provider**: \`${report.provider}\` · Based on ${report.analyzedRuns} historical run(s)\n`);
    if (report.jobs.length > 0) {
        lines.push('| Job | Runner | Duration | Cost |');
        lines.push('|-----|--------|----------|------|');
        for (const job of report.jobs.sort((a, b) => b.costUsd - a.costUsd)) {
            lines.push(`| \`${job.jobName}\` | ${job.runnerType} | ${job.durationMin} min | \$${job.costUsd.toFixed(4)} |`);
        }
    }
    return lines.join('\n');
}
