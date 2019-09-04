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
  let lastThis;
  let lastArgs = [];
  let lastResult;
  let calledOnce = false;

  function memoized() {
    let newArgs = [];
    for (let _i = 0; _i < arguments.length; _i++) {
      newArgs[_i] = arguments[_i];
    }
    if (calledOnce && lastThis === this && areInputsEqual(newArgs, lastArgs)) {
      return lastResult;
    }
    lastResult = resultFn.apply(this, newArgs);
    calledOnce = true;
    lastThis = this;
    lastArgs = newArgs;
    return lastResult;
  }

  return memoized as any;
}
