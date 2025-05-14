/**
 * A class that implements an asynchronous mutex (mutual exclusion) lock.
 *
 * The mutex ensures that only one asynchronous operation can be executed at a time,
 * providing exclusive access to a shared resource.
 */
export class AsyncMutex {
  #acquired = false;
  readonly #queue: Array<() => void> = [];

  /**
   * Aquires the mutex, running the provided function exclusively,
   * and releasing it afterwards.
   *
   * @param f The function to run.
   * @returns The result of the function.
   */
  public async exclusiveRun<ReturnT>(
    f: () => ReturnT
  ): Promise<Awaited<ReturnT>> {
    const release = await this.#acquire();

    try {
      /* eslint-disable-next-line @typescript-eslint/return-await, @typescript-eslint/await-thenable -- We want to make sure that we await the result if it's a promise, and that the finally is run after it */
      return await f();
    } finally {
      await release();
    }
  }

  /**
   * Aquires the mutex, returning a function that releases it.
   */
  async #acquire(): Promise<() => Promise<void>> {
    if (!this.#acquired) {
      this.#acquired = true;
      return async () => {
        this.#acquired = false;
        const next = this.#queue.shift();
        if (next !== undefined) {
          next();
        }
      };
    }

    return new Promise<() => Promise<void>>((resolve) => {
      this.#queue.push(() => {
        resolve(this.#acquire());
      });
    });
  }
}
