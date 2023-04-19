/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */

// Useful for tracking execution times and spotting performance issues
class Benchmark {
  public startTimes: number[] = [];

  public async benchmark(span: string, f: () => Promise<any>) {
    this.start(span);
    let retVal;
    let error;

    try {
      retVal = await f();
    } catch (err) {
      error = err;
    }

    this.end();

    if (error === undefined) {
      return retVal;
    } else {
      throw error;
    }
  }

  public start(span: string) {
    console.log(`${this._indentation()}Start: ${span}`);
    this.startTimes.push(new Date().getTime());
  }

  public end() {
    const startTime = this.startTimes.pop();
    const endTime = new Date().getTime();
    console.log(`${this._indentation()}${endTime - startTime!} ms`);
  }

  private _indentation() {
    return " ".repeat(this.startTimes.length * 2);
  }
}

const benchmark = new Benchmark();

export default benchmark;
