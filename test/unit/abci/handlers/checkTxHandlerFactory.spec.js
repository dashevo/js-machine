const {
  abci: {
    ResponseCheckTx,
  },
} = require('abci/types');

const checkTxHandlerFactory = require('../../../../lib/abci/handlers/checkTxHandlerFactory');
const getRequestTxFixture = require('../../../../lib/test/fixtures/getRequestTxFixture');
const getDataContractFixture = require('../../../../lib/test/fixtures/getDataContractFixture');
const getDataContractStateTransitionFixture = require('../../../../lib/test/fixtures/getDataContractStateTransitionFixture');

describe('checkTxHandlerFactory', () => {
  let checkTxHandler;
  let request;
  let decodeStateTransition;

  beforeEach(async function beforeEach() {
    const dataContractFixture = getDataContractFixture();
    const stateTransitionFixture = await getDataContractStateTransitionFixture(dataContractFixture);
    const requestTxFixture = getRequestTxFixture(stateTransitionFixture);

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
