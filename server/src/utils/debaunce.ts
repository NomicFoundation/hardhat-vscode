/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-this-alias */

interface DebouncedFunction {
  (): any;
  cancel: () => void;
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// The first argument of the function will be used to run before clearTimeout the close function if it exists
export const debounce = <F extends (...args: any[]) => ReturnType<F>>(
  func: F,
  wait: number,
  immediate?: boolean
) => {
  let timeout: NodeJS.Timeout;
  let previousArgs: IArguments;

  const debounced: DebouncedFunction = function (this: void) {
    const context = this;
    const args = arguments;

    const later = function () {
      if (!immediate) {
        func.call(context, ...args);
      }
    };

    const callNow = immediate && !timeout;

    if (timeout) {
      if (
        previousArgs &&
        previousArgs[0] &&
        typeof previousArgs[0].close == "function"
      ) {
        previousArgs[0].close();
      }

      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
    previousArgs = args;

    if (callNow) {
      func.call(context, ...args);
    }
  };

  debounced.cancel = function () {
    const args = arguments;

    if (args[0] && typeof args[0].close == "function") {
      args[0].close();
    }

    clearTimeout(timeout);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};
