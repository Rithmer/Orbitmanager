import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / — health-check возвращает статус ok', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res: { body: Record<string, unknown> }) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('uptime');
        expect(typeof res.body['uptime']).toBe('number');
      });
  });
});
