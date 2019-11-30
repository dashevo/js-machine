const { client: JaysonClient } = require('jayson/promise');

class TendermintRPCClient {
  constructor(host, port) {
    this.client = JaysonClient.http({
      host,
      port,
    });
  }

  /**
   * Fetches transitions by tag.
   * A tag is either just a key or a key value combination.
   * @param {string} key
   * @param {string} [value='']
   * @param {boolean} [prove=false]
   * @param {number} [page=1]
   * @param {number} [perPage=30]
   * @return {Promise<Object[]|null>}
   */
  async fetchTransitionsByTag(key, value = '', prove = false, page = 1, perPage = 30) {
    let searchTag;
    if (value === '') {
      searchTag = `"${key}"`;
    } else {
      searchTag = `"${key}='${value}'"`;
    }
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
