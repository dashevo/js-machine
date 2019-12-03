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
    const options = {
      prove: true,
      page: 2,
      per_page: 32,
    };
    const searchTag = `${key}='${value}'`;

    const result = await fetchTransitionCountByEvent(key, value, options);

    expect(tendermintRPCMock.request).have.been.calledOnceWithExactly(
      'tx_search',
      {
        query: searchTag,
        prove: options.prove,
        page: options.page,
        per_page: options.per_page,
      },
    );

    expect(result).to.equal(42);
  });

  it('should make a request to Tendermint with empty value and return total count as a number', async () => {
    const key = 'someKey';
    const options = {
      prove: true,
      page: 2,
      per_page: 32,
    };
    const searchTag = `${key}`;

    const result = await fetchTransitionCountByEvent(key, '', options);

    expect(tendermintRPCMock.request).have.been.calledOnceWithExactly(
      'tx_search',
      {
        query: searchTag,
        prove: options.prove,
        page: options.page,
        per_page: options.per_page,
      },
    );

    expect(result).to.equal(42);
  });

  it('should make a request to Tendermint with default options and return total count as a number', async () => {
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
});
