/* global describe, it */
const { expect } = require("chai");
const sinon = require("sinon");
const { Cache } = require("hull/lib/infra");

const IntercomAgent = require("../../server/lib/intercom-agent");


describe("IntercomAgent", () => {
  const cache = new Cache();

  const ctxStub = {
    client: {
      logger: {
        debug: () => {}
      },
      configuration: () => {
        return {
          organization: "hull.rocks",
          id: "1234",
          secret: "1234"
        };
      }
    }
  };
  cache.contextMiddleware()({ hull: ctxStub }, {}, () => {});

  const intercomClientStub = {
    get: () => {}
  };

  it("should cache the getTags results", (done) => {
    const getStub = sinon.stub(intercomClientStub, "get").resolves({
      body: {
        tags: [{ name: "foo" }]
      }
    });

    const intercomAgent = new IntercomAgent(intercomClientStub, ctxStub);

    intercomAgent.getTags()
      .then((tags) => {
        expect(tags).to.eql([{ name: "foo" }]);
        return intercomAgent.getTags();
      })
      .then(tags => {
        expect(tags).to.eql([{ name: "foo" }]);
        expect(getStub.callCount).to.equal(1);
        done();
      });
  });
});
