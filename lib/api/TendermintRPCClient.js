const { client: JaysonClient } = require('jayson/promise');

class TendermintRPCClient {
  constructor(host, port) {
    this.client = JaysonClient.http({
      host,
      port,
    });
  }

  /**
   * Fetches transitions by Event (formerly Tag).
   * A tag is either just a key or a key value combination.
   * @param {string} key
   * @param {string} [value='']
   * @param {boolean} [prove=false]
   * @param {string} [page='1']
   * @param {string} [perPage='30']
   * @return {Promise<Object[]|null>}
   */
  async fetchTransitionsByEvent(key, value = '', prove = false, page = '1', perPage = '30') {
    const searchTag = value === '' ? `${key}` : `${key}='${value}'`;
    const { result } = await this.client.request(
      'tx_search',
      {
        query: searchTag,
        prove,
        page,
        per_page: perPage,
      },
    );
    return result;
  }
}

module.exports = TendermintRPCClient;
