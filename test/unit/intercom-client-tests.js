/* global describe, it */
const assert = require("assert");
const IntercomClient = require("../../server/lib/intercom-client");
const ClientMock = require("./mocks/client-mock");

const hullMock = {
  ship: {
    private_settings: {
      api_key: process.env.API_KEY,
      app_id: process.env.APP_ID
    }
  },
  client: ClientMock(),
  metric: {
    increment: () => {
    },
    value: () => {
    }
  }
};

describe("Intercom Client", () => {
  if (!process.env.API_KEY || process.env.APP_ID) {
    return null;
  }

  it("should allow for get api calls", () => {
    const intercomClient = new IntercomClient(hullMock);

    return intercomClient.get("/users")
      .then(res => {
        assert.equal(res.body.type, "user.list");
      });
  });

  it("should provide error handling helper", () => {
    const intercomClient = new IntercomClient(hullMock);

    return intercomClient.get("/non-existing-api")
      .catch(err => {
        const fErr = intercomClient.handleError(err);
        assert.equal("404", fErr.statusCode);
        assert.equal("not_found", fErr.body.errors[0].code);
      });
  });
  return null;
});
