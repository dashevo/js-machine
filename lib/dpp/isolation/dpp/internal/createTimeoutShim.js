// This file is to use within the isolate. Please do not import this file outside of the isolate
require('setimmediate');

module.exports = function getSetImmediateFunction() {
  return setImmediate;
};
