const Hull = require("hull");
const Minihull = require("minihull");
const expect = require("chai").expect;
const sinon = require("sinon");
const winston = require("winston");
require("winston-spy");

const Miniintercom = require("./support/miniintercom");
const bootstrap = require("./support/bootstrap");

process.env.OVERRIDE_INTERCOM_URL = "http://localhost:8002";
process.env.RATE_LIMIT_DELAY = 200;

describe("log error response from intercom", function test() {
  let minihull;
  let miniintercom;
  let server;
  beforeEach(() => {
    minihull = new Minihull();
    miniintercom = new Miniintercom();
    server = bootstrap(8000);
    return Promise.all([
      minihull.listen(8001),
      miniintercom.listen(8002)
    ]);
  });

  it("should log the response status after the error", (done) => {
    minihull.stubConnector({
      id: "595103c73628d081190000f6",
      private_settings: {
        access_token: "intercomABC",
        webhook_id: "abc-123"
      }
    });

    const loggerSpy = sinon.spy();
    Hull.logger.transports.console.level = "debug";
    Hull.logger.add(winston.transports.SpyLogger, { level: "debug", spy: loggerSpy });

    miniintercom.stubApp("/subscriptions/abc-123")
      .respond(429);

    minihull.notifyConnector("595103c73628d081190000f6", "http://localhost:8000/notify", "ship:update", { foo: "bar" })
      .then(() => {});

    setTimeout(() => {
      expect(loggerSpy.callCount).to.equal(4);
      expect(loggerSpy.getCall(3).args[0]).to.equal("error");
      expect(loggerSpy.getCall(3).args[1]).to.equal("connector.notificationHandler.error");
      Hull.logger.remove(winston.transports.SpyLogger);
      done();
    }, 200);
  });

  afterEach((done) => {
    server.close(() => {
      Promise.all([
        minihull.close(),
        miniintercom.close()
      ]).then(() => done());
    });
  });
});
