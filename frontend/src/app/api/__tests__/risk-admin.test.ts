import { describe, expect, it, vi, beforeEach } from 'vitest'
import { riskAdminApi } from '@/app/api/risk-admin'
import { api } from '@/app/api/client'

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('riskAdminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMlStatus', () => {
    it('calls GET /risk/ml-status and returns response', async () => {
      const mockResponse = {
        provider: 'ml',
        health: { status: 'ok', model_loaded: true, version: '1.0.0' },
        modelInfo: {
          model_type: 'GradientBoostingRegressor',
          version: '1.0.0',
          trained_at: '2026-03-25T10:00:00',
          sample_size: 5000,
          features: ['difficulty'],
          metrics: { cv_rmse_mean: 0.12 },
        },
      }
      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const result = await riskAdminApi.getMlStatus()

      expect(api.get).toHaveBeenCalledWith('/risk/ml-status', {})
      expect(result).toEqual(mockResponse)
    })

    it('passes abort signal option', async () => {
      vi.mocked(api.get).mockResolvedValue({ provider: 'stub', health: null, modelInfo: null })
      const controller = new AbortController()

      await riskAdminApi.getMlStatus({ signal: controller.signal })

      expect(api.get).toHaveBeenCalledWith('/risk/ml-status', { signal: controller.signal })
    })
  })

  describe('retrain', () => {
    it('calls POST /risk/retrain with default sample size', async () => {
      const mockResponse = { status: 'success', message: 'Model retrained', metrics: {} }
      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const result = await riskAdminApi.retrain()

      expect(api.post).toHaveBeenCalledWith('/risk/retrain', { sample_size: 5000 }, {})
      expect(result).toEqual(mockResponse)
    })

    it('calls POST /risk/retrain with custom sample size', async () => {
      vi.mocked(api.post).mockResolvedValue({ status: 'success', message: 'ok' })

      await riskAdminApi.retrain(10000)

      expect(api.post).toHaveBeenCalledWith('/risk/retrain', { sample_size: 10000 }, {})
    })
  })
})
