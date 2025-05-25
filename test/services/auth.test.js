const should = require("should");
const services = require("../../lib/services");
const credentialService = services.credential;
const userService = services.user;
const authService = services.auth;
const db = require("../../lib/db");

describe("Auth tests", function () {
  let user, userFromDb;
  let _credential;

  before(() => {
    return db
      .flushdb()
      .then(() => {
        user = {
          username: "irfanbaqui",
          firstname: "irfan",
          lastname: "baqui",
          email: "irfan@eg.com",
        };

        _credential = {
          secret: "password",
          scopes: ["someScope1", "someScope2", "someScope3"],
        };

        return userService.insert(user);
      })
      .then((_user) => {
        should.exist(_user);
        userFromDb = _user;
        return credentialService.insertScopes([
          "someScope1",
          "someScope2",
          "someScope3",
        ]);
      })
      .then(() => {
        return credentialService.insertCredential(
          userFromDb.id,
          "oauth2",
          _credential
        );
      })
      .then((res) => should.exist(res));
  });

  describe("Credential Auth", () => {
    it("should authenticate user", () => {
      return authService
        .authenticateCredential(user.username, _credential.secret, "oauth2")
        .then((authResponse) => {
          const expectedResponse = Object.assign(
            {
              type: "user",
              id: userFromDb.id,
              username: user.username,
              isActive: true,
            },
            userFromDb
          );
          should.exist(authResponse);
          should.deepEqual(authResponse, expectedResponse);
        });
    });

    it("should not authenticate invalid user with credentials", () => {
      return authService
        .authenticateCredential("invalidUsername", _credential.secret, "oauth2")
        .then((authResponse) => {
          should.exist(authResponse);
          authResponse.should.eql(false);
        });
    });

    it("should not authenticate valid user with invalid credentials", () => {
      return authService
        .authenticateCredential(userFromDb.id, "invalidSecret", "oauth2")
        .then((authResponse) => {
          should.exist(authResponse);
          authResponse.should.eql(false);
        });
    });

    it("should authorize Credential with scopes", () => {
      return authService
        .authorizeCredential(userFromDb.id, "oauth2", [
          "someScope1",
          "someScope2",
        ])
        .then((authResponse) => {
          should.exist(authResponse);
          authResponse.should.eql(true);
        });
    });

    it("should not authorize Credential with invalid scopes", () => {
      return authService
        .authorizeCredential(userFromDb.id, "oauth2", [
          "otherScope",
          "someScope2",
        ])
        .then((authResponse) => {
          should.exist(authResponse);
          authResponse.should.eql(false);
        });
    });

    it("should not authorize Credential that is inActive", () => {
      return credentialService
        .deactivateCredential(userFromDb.id, "oauth2")
        .then(function (res) {
          should.exist(res);
          res.should.eql(true);
        })
        .then(() =>
          authService.authorizeCredential(userFromDb.id, "oauth2", [
            "otherScope",
            "someScope2",
          ])
        )
        .then((authResponse) => {
          should.exist(authResponse);
          authResponse.should.eql(false);

          // reset credential back to active status
          return credentialService
            .activateCredential(userFromDb.id, "oauth2")
            .then(function (res) {
              should.exist(res);
              res.should.eql(true);
            });
        });
    });
  });
});
