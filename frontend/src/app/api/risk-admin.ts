import { api, type ApiRequestOptions } from '@/app/api/client'

export interface MlHealthStatus {
  status: string
  model_loaded: boolean
  version: string
}

export interface MlModelInfo {
  model_type: string
  version: string
  trained_at: string | null
  sample_size: number | null
  features: string[]
  metrics: Record<string, unknown> | null
}

export interface MlStatusResponse {
  provider: string
  health: MlHealthStatus | null
  modelInfo: MlModelInfo | null
}

export interface RetrainResponse {
  status: string
  message: string
  metrics?: Record<string, unknown> | null
}

export const riskAdminApi = {
  getMlStatus(options: ApiRequestOptions = {}): Promise<MlStatusResponse> {
    return api.get('/risk/ml-status', options)
  },

  retrain(sampleSize = 5000, options: ApiRequestOptions = {}): Promise<RetrainResponse> {
    return api.post('/risk/retrain', { sample_size: sampleSize }, options)
  },
}
