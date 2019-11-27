const { client: JaysonClient } = require('jayson/promise');

class TendermintRPCClient {
  constructor() {
    this.client = new JaysonClient({
      host: process.env.TENDERMINT_HOST,
      port: process.env.TENDERMINT_PORT,
    });
  }

  /**
   * Fetch transitions by tag
   *
   * @param {string} key
   * @param {string} value
   * @param {boolean} prove
   * @param {number} page
   * @param {number} perPage
   * @return {Promise<buffer[]|null>}
   */
  async fetchTransitions(key, value, prove, page, perPage) {
    const tag = `\\"${key}='${value}'"`;
    const { result: transitions } = await this.client.request(
      'tx_search',
      {
        query: tag,
        prove,
        page,
        per_page: perPage,
      },
    );

    return transitions;
  }
}

module.exports = TendermintRPCClient;
