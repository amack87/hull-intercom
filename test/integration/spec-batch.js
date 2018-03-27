const Minihull = require("minihull");
const expect = require("chai").expect;

const Miniintercom = require("./support/miniintercom");
const bootstrap = require("./support/bootstrap");

process.env.OVERRIDE_INTERCOM_URL = "http://localhost:8002";
process.env.OVERRIDE_RATE_LIMIT_DELAY = 200;

describe("batch operation", function test() {
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

  it("should pass batch extract to intercom batch endpoint via single api calls", (done) => {
    minihull.stubConnector({
      id: "123456789012345678901234",
      private_settings: {
        access_token: "intercomABC"
      }
    });
    minihull.fakeUsers(2);
    minihull.batchConnector("123456789012345678901234", "http://localhost:8000/batch");
    miniintercom.on("incoming.request#3", (lastReq) => {
      expect(lastReq.url).to.be.eq("/users");
      expect(lastReq.body).to.be.an("object");
      expect(lastReq.body).to.have.property("email");
      done();
    });
  });

  it("should pass batch extract to intercom batch endpoint via bulk api", (done) => {
    minihull.stubConnector({
      id: "123456789012345678901234",
      private_settings: {
        access_token: "intercomABC"
      }
    });
    minihull.fakeUsers(20);
    minihull.batchConnector("123456789012345678901234", "http://localhost:8000/batch");
    miniintercom.on("incoming.request#2", (lastReq) => {
      expect(lastReq.url).to.be.eq("/bulk/users");
      expect(lastReq.body).to.be.an("object");
      expect(lastReq.body).to.have.property("items");
      expect(lastReq.body.items).to.be.an("array");
      expect(lastReq.body.items[0].data).to.be.an("object");
      expect(lastReq.body.items[0].data).to.have.property("email");
      done();
    });
  });

  it("should retry after ten seconds in case of rate limit", (done) => {
    minihull.stubConnector({
      id: "123456789012345678901234",
      private_settings: {
        access_token: "intercomABC"
      }
    });
    minihull.fakeUsers(1);
    const stub = miniintercom.stubApp("/users")
      .onFirstCall().callsFake((req, res) => {
        res.status(429).end();
      })
      .onSecondCall().callsFake((req, res) => {
        res.status(200).end();
      });
    miniintercom.on("incoming.request@/users", () => {
      if (stub.callCount === 1) {
        done();
      }
    });

    minihull.batchConnector("123456789012345678901234", "http://localhost:8000/batch");
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
