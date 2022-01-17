function waitUntilInternal(
  resolve: (value: unknown) => void,
  reject: (value: unknown) => void,
  predicate: () => boolean,
  increment: number,
  timeout: number
) {
  if (predicate()) {
    return resolve(true);
  } else {
    if (timeout <= 0) {
      return reject(false);
    }

    setTimeout(
      () =>
        waitUntilInternal(
          resolve,
          reject,
          predicate,
          increment,
          timeout - increment
        ),
      increment
    );
  }
}

export function waitUntil(
  predicate: () => boolean,
  increment: number,
  timeout: number
) {
  return new Promise((resolve, reject) => {
    waitUntilInternal(resolve, reject, predicate, increment, timeout);
  });
}
