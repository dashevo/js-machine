const NUMBER_SIZE_IN_BYTES = 64 / 8;

/**
 *
 * @param {number} sizeInBytes - size of memory to allocate
 * @returns {number[]} - result of the allocation - array filled with random doubles
 */
module.exports = function allocateRandomMemory(sizeInBytes) {
  const storage = [];
  while ((storage.length * NUMBER_SIZE_IN_BYTES) < sizeInBytes) {
    storage.push(Math.random());
  }
  return storage;
};
