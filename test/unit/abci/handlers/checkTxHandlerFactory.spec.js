const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');

const checkTxHandlerFactory = require('../../../../lib/abci/handlers/checkTxHandlerFactory');
const getRequestTxFixture = require('../../../../lib/test/fixtures/getRequestTxFixture');
const getStHeaderFixture = require('../../../../lib/test/fixtures/getStHeaderFixture');
const getStPacketFixture = require('../../../../lib/test/fixtures/getStPacketFixture');

describe('checkTxHandlerFactory', () => {
  let checkTxHandler;
  let request;
  let decodeStateTransition;

  beforeEach(function beforeEach() {
    const stPacketFixture = getStPacketFixture();
    const stHeaderFixture = getStHeaderFixture(stPacketFixture);
    const requestTxFixture = getRequestTxFixture(stHeaderFixture, stPacketFixture);

    request = {
      tx: requestTxFixture,
    };

    decodeStateTransition = this.sinon.stub();

    checkTxHandler = checkTxHandlerFactory(decodeStateTransition);
  });

  it('should validate State Transition and return response with code 0', async () => {
    const response = await checkTxHandler(request);

    expect(response).to.be.an.instanceOf(ResponseCheckTx);
    expect(response.code).to.equal(0);

    expect(decodeStateTransition).to.be.calledOnceWith(request.tx);
  });
});
