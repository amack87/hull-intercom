/* global describe, it */
const { expect } = require("chai");
const sinon = require("sinon");

const saveLeads = require("../../server/jobs/save-leads");
const getLeadIdent = require("../../server/lib/lead/get-lead-ident");
const getClientMock = require("./mocks/client-mock");

describe("saveLeads", () => {
  it("should call asUser and traits methods for each lead and return Promise", () => {
    const clientMock = getClientMock();
    const asUserSpy = sinon.spy(clientMock, "asUser");
    const traitsSpy = sinon.spy(clientMock, "traits");
    const result = saveLeads({
      client: clientMock,
      service: {
        syncAgent: {
          userMapping: {
            getHullTraits: () => {}
          }
        }
      }
    }, { leads: [{ id: "123", user_id: "123" }] });
    expect(asUserSpy.callCount).to.be.equal(1);
    expect(traitsSpy.callCount).to.be.equal(1);
    expect(result).to.be.a("promise");
  });
});

describe("getLeadIdent", () => {
  it("should set user_id as anonymous_id", () => {
    const ident = getLeadIdent({}, { id: "123", user_id: "abc" });
    expect(ident.anonymous_id).to.equal("intercom:abc");
  });
});
