/* tslint:disable */
function areInputsEqual(newInputs: any[], lastInputs: any[]) {
  if (newInputs.length !== lastInputs.length) {
    return false;
  }

  for (let i = 0; i < newInputs.length; i++) {
    if (newInputs[i] !== lastInputs[i]) {
      return false;
    }
  }

  return true;
}

export function memoizeOne<T extends () => any>(resultFn: T): T {
  let lastArgs: any[] = [];
  let lastResult: any;
  let calledOnce = false;

  function memoized() {
    const newArgs = [];

    for (let _i = 0; _i < arguments.length; _i++) {
      // eslint-disable-next-line prefer-rest-params
      newArgs[_i] = arguments[_i];
    }

    if (calledOnce && areInputsEqual(newArgs, lastArgs)) {
      return lastResult;
    }

    // eslint-disable-next-line prefer-spread
    lastResult = resultFn.apply(undefined, newArgs as any);
    calledOnce = true;
    lastArgs = newArgs;

    return lastResult;
  }

  return memoized as any;
}
