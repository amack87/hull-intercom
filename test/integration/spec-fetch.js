const Minihull = require("minihull");
const expect = require("chai").expect;
const moment = require("moment");

const Miniintercom = require("./support/miniintercom");
const bootstrap = require("./support/bootstrap");

process.env.OVERRIDE_INTERCOM_URL = "http://localhost:8002";

describe("fetch operation", function test() {
  let minihull, miniintercom, server;
  beforeEach((done) => {
    minihull = new Minihull();
    miniintercom = new Miniintercom();
    minihull.listen(8001);
    server = bootstrap();
    minihull.stubConnector({
      id: "123456789012345678901234",
      private_settings: {
        access_token: "intercomABC"
      }
    });
    miniintercom.listen(8002).then(done);
  });

  it("should by default get last 1 day of last updated users", (done) => {
    const now = moment().format("X");
    miniintercom.stubApp("/users")
      .callsFake((req, res) => {
        res.json({
          users: [{
            email: "foo@bar.com",
            updated_at: now
          }, {
            email: "foo2@bar.com",
            updated_at: moment().subtract(1, "minute").format("X")
          }, {
            email: "skip@it.com",
            updated_at: moment().subtract(25, "hour").format("X")
          }]
        });
      });
    minihull.on("incoming.request@/api/v1/firehose", (req) => {
      expect(req.body.batch[0].type).to.be.eql("traits");
      expect(req.body.batch[0].body).to.be.eql({ email: "foo@bar.com", "intercom/email": "foo@bar.com", "intercom/updated_at": now });
      expect(req.body.batch[1].body.email).to.be.eql("foo2@bar.com");
    });
    minihull.on("incoming.request#6", (req) => {
      expect(req.body.private_settings.last_updated_at).to.be.eql(moment(now, "X").format());
      done();
    });
    minihull.postConnector("123456789012345678901234", "http://localhost:8000/sync")
      .then((res) => {});
  });

  afterEach(() => {
    minihull.close();
    miniintercom.close();
    server.close();
  });
});
