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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const rest_1 = require("@octokit/rest");
const cost_estimator_1 = require("./cost.estimator");
const reporter_1 = require("./reporter");
async function run() {
    try {
        const token = core.getInput('github-token', { required: true });
        const provider = (core.getInput('cloud-provider') || 'github');
        const postComment = core.getBooleanInput('post-comment');
        const lookback = parseInt(core.getInput('lookback-runs') || '30');
        const octokit = new rest_1.Octokit({ auth: token });
        const ctx = github.context;
        const { owner, repo } = ctx.repo;
        const currentRunId = parseInt(process.env.GITHUB_RUN_ID ?? '0');
        core.info(`ci-cost-tracker — ${owner}/${repo} | provider: ${provider}`);
        const report = await (0, cost_estimator_1.estimateCost)(octokit, owner, repo, currentRunId, provider, lookback);
        core.setOutput('run-cost-usd', report.totalRunCostUsd.toFixed(4));
        core.setOutput('monthly-projection-usd', report.monthlyProjectionUsd.toFixed(2));
        if (postComment && ctx.payload.pull_request) {
            await (0, reporter_1.renderReport)(octokit, ctx, report);
            core.info('PR comment posted');
        }
        core.info(`Done — run cost: $${report.totalRunCostUsd.toFixed(4)} | monthly: ~$${report.monthlyProjectionUsd.toFixed(2)}`);
    }
    catch (err) {
        core.setFailed(`ci-cost-tracker failed: ${err.message}`);
    }
}
run();
