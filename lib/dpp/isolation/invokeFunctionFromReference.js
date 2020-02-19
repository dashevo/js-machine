async function invokeFunctionFromReference(referencePath, methodName, args, options) {
  const properties = referencePath.split('.');
  let objectReference;

  for (const property of properties) {
    if (!objectReference) {
      objectReference = global[property];
    } else {
      objectReference = await objectReference.get(property);
    }
  }

  const methodReference = objectReference
    ? await objectReference.get(methodName)
    : global[methodName];

  return methodReference.apply(
    objectReference.derefInto(),
    args,
    options,
  );
}

module.exports = invokeFunctionFromReference;
