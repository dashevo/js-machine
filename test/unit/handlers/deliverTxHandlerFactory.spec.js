const {
  abci: {
    ResponseDeliverTx,
  },
} = require('abci/types');
const {
  ApplyStateTransitionRequest,
} = require('@dashevo/drive-grpc');
const createDPPMock = require('@dashevo/dpp/lib/test/mocks/createDPPMock');
const cbor = require('cbor');

const deliverTxHandlerFactory = require('../../../lib/handlers/deliverTxHandlerFactory');
const AppStateMock = require('../../../lib/test/mock/AppStateMock');
const UpdateStateClientMock = require('../../../lib/test/mock/UpdateStateClientMock');
const getRequestTxFixture = require('../../../lib/test/fixtures/getRequestTxFixture');
const getStHeaderFixture = require('../../../lib/test/fixtures/getStHeaderFixture');
const getStPacketFixture = require('../../../lib/test/fixtures/getStPacketFixture');
const InvalidArgumentAbciError = require('../../../lib/handlers/errors/InvalidArgumentAbciError');
const AbciError = require('../../../lib/handlers/errors/AbciError');

describe('deliverTxHandlerFactory', () => {
  let deliverTxHandler;
  let appStateMock;
  let updateStateClientMock;
  let dppMock;
  let request;
  let stHeaderFixture;
  let stPacketFixture;
  let height;
  let blockHash;
  let requestTxFixture;

  beforeEach(function beforeEach() {
    stPacketFixture = getStPacketFixture();
    stHeaderFixture = getStHeaderFixture(stPacketFixture);
    requestTxFixture = getRequestTxFixture(stHeaderFixture, stPacketFixture);

    appStateMock = new AppStateMock(this.sinon);
    updateStateClientMock = new UpdateStateClientMock(this.sinon);
    dppMock = createDPPMock(this.sinon);
    dppMock.packet.createFromSerialized.resolves(stPacketFixture);
    dppMock.packet.validate.resolves({
      isValid: this.sinon.stub().returns(true),
    });
    dppMock.packet.verify.resolves({
      isValid: this.sinon.stub().returns(true),
    });

    deliverTxHandler = deliverTxHandlerFactory(dppMock, appStateMock, updateStateClientMock);

    request = {
      tx: requestTxFixture,
    };

    height = 1;
    blockHash = 'b8ae412cdeeb4bb39ec496dec34495ecccaf74f9fa9eaa712c77a03eb1994e75';

    appStateMock.getHeight.returns(height);
    appStateMock.getBlockHash.returns(blockHash);
  });

  it('should return valid result', async () => {
    const result = await deliverTxHandler(request);

    const applyStateTransitionRequest = new ApplyStateTransitionRequest();
    applyStateTransitionRequest.setBlockHeight(height);
    applyStateTransitionRequest.setBlockHash(blockHash);
    applyStateTransitionRequest.setStateTransitionPacket(stPacketFixture.serialize());
    applyStateTransitionRequest.setStateTransitionHeader(Buffer.from(stHeaderFixture.serialize(), 'hex'));

    expect(dppMock.packet.createFromSerialized).to.be.calledOnce();
    expect(dppMock.packet.validate).to.be.calledOnceWith(stPacketFixture);
    expect(dppMock.packet.verify).to.be.calledOnceWith(stPacketFixture, stHeaderFixture);
    expect(appStateMock.getHeight).to.be.calledOnce();
    expect(appStateMock.getBlockHash).to.be.calledOnce();
    expect(updateStateClientMock.applyStateTransition)
      .to.be.calledOnceWith(applyStateTransitionRequest);
    expect(result).to.be.an.instanceOf(ResponseDeliverTx);
  });

  it('should throw InvalidArgumentAbciError if stHeader is not specified', async () => {
    const decodedRequestTxFixture = cbor.decode(requestTxFixture);
    delete decodedRequestTxFixture.header;
    requestTxFixture = cbor.encode(decodedRequestTxFixture);
    request = {
      tx: requestTxFixture,
    };

    try {
      await deliverTxHandler(request);
      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('stHeader is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stPacket is not specified', async () => {
    const decodedRequestTxFixture = cbor.decode(requestTxFixture);
    delete decodedRequestTxFixture.packet;
    requestTxFixture = cbor.encode(decodedRequestTxFixture);
    request = {
      tx: requestTxFixture,
    };

    try {
      await deliverTxHandler(request);
      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('stPacket is not specified');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stHeader is invalid', async function main() {
    requestTxFixture = getRequestTxFixture({
      serialize: this.sinon.stub().returns(Buffer.alloc(8)),
    }, stPacketFixture);
    request = {
      tx: requestTxFixture,
    };

    try {
      await deliverTxHandler(request);
      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('stHeader is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stHeader hashSTPacket is not equal to stPacket hash', async () => {
    stHeaderFixture.extraPayload.setHashSTPacket('00'.repeat(32));
    requestTxFixture = getRequestTxFixture(stHeaderFixture, stPacketFixture);
    request = {
      tx: requestTxFixture,
    };

    try {
      await deliverTxHandler(request);
      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('stHeader hashSTPacket is not equal to stPacket hash');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stPacket is invalid', async function main() {
    dppMock.packet.validate.resolves({
      isValid: this.sinon.stub().returns(false),
      getErrors: this.sinon.stub(),
    });

    try {
      await deliverTxHandler(request);
      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('stPacket is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });

  it('should throw InvalidArgumentAbciError if stPacket and stHeader verification is failed', async function main() {
    dppMock.packet.verify.resolves({
      isValid: this.sinon.stub().returns(false),
      getErrors: this.sinon.stub(),
    });

    try {
      await deliverTxHandler(request);
      expect.fail('should throw InvalidArgumentAbciError error');
    } catch (e) {
      expect(e).to.be.instanceOf(InvalidArgumentAbciError);
      expect(e.getMessage()).to.equal('stPacket is invalid');
      expect(e.getCode()).to.equal(AbciError.CODES.INVALID_ARGUMENT);
    }
  });
});
