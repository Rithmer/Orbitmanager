import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TaskRiskInput } from '@/domain/services/risk-assessment.interface';

interface MlPredictResponse {
  prediction: {
    predictedCompletionDate: string;
    delayProbability: number;
    riskLevel: string;
    riskFactors: string[];
    recommendation: string;
  };
}

interface MlBatchPredictResponse {
  predictions: Record<
    string,
    {
      predictedCompletionDate: string;
      delayProbability: number;
      riskLevel: string;
      riskFactors: string[];
      recommendation: string;
    }
  >;
}

interface MlRetrainResponse {
  status: string;
  message: string;
  metrics: Record<string, unknown> | null;
}

interface MlHealthResponse {
  status: string;
  model_loaded: boolean;
  version: string;
}

interface MlModelInfoResponse {
  model_type: string;
  version: string;
  trained_at: string | null;
  sample_size: number | null;
  features: string[];
  metrics: Record<string, unknown> | null;
}

@Injectable()
export class MlClientService {
  private readonly logger = new Logger(MlClientService.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('ML_SERVICE_URL') ??
      'http://ml-service:8000';
    this.timeoutMs = 10_000;
  }

  async predict(
    task: TaskRiskInput,
    llm = false,
  ): Promise<MlPredictResponse['prediction'] | null> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, llm }),
      });

      if (!response.ok) {
        this.logger.warn(`ML predict returned ${response.status}`);
        return null;
      }

      const data = (await response.json()) as MlPredictResponse;
      return data.prediction;
    } catch (error) {
      this.logger.warn(`ML predict failed: ${String(error)}`);
      return null;
    }
  }

  async predictBatch(
    tasks: TaskRiskInput[],
  ): Promise<MlBatchPredictResponse['predictions'] | null> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/predict/batch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks }),
        },
      );

      if (!response.ok) {
        this.logger.warn(`ML predict/batch returned ${response.status}`);
        return null;
      }

      const data = (await response.json()) as MlBatchPredictResponse;
      return data.predictions;
    } catch (error) {
      this.logger.warn(`ML predict/batch failed: ${String(error)}`);
      return null;
    }
  }

  async retrain(sampleSize = 5000): Promise<MlRetrainResponse | null> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sample_size: sampleSize }),
      });

      if (!response.ok) {
        this.logger.warn(`ML retrain returned ${response.status}`);
        return null;
      }

      return (await response.json()) as MlRetrainResponse;
    } catch (error) {
      this.logger.warn(`ML retrain failed: ${String(error)}`);
      return null;
    }
  }

  async health(): Promise<MlHealthResponse | null> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`, {
        method: 'GET',
      });

      if (!response.ok) return null;
      return (await response.json()) as MlHealthResponse;
    } catch {
      return null;
    }
  }

  async modelInfo(): Promise<MlModelInfoResponse | null> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/model/info`,
        { method: 'GET' },
      );

      if (!response.ok) return null;
      return (await response.json()) as MlModelInfoResponse;
    } catch {
      return null;
    }
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }
}
