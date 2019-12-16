const sinon = require('sinon');

const fetchTransitionCountByEventFactory = require(
  '../../../lib/tendermint/fetchTransitionCountByEventFactory',
);

describe('fetchTransitionCountByEventFactory', () => {
  let fetchTransitionCountByEvent;
  let tendermintRPCMock;

  beforeEach(function beforeEach() {
    tendermintRPCMock = {
      request: this.sinon.stub(),
    };

    tendermintRPCMock.request
      .withArgs('tx_search', sinon.match.any)
      .resolves({
        result: {
          total_count: '42',
        },
      });

    fetchTransitionCountByEvent = fetchTransitionCountByEventFactory(
      tendermintRPCMock,
    );
  });

  it('should make a request to Tendermint and return total count as a number', async () => {
    const key = 'someKey';
    const value = 'someValue';
    const searchTag = `${key}='${value}'`;

    const result = await fetchTransitionCountByEvent(key, value);

    expect(tendermintRPCMock.request).have.been.calledOnceWithExactly(
      'tx_search',
      {
        query: searchTag,
      },
    );

    expect(result).to.equal(42);
  });

  it('should make a request to Tendermint with empty value and return total count as a number', async () => {
    const key = 'someKey';
    const searchTag = `${key}`;

    const result = await fetchTransitionCountByEvent(key);

    expect(tendermintRPCMock.request).have.been.calledOnceWithExactly(
      'tx_search',
      {
        query: searchTag,
      },
    );

    expect(result).to.equal(42);
  });
});
