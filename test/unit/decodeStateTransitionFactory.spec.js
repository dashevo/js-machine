const cbor = require('cbor');

const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');

const InvalidSTPacketError = require('@dashevo/dpp/lib/stPacket/errors/InvalidSTPacketError');
const ConsensusError = require('@dashevo/dpp/lib/errors/ConsensusError');

const { Transaction } = require('@dashevo/dashcore-lib');

const decodeStateTransitionFactory = require('../../lib/decodeStateTransitionFactory');

const getRequestTxFixture = require('../../lib/test/fixtures/getRequestTxFixture');
const getStHeaderFixture = require('../../lib/test/fixtures/getStHeaderFixture');
const getStPacketFixture = require('../../lib/test/fixtures/getStPacketFixture');

const InvalidArgumentAbciError = require('../../lib/abci/errors/InvalidArgumentAbciError');
const AbciError = require('../../lib/abci/errors/AbciError');

describe('decodeStateTransitionFactory', () => {
  let stPacketFixture;
  let stHeaderFixture;
  let stFixture;
  let dppMock;
  let decodeStateTransition;

  beforeEach(function beforeEach() {
    stPacketFixture = getStPacketFixture();
    stHeaderFixture = getStHeaderFixture(stPacketFixture);
    stFixture = getRequestTxFixture(stHeaderFixture, stPacketFixture);

    dppMock = createDPPMock(this.sinon);
    dppMock.packet.createFromSerialized.resolves(stPacketFixture);
    dppMock.packet.validate.resolves({
      isValid: this.sinon.stub().returns(true),
    });

    decodeStateTransition = decodeStateTransitionFactory(dppMock);
  });

  it('should throw InvalidArgumentAbciError if stHeader is not specified', async () => {
    // Remove header from ST
    const decodedSTFixture = cbor.decode(stFixture);

    delete decodedSTFixture.header;

    stFixture = cbor.encode(decodedSTFixture);

    try {
      await decodeStateTransition(stFixture);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: stHeader is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stPacket is not specified', async () => {
    // Remove packet from ST
    const decodedSTFixture = cbor.decode(stFixture);

    delete decodedSTFixture.packet;

    stFixture = cbor.encode(decodedSTFixture);

    try {
      await decodeStateTransition(stFixture);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: stPacket is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stHeader is invalid', async () => {
    // Set invalid header to ST
    const decodedSTFixture = cbor.decode(stFixture);

    decodedSTFixture.header = 'wrongHex';

    stFixture = cbor.encode(decodedSTFixture);

    try {
      await decodeStateTransition(stFixture);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: stHeader is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stHeader type is invalid', async () => {
    // Set invalid header to ST
    const decodedSTFixture = cbor.decode(stFixture);

    decodedSTFixture.header = new Transaction().serialize(true);

    stFixture = cbor.encode(decodedSTFixture);

    try {
      await decodeStateTransition(stFixture);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: stHeader type is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stPacket is invalid', async () => {
    const consensusErrors = [
      new ConsensusError('test'),
    ];

    const invalidSTPacketError = new InvalidSTPacketError(
      consensusErrors,
      stPacketFixture.toJSON(),
    );

    dppMock.packet.createFromSerialized.throws(invalidSTPacketError);

    try {
      await decodeStateTransition(stFixture);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: stPacket is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);

      expect(e.getData()).to.have.property('errors');
      expect(e.getData().errors).to.equal(consensusErrors);
    }
  });

  it('should throw InvalidArgumentAbciError if stHeader hashSTPacket is not equal to stPacket hash', async () => {
    stHeaderFixture.extraPayload.setHashSTPacket(Buffer.alloc(32).toString('hex'));

    stFixture = getRequestTxFixture(stHeaderFixture, stPacketFixture);

    try {
      await decodeStateTransition(stFixture);

      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('Invalid argument: stHeader hashSTPacket is not equal to stPacket hash');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should return encoded stHeader and stPacket', async () => {
    const result = await decodeStateTransition(stFixture);

    expect(result).to.have.property('stHeader');
    expect(result.stHeader.serialize()).to.equal(stHeaderFixture.serialize());

    expect(result).to.have.property('stPacket', stPacketFixture);
  });
});
