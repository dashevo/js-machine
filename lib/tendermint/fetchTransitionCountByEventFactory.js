/**
 * Fetch total count of transition by Event (factory)
 *
 * @param {JaysonClient} tendermintRPC
 *
 * @return {fetchTransitionCountByEvent}
 */
function fetchTransitionCountByEventFactory(tendermintRPC) {
  /**
   * Fetch total count of transitions by Event (formerly Tag)
   * A tag is either just a key or a key-value combination
   *
   * @typedef fetchTransitionCountByEvent
   *
   * @param {string} key
   * @param {string} [value='']
   * @param {boolean} [options.prove=false]
   * @param {number} [options.page=1]
   * @param {number} [options.per_page=30]
   *
   * @return {Promise<number>}
   */
  async function fetchTransitionCountByEvent(key, value = '', options = {}) {
    const searchTag = value === '' ? `${key}` : `${key}='${value}'`;

    const { result } = await tendermintRPC.request(
      'tx_search',
      {
        query: searchTag,
        ...options,
      },
    );

    return parseInt(result.total_count, 10);
  }

  return fetchTransitionCountByEvent;
}

module.exports = fetchTransitionCountByEventFactory;
