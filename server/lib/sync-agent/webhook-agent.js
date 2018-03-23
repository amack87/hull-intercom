const _ = require("lodash");
const uri = require("urijs");
const Promise = require("bluebird");

class WebhookAgent {
  constructor(intercomAgent, client, ship, helpers, hostname, cache) {
    this.ship = ship;
    this.client = client;
    this.helpers = helpers;
    this.intercomClient = intercomAgent.intercomClient;
    this.hostname = hostname;
    this.cache = cache;

    this.webhookId = _.get(this.ship, "private_settings.webhook_id");

    this.topics = [
      "user.created", "user.deleted",
      "user.tag.created", "user.tag.deleted", "user.unsubscribed",
      "conversation.user.created", "conversation.user.replied",
      "conversation.admin.replied", "conversation.admin.single.created",
      "conversation.admin.assigned", "conversation.admin.opened",
      "conversation.admin.closed", "user.email.updated",
      "contact.created", "contact.signed_up", "contact.added_email"
    ];
  }

  getWebhook() {
    this.client.logger.debug("connector.getWebhook");
    return this.cache.wrap("intercom-webhook", () => {
      this.client.logger.debug("connector.getWebhook.cachemiss");
      return this.intercomClient.get("/subscriptions/{{webhookId}}")
        .tmplVar({
          webhookId: this.webhookId
        });
    });
  }

  /**
   * @return Promise
   */
  ensureWebhook() {
    if (this.webhookId) {
      return this.getWebhook()
        .then(({ body }) => {
          const missingTopics = _.difference(this.topics, body.topics);
          if (_.isEmpty(missingTopics)) {
            return Promise.resolve(this.webhookId);
          }
          return this.createWebhook(this.webhookId);
        }, (error) => {
          if (error.status === 404) {
            return this.createWebhook();
          }
          return Promise.reject(error);
        });
    }
    return this.createWebhook();
  }

  /**
   * Creates or updates webhook
   * @type {String} webhookId optional id of existing webhook
   */
  createWebhook(webhookId = "") {
    const url = this.getWebhookUrl();

    return this.intercomClient.post("/subscriptions/{{webhookId}}", {
      service_type: "web",
      topics: this.topics,
      url
    })
      .tmplVar({
        webhookId
      })
      .catch((err) => {
        const fErr = this.intercomClient.handleError(err);
        // handle errors which may happen here
        return Promise.reject(fErr);
      })
      .then((res) => {
        this.webhookId = res.body.id;
        return this.helpers.updateSettings({
          webhook_id: this.webhookId
        }).then(() => {
          return this.webhookId;
        });
      })
      .then(() => {
        return this.cache.del("intercom-webhook");
      });
  }

  getWebhookUrl() {
    const { organization, id, secret } = this.client.configuration();
    const search = {
      organization,
      secret,
      ship: id
    };
    return uri(`https://${this.hostname}/intercom`).search(search).toString();
  }
}

module.exports = WebhookAgent;
