# ci-cost-tracker

[![CI](https://github.com/enoHns/ci-cost-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/enoHns/ci-cost-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Know exactly what each pipeline run costs — with monthly projections, per-job breakdown, and multi-cloud support.

---

## Install

```yaml
- name: Track CI cost
  uses: enoHns/ci-cost-tracker@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `github-token` | required | Token with `actions:read` |
| `cloud-provider` | `github` | `github` · `aws` · `gcp` · `azure` |
| `post-comment` | `true` | Post/update PR comment |
| `lookback-runs` | `30` | Runs used for monthly projection |

## Outputs

| Output | Description |
|--------|-------------|
| `run-cost-usd` | Cost of this run in USD |
| `monthly-projection-usd` | Projected monthly CI cost |

## Supported runners

| Provider | Runners |
|----------|---------|
| GitHub | ubuntu, windows, macOS (2/4/8-core) |
| AWS | CodeBuild small/medium/large |
| GCP | Cloud Build N1/E2 |
| Azure | Microsoft-hosted Linux/Windows/macOS |

---

## License

MIT
