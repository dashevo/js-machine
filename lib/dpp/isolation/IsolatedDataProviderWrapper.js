// This class wraps external reference to data provider for the isolate
const Identity = require('@dashevo/dpp/lib/identity/Identity');
const Document = require('@dashevo/dpp/lib/document/Document');
const createDataContract = require('@dashevo/dpp/lib/dataContract/createDataContract');

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

    const rawDataContract = await toJSONReference.apply(
      dataContractReference.derefInto(),
      [],
      { result: { copy: true } },
    );

    return createDataContract(rawDataContract);
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

    const rawIdentity = await toJSONReference.apply(
      identityReference.derefInto(),
      [],
      { result: { copy: true } },
    );

    return new Identity(rawIdentity);
  }

  async fetchDocuments(...args) {
    const documentsReference = await this.callMethodFromReference(
      DATA_PROVIDER_METHODS.FETCH_DOCUMENTS, ...args,
    );

    const documentsLength = await documentsReference.get('length');
    const documents = [];

    for (let i = 0; i < documentsLength; i++) {
      const documentReference = await documentsReference.get(`${i}`);
      const documentToJSONReference = await documentReference.get('toJSON');
      const rawDocument = await documentToJSONReference.apply(
        documentReference.derefInto(), [], { result: { copy: true } },
      );
      documents.push(new Document(rawDocument));
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
