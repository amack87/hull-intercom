const Minihull = require("minihull");
const expect = require("chai").expect;

const Miniintercom = require("./support/miniintercom");
const bootstrap = require("./support/bootstrap");

process.env.OVERRIDE_INTERCOM_URL = "http://localhost:8002";

describe("intercom error responses", function test() {
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

  it("should handle Unauthorized response", (done) => {
    minihull.stubUsersSegments([{ id: "s2", name: "Segment 2" }]);
    minihull.stubConnector({
      id: "595103c73628d081190000f6",
      private_settings: {
        access_token: "intercomABC",
        synchronized_segments: ["s1"]
      }
    });
    const getTagsStub = miniintercom.stubApp("POST", "/subscriptions")
      .respond((req, res) => {
        res.status(401).json({
          code: "token_not_found",
          message: "Token not found"
        });
      });

    minihull.notifyConnector("595103c73628d081190000f6", "http://localhost:8000/notify", "user_report:update", {
      user: { id: "123", email: "foo@bar.com", "traits_intercom/tags": ["Segment 2"] },
      segments: [{ id: "s1", name: "Segment 1" }],
      changes: {},
      events: []
    });

    setTimeout(() => {
      done();
    }, 500);

    minihull.on("incoming.request#4", () => {
      expect(true).to.be.false;
    });
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
