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
   *
   * @return {Promise<number>}
   */
  async function fetchTransitionCountByEvent(key, value = '') {
    const searchTag = value === '' ? `${key}` : `${key}='${value}'`;

    const { result } = await tendermintRPC.request(
      'tx_search',
      {
        query: searchTag,
      },
    );

    return parseInt(result.total_count, 10);
  }

  return fetchTransitionCountByEvent;
}

module.exports = fetchTransitionCountByEventFactory;
