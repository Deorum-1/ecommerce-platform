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

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('requires a Clerk session to register a company', () => {
    return request(app.getHttpServer())
      .post('/auth/register-company')
      .send({ name: 'Acme Shop' })
      .expect(401);
  });

  it('requires a Clerk session to create a staff account', () => {
    return request(app.getHttpServer())
      .post('/tenants/members')
      .send({
        emailAddress: 'staff@example.com',
        firstName: 'Staff',
        lastName: 'Member',
      })
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
