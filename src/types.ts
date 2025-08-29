export type CloudProvider = 'github' | 'aws' | 'gcp' | 'azure'

export interface RunnerPricing {
  pricePerMinute: number   // USD
  currency:       'USD'
  runnerLabel:    string
}

export interface JobCost {
  jobName:      string
  runnerType:   string
  durationMin:  number
  costUsd:      number
}

export interface CostReport {
  runId:               number
  jobs:                JobCost[]
  totalRunCostUsd:     number
  avgRunCostUsd:       number
  monthlyProjectionUsd: number
  provider:            CloudProvider
  analyzedRuns:        number
}
