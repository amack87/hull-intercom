const Minihull = require("minihull");
const expect = require("chai").expect;

const Miniintercom = require("./support/miniintercom");
const bootstrap = require("./support/bootstrap");

process.env.OVERRIDE_INTERCOM_URL = "http://localhost:8002";

describe("outgoing users traffic", function test() {
  let minihull, miniintercom, server;
  beforeEach(() => {
    minihull = new Minihull();
    miniintercom = new Miniintercom();
    server = bootstrap();
    return Promise.all([
      minihull.listen(8001),
      miniintercom.listen(8002)
    ]);
  });

  it("should remove tags from users", (done) => {
    minihull.stubUsersSegments([{ id: "s2", name: "Segment 2" }]);
    minihull.stubConnector({
      id: "595103c73628d081190000f6",
      private_settings: {
        access_token: "intercomABC",
        synchronized_segments: ["s1"]
      }
    });
    const getTagsStub = miniintercom.stubApp("GET", "/tags")
      .respond({ tags: [] });
    miniintercom.stubApp("POST", "/users")
      .callsFake((req, res) => {
        res.json({ email: "foo@bar.com", tags: { tags: [{ name: "Segment 2" }] } });
      });
    const tagsStub = miniintercom.stubApp("POST", "/tags")
      .callsFake((req, res) => {
        res.end("ok");
      });

    minihull.notifyConnector("595103c73628d081190000f6", "http://localhost:8000/notify", "user_report:update", {
      user: { id: "123", email: "foo@bar.com", "traits_intercom/tags": ["Segment 2"] },
      segments: [{ id: "s1", name: "Segment 1" }],
      changes: {
        segments: {
          left: [{ id: "s2", name: "Segment 2" }]
        }
      },
      events: []
    });

    miniintercom.on("incoming.request@/tags", (req) => {
      if (req.body.users) {
        expect(req.body.users[0]).to.eql({ email: "foo@bar.com", untag: true });
        expect(req.body.name).to.equal("Segment 2");
        done();
      }
    });
  });

  it("should handle unique_user_constraint error", (done) => {
    minihull.stubUsersSegments([{ id: "s2", name: "Segment 2" }]);
    minihull.stubConnector({
      id: "595103c73628d081190000f6",
      private_settings: {
        access_token: "intercomABC",
        synchronized_segments: ["s1"]
      }
    });
    miniintercom.stubApp("GET", "/tags")
      .respond({ tags: [] });
    miniintercom.stubApp("POST", "/users")
      .callsFake((req, res) => {
        res.status(400).json({
          errors: [{
            code: "unique_user_constraint",
            message: "User already exists"
          }],
          request_id: "b2e4g1cnanc52n24lan0",
          type: "error.list"
        });
      });
    miniintercom.stubApp("POST", "/tags")
      .callsFake((req, res) => {
        res.end("ok");
      });

    minihull.notifyConnector("595103c73628d081190000f6", "http://localhost:8000/notify", "user_report:update", {
      user: {
        id: "123", email: "foo@bar.com", traits_foo: "baz", "traits_intercom/tags": ["Segment 1"]
      },
      segments: [{ id: "s1", name: "Segment 1" }],
      changes: {
        traits_foo: ["bar", "baz"]
      },
      events: []
    });

    miniintercom.on("incoming.request@POST/tags", (req) => {
      expect(req.body).to.eql({ name: "Segment 2" });
    });

    setTimeout(() => {
      done();
    }, 1000);
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
