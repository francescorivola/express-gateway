const request = require('supertest');
const gwHelper = require('../common/gateway.helper');
const adminHelperFactory = require('../common/admin-helper');
const username = 'test';
const proxyPolicy = {
  proxy: { action: { serviceEndpoint: 'backend' } }
};

describe.skip('E2E: basic-auth Policy', () => {
  let gatewayPort, gatewayProcess, backendServer, adminHelper, admin;
  before('setup', async function () {
    this.timeout(10000);
    const gatewayConfig = {
      apiEndpoints: {
        authorizedEndpoint: {
          host: '*',
          paths: ['/authorizedPath'],
          scopes: ['authorizedScope']
        },
        unauthorizedEndpoint: {
          host: '*',
          paths: ['/unauthorizedPath'],
          scopes: ['unauthorizedScope']
        }
      },
      policies: ['basic-auth', 'proxy'],
      pipelines: {
        pipeline1: {
          apiEndpoint: 'authorizedEndpoint',
          policies: [{ 'basic-auth': {} }, proxyPolicy]
        },
        pipeline2: {
          apiEndpoint: 'unauthorizedEndpoint',
          policies: [{ 'basic-auth': {} }, proxyPolicy]
        }
      }
    };
    const dirInfo = await gwHelper.bootstrapFolder();
    const gwInfo = await gwHelper.startGatewayInstance({
      dirInfo,
      gatewayConfig
    });
    gatewayProcess = gwInfo.gatewayProcess;
    backendServer = gwInfo.backendServers[0];
    gatewayPort = gwInfo.gatewayPort;

    adminHelper = adminHelperFactory();
    await adminHelper.start({ config: gatewayConfig });
    admin = adminHelper.admin;

    // Create scopes
    await admin.scopes.create(['authorizedScope', 'unauthorizedScope']);
    // Create user
    await admin.users.create({
      username,
      firstname: 'Kate',
      lastname: 'Smith'
    });
    // Create credential
    await admin.credentials.create(username, 'basic-auth', {
      scopes: ['authorizedScope'],
      password: 'pass'
    });
  });

  after((done) => {
    gatewayProcess.kill();
    backendServer.close(() => {
      if (adminHelper) adminHelper.stop();
      done();
    });
  });

  it('should not authenticate token for requests without token header', function () {
    return request(`http://localhost:${gatewayPort}`)
      .get('/authorizedPath')
      .expect(401);
  });

  it("should not authenticate token for requests if requester doesn't have authorized scopes", function () {
    const credentials = Buffer.from(username.concat(':pass')).toString(
      'base64'
    );

    return request(`http://localhost:${gatewayPort}`)
      .get('/unauthorizedPath')
      .set('Authorization', 'basic ' + credentials)
      .expect(401);
  });

  it('should authenticate token for requests with scopes if requester is authorized', function () {
    const credentials = Buffer.from(username.concat(':pass')).toString(
      'base64'
    );

    return request(`http://localhost:${gatewayPort}`)
      .get('/authorizedPath')
      .set('Authorization', 'basic ' + credentials)
      .expect(200);
  });

  it('should not authenticate invalid token', function () {
    const credentials = Buffer.from(username.concat(':wrongPassword')).toString(
      'base64'
    );

    return request(`http://localhost:${gatewayPort}`)
      .get('/authorizedPath')
      .set('Authorization', 'basic ' + credentials)
      .expect(401);
  });
});
