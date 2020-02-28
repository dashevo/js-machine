// This class wraps external reference to data provider for the isolate
const DashPlatformProtocol = require('@dashevo/dpp');
const Document = require('@dashevo/dpp/lib/document/Document');
const { Transaction } = require('@dashevo/dashcore-lib');

const DATA_PROVIDER_METHODS = {
  FETCH_DATA_CONTRACT: 'fetchDataContract',
  FETCH_IDENTITY: 'fetchIdentity',
  FETCH_DOCUMENTS: 'fetchDocuments',
  FETCH_TRANSACTION: 'fetchTransaction',
};

class IsolatedDataProviderWrapper {
  /**
   * @param {DataProvider} dataProviderExternalReference
   */
  constructor(dataProviderExternalReference) {
    this.internalDpp = new DashPlatformProtocol();
    this.dataProviderExternalReference = dataProviderExternalReference;
  }

  async callMethodFromReference(methodName, ...args) {
    const methodReference = await this.dataProviderExternalReference.get(methodName);

    return methodReference.apply(
      this.dataProviderExternalReference.derefInto(),
      args,
      { arguments: { copy: true }, result: { promise: true } },
    );
  }

  /**
   * Fetch Contract by ID
   *
   * @param {string} id
   * @return {Promise<DataContract|null>}
   */
  async fetchDataContract(id) {
    const dataContractReference = await this.callMethodFromReference(
      DATA_PROVIDER_METHODS.FETCH_DATA_CONTRACT, id,
    );
    if (!dataContractReference) {
      return null;
    }

    const toJSONReference = await dataContractReference.get('toJSON');

    const dataContractJSON = await toJSONReference.apply(
      dataContractReference.derefInto(),
      [],
      { result: { copy: true } },
    );

    return this.internalDpp.dataContract.createFromObject(
      dataContractJSON, { skipValidation: true },
    );
  }

  /**
   *  Fetch Identity by id, including unconfirmed ones
   *
   * @param {string} id
   * @return {Promise<null|Identity>}
   */
  async fetchIdentity(id) {
    const identityReference = await this.callMethodFromReference(
      DATA_PROVIDER_METHODS.FETCH_IDENTITY, id,
    );
    if (!identityReference) {
      return null;
    }
    const toJSONReference = await identityReference.get('toJSON');

    const identityJSON = await toJSONReference.apply(
      identityReference.derefInto(),
      [],
      { result: { copy: true } },
    );

    return this.internalDpp.identity.createFromObject(
      identityJSON, { skipValidation: true },
    );
  }

  async fetchDocuments(...args) {
    const documentsReference = await this.callMethodFromReference(
      DATA_PROVIDER_METHODS.FETCH_DOCUMENTS, ...args,
    );

    const docuemntsLength = await documentsReference.get('length');
    const documents = [];

    for (let i = 0; i < docuemntsLength; i++) {
      const documentReference = await documentsReference.get(`${i}`);
      const documentToJSONReference = await documentReference.get('toJSON');
      const documentJSON = await documentToJSONReference.apply(
        documentReference.derefInto(), [], { result: { copy: true } },
      );
      documents.push(new Document(documentJSON));
    }
    return documents;
  }

  /**
   * Fetches transaction for a given id
   * @param args
   * @param {string} args.id
   * @returns {Promise<null|Transaction>}
   */
  async fetchTransaction(...args) {
    const transactionReference = await this.callMethodFromReference(
      DATA_PROVIDER_METHODS.FETCH_TRANSACTION, ...args,
    );

    if (!transactionReference) {
      return null;
    }
    const serializeReference = await transactionReference.get('serialize');

    const rawTransaction = await serializeReference.apply(
      transactionReference.derefInto(),
      [true],
      { arguments: { copy: true } }, { result: { copy: true } },
    );

    return new Transaction(rawTransaction);
  }
}

module.exports = IsolatedDataProviderWrapper;
