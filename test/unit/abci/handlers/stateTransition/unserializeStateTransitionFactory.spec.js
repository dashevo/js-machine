const getIdentityCreateSTFixture = require('@dashevo/dpp/lib/test/fixtures/getIdentityCreateSTFixture');

const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');

const ConsensusError = require('@dashevo/dpp/lib/errors/ConsensusError');
const InvalidStateTransitionError = require('@dashevo/dpp/lib/stateTransition/errors/InvalidStateTransitionError');

const unserializeStateTransitionFactory = require('../../../../../lib/abci/handlers/stateTransition/unserializeStateTransitionFactory');

const AbciError = require('../../../../../lib/abci/errors/AbciError');
const InvalidArgumentAbciError = require('../../../../../lib/abci/errors/InvalidArgumentAbciError');
const ExecutionTimedOutError = require('../../../../../lib/abci/errors/ExecutionTimedOutError');
const MemoryLimitExceededError = require('../../../../../lib/abci/errors/MemoryLimitExceededError');

describe('unserializeStateTransitionFactory', () => {
  let unserializeStateTransition;
  let dppMock;
  let stateTransitionFixture;

  beforeEach(function beforeEach() {
    stateTransitionFixture = getIdentityCreateSTFixture().serialize();

    dppMock = createDPPMock(this.sinon);

    unserializeStateTransition = unserializeStateTransitionFactory(dppMock);
  });

  it('should throw InvalidArgumentAbciError if State Transition is not specified', async () => {
    try {
      await unserializeStateTransition();

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: State Transition is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if State Transition is invalid', async () => {
    const consensusError = new ConsensusError('Invalid state transition');
    const error = new InvalidStateTransitionError(
      [consensusError],
      stateTransitionFixture.toJSON(),
    );

    dppMock.stateTransition.createFromSerialized.throws(error);

    try {
      await unserializeStateTransition(stateTransitionFixture);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: State Transition is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
      expect(e.getData()).to.deep.equal({
        errors: [consensusError],
      });
    }
  });

  it('should throw the error from createFromSerialized if throws not InvalidStateTransitionError', async () => {
    const error = new Error('Custom error');
    dppMock.stateTransition.createFromSerialized.throws(error);

    try {
      await unserializeStateTransition(stateTransitionFixture);

      expect.fail('should throw an error');
    } catch (e) {
      expect(e).to.be.equal(error);
    }
  });

  it('should throw a ExecutionTimedOutError if the VM Isolate execution timed out error thrown', async () => {
    const error = new Error('Script execution timed out.');
    dppMock.stateTransition.createFromSerialized.throws(error);

    try {
      await unserializeStateTransition(stateTransitionFixture);

      expect.fail('should throw an ExecutionTimedOutError');
    } catch (e) {
      expect(e).to.be.instanceOf(ExecutionTimedOutError);
    }
  });

  it('should throw a MemoryLimitExceededError if the VM Isolate memory limit exceeded error thrown', async () => {
    const error = new Error('Isolate was disposed during execution due to memory limit');
    dppMock.stateTransition.createFromSerialized.throws(error);

    try {
      await unserializeStateTransition(stateTransitionFixture);

      expect.fail('should throw an ExecutionTimedOutError');
    } catch (e) {
      expect(e).to.be.instanceOf(MemoryLimitExceededError);
    }
  });
});
