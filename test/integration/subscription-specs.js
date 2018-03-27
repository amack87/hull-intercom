const Minihull = require("minihull");
const expect = require("chai").expect;
const moment = require("moment");

const Miniintercom = require("./support/miniintercom");
const bootstrap = require("./support/bootstrap");

process.env.OVERRIDE_INTERCOM_URL = "http://localhost:8002";
process.env.RATE_LIMIT_DELAY = 200;

describe("ensure webhook operation", function test() {
  let minihull, miniintercom, server;
  beforeEach(() => {
    minihull = new Minihull();
    miniintercom = new Miniintercom();
    server = bootstrap(8000);
    return Promise.all([
      minihull.listen(8001),
      miniintercom.listen(8002)
    ]);
  });

  it("should retry after ten seconds in case of rate limit", (done) => {
    minihull.stubConnector({
      id: "595103c73628d081190000f6",
      private_settings: {
        access_token: "intercomABC",
        webhook_id: "abc-123"
      }
    });
    miniintercom.stubApp("/users")
      .respond({
        users: [{
          id: "intercomUserId",
          email: "foo@bar.com",
          updated_at: moment().format("X")
        }]
      });
    const stub = miniintercom.stubApp("/subscriptions/abc-123")
      .onFirstCall().respond(429)
      .onSecondCall().respond(200);
    miniintercom.stubApp("/subscriptions/abc-123")
      .respond({});

    miniintercom.on("incoming.request@/subscriptions/abc-123", (req) => {
      if (miniintercom.requests.get("incoming").filter({ url: "/subscriptions/abc-123" }).size().value()) {
        done();
      }
    });

    minihull.notifyConnector("595103c73628d081190000f6", "http://localhost:8000/notify", "ship:update", { foo: "bar" })
      .then(() => {});
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
