"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPricing = getPricing;
// GitHub Actions pricing (USD/minute, as of 2025)
// https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions
const GITHUB_PRICING = {
    'ubuntu-latest': { pricePerMinute: 0.008, currency: 'USD', runnerLabel: 'Linux 2-core' },
    'ubuntu-22.04': { pricePerMinute: 0.008, currency: 'USD', runnerLabel: 'Linux 2-core' },
    'ubuntu-20.04': { pricePerMinute: 0.008, currency: 'USD', runnerLabel: 'Linux 2-core' },
    'windows-latest': { pricePerMinute: 0.016, currency: 'USD', runnerLabel: 'Windows 2-core' },
    'windows-2022': { pricePerMinute: 0.016, currency: 'USD', runnerLabel: 'Windows 2-core' },
    'macos-latest': { pricePerMinute: 0.08, currency: 'USD', runnerLabel: 'macOS 3-core' },
    'macos-14': { pricePerMinute: 0.08, currency: 'USD', runnerLabel: 'macOS 3-core' },
    'ubuntu-latest-4-core': { pricePerMinute: 0.016, currency: 'USD', runnerLabel: 'Linux 4-core' },
    'ubuntu-latest-8-core': { pricePerMinute: 0.032, currency: 'USD', runnerLabel: 'Linux 8-core' },
};
// AWS CodeBuild pricing (USD/minute, build.general1.small)
const AWS_PRICING = {
    'BUILD_GENERAL1_SMALL': { pricePerMinute: 0.005, currency: 'USD', runnerLabel: 'CodeBuild Small' },
    'BUILD_GENERAL1_MEDIUM': { pricePerMinute: 0.010, currency: 'USD', runnerLabel: 'CodeBuild Medium' },
    'BUILD_GENERAL1_LARGE': { pricePerMinute: 0.020, currency: 'USD', runnerLabel: 'CodeBuild Large' },
    'default': { pricePerMinute: 0.005, currency: 'USD', runnerLabel: 'CodeBuild Small' },
};
// GCP Cloud Build pricing
const GCP_PRICING = {
    'N1_HIGHCPU_8': { pricePerMinute: 0.0034, currency: 'USD', runnerLabel: 'Cloud Build N1' },
    'E2_HIGHCPU_8': { pricePerMinute: 0.0025, currency: 'USD', runnerLabel: 'Cloud Build E2' },
    'default': { pricePerMinute: 0.0034, currency: 'USD', runnerLabel: 'Cloud Build default' },
};
// Azure Pipelines pricing (Microsoft-hosted)
const AZURE_PRICING = {
    'ubuntu-latest': { pricePerMinute: 0.008, currency: 'USD', runnerLabel: 'Azure Linux' },
    'windows-latest': { pricePerMinute: 0.016, currency: 'USD', runnerLabel: 'Azure Windows' },
    'macos-latest': { pricePerMinute: 0.05, currency: 'USD', runnerLabel: 'Azure macOS' },
    'default': { pricePerMinute: 0.008, currency: 'USD', runnerLabel: 'Azure default' },
};
function getPricing(provider, runnerLabel) {
    const table = provider === 'github' ? GITHUB_PRICING
        : provider === 'aws' ? AWS_PRICING
            : provider === 'gcp' ? GCP_PRICING
                : AZURE_PRICING;
    const key = runnerLabel?.toLowerCase() ?? '';
    // Try direct match first, then partial match, then default
    for (const [k, v] of Object.entries(table)) {
        if (k === key || key.includes(k))
            return v;
    }
    return table['default'] ?? GITHUB_PRICING['ubuntu-latest'];
}
