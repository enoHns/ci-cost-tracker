"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateCost = estimateCost;
const core = __importStar(require("@actions/core"));
const pricing_1 = require("./pricing");
async function estimateCost(octokit, owner, repo, currentRunId, provider, lookbackRuns) {
    core.info(`Estimating run cost (provider: ${provider})...`);
    // Cost for current run
    const { data: jobsData } = await octokit.actions.listJobsForWorkflowRun({
        owner, repo, run_id: currentRunId,
    });
    const jobs = jobsData.jobs.map(job => {
        const durationMs = job.completed_at && job.started_at
            ? new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()
            : 0;
        const durationMin = durationMs / 60000;
        const pricing = (0, pricing_1.getPricing)(provider, job.labels?.[0] ?? 'ubuntu-latest');
        const costUsd = Math.round(durationMin * pricing.pricePerMinute * 10000) / 10000;
        return { jobName: job.name, runnerType: pricing.runnerLabel, durationMin: Math.round(durationMin * 100) / 100, costUsd };
    });
    const totalRunCostUsd = jobs.reduce((s, j) => s + j.costUsd, 0);
    // Historical runs for average + projected cadence
    const { data: runsData } = await octokit.actions.listWorkflowRunsForRepo({
        owner, repo, per_page: Math.min(lookbackRuns, 100), status: 'completed',
    });
    const historicalRuns = runsData.workflow_runs.slice(0, 20);
    const historicalCosts = await Promise.all(historicalRuns.map(async (run) => {
        try {
            const { data: runJobs } = await octokit.actions.listJobsForWorkflowRun({ owner, repo, run_id: run.id });
            return runJobs.jobs.reduce((sum, job) => {
                const ms = job.completed_at && job.started_at
                    ? new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()
                    : 0;
                const min = ms / 60000;
                const p = (0, pricing_1.getPricing)(provider, job.labels?.[0] ?? 'ubuntu-latest');
                return sum + min * p.pricePerMinute;
            }, 0);
        }
        catch {
            return 0;
        }
    }));
    const avgRunCostUsd = historicalCosts.length
        ? historicalCosts.reduce((s, c) => s + c, 0) / historicalCosts.filter(c => c > 0).length
        : totalRunCostUsd;
    // Observed cadence: spread historical runs over their date range
    let runsPerMonth = 60; // default fallback
    if (historicalRuns.length >= 2) {
        const oldest = new Date(historicalRuns[historicalRuns.length - 1].created_at).getTime();
        const newest = new Date(historicalRuns[0].created_at).getTime();
        const daysDiff = Math.max(1, (newest - oldest) / 86400000);
        runsPerMonth = Math.round((historicalRuns.length / daysDiff) * 30);
    }
    const monthlyProjectionUsd = Math.round(avgRunCostUsd * runsPerMonth * 100) / 100;
    core.info(`  Run cost: $${totalRunCostUsd.toFixed(4)} · ~${runsPerMonth} runs/month · Monthly: $${monthlyProjectionUsd.toFixed(2)}`);
    return {
        runId: currentRunId, jobs,
        totalRunCostUsd: Math.round(totalRunCostUsd * 10000) / 10000,
        avgRunCostUsd: Math.round(avgRunCostUsd * 10000) / 10000,
        monthlyProjectionUsd, provider, analyzedRuns: historicalCosts.length,
    };
}
