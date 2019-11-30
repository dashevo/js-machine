/**
 * http://cw.hubwiz.com/card/c/tendermint-rpc-api/1/1/16/
 * @return {string}
 */
module.exports = function getTxSearchResponse() {
  return '{ "jsonrpc": "2.0", "id": "", "result": { "txs": [ { "proof": { "Proof": { "aunts": [ "J3LHbizt806uKnABNLwG4l7gXCA=", "iblMO/M1TnNtlAefJyNCeVhjAb0=", "iVk3ryurVaEEhdeS0ohAJZ3wtB8=", "5hqMkTeGqpct51ohX0lZLIdsn7Q=", "afhsNxFnLlZgFDoyPpdQSe0bR8g=" ] }, "Data": "mvZHHa7HhZ4aRT0xMDA=", "RootHash": "F6541223AA46E428CB1070E9840D2C3DF3B6D776", "Total": "32", "Index": "31" }, "tx": "mvZHHa7HhZ4aRT0xMDA=", "tx_result": {}, "index": "31", "height": "12", "hash": "2B8EC32BA2579B3B8606E42C06DE2F7AFA2556EF" } ], "total_count": "12" } }';
};
