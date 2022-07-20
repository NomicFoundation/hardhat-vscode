import * as childProcess from "child_process";
import * as path from "path";
import { HardhatProject } from "@analyzer/HardhatProject";
import { Logger } from "@utils/Logger";
import {
  InitialisationCompleteMessage,
  InvalidatePreprocessingCacheMessage,
  ValidateCommand,
  ValidationCompleteMessage,
  WorkerProcess,
} from "../../types";

const UNINITIALIZED = "UNINITIALIZED";
const STARTING = "STARTING";
const RUNNING = "RUNNING";
const INITIALIZATION_ERRORED = "INITIALIZATION_ERRORED";

type HardhatWorkerStatus =
  | typeof UNINITIALIZED
  | typeof INITIALIZATION_ERRORED
  | typeof STARTING
  | typeof RUNNING;

export function createProcessFor(
  project: HardhatProject
): childProcess.ChildProcess {
  return childProcess.fork(path.resolve(__dirname, "worker.js"), {
    cwd: project.basePath,
    detached: true,
  });
}

export class HardhatWorker implements WorkerProcess {
  public project: HardhatProject;
  public status: HardhatWorkerStatus;
  public jobs: {
    [key: string]: {
      resolve: (message: ValidationCompleteMessage) => void;
      reject: (err: string) => void;
    };
  };

  private child: childProcess.ChildProcess | null;
  private createProcessFor: (
    project: HardhatProject
  ) => childProcess.ChildProcess;
  private logger: Logger;
  private jobCount: number;

  constructor(
    project: HardhatProject,
    givenCreateProcessFor: (
      project: HardhatProject
    ) => childProcess.ChildProcess,
    logger: Logger
  ) {
    this.child = null;
    this.jobCount = 0;
    this.jobs = {};

    this.project = project;
    this.createProcessFor = givenCreateProcessFor;
    this.logger = logger;

    this.status = UNINITIALIZED;
  }

  /**
   * Setup the background validation process along with listeners
   * on the LSP side.
   *
   * The status immediately moves from UNINITIALIZED -> STARTING. An
   * `INITIALISATION_COMPLETE` message from the process will move
   * the status to RUNNING (an unexpected exit will move it to
   * INITIALIZATION_ERRORED).
   */
  public init() {
    if (![UNINITIALIZED, INITIALIZATION_ERRORED].includes(this.status)) {
      throw new Error("Cannot start a worker thread that has already started");
    }

    this.status = STARTING;

    this.child = this.createProcessFor(this.project);

    // deal with messages sent from the background process to the LSP
    this.child.on(
      "message",
      (message: InitialisationCompleteMessage | ValidationCompleteMessage) => {
        switch (message.type) {
          case "INITIALISATION_COMPLETE":
            this.status = RUNNING;
            this.logger.trace(
              `initialisation complete for ${this.project.basePath}`
            );
            break;
          case "VALIDATION_COMPLETE":
            this._validationComplete(message);
            break;
          default:
            this._unexectpedMessage(message);
            break;
        }
      }
    );

    // errors on the background thread are logged
    this.child.on("error", (err) => {
      this.logger.error(err);
    });

    // if the background process exits due to an error
    // we restart if it has previously been running,
    // if exits during initialization, we leave it in
    // the errored state
    this.child.on("exit", this.handleExit.bind(this));
  }

  public async validate({
    uri,
    documentText,
    projectBasePath,
    openDocuments,
  }: {
    uri: string;
    documentText: string;
    projectBasePath: string;
    openDocuments: Array<{
      uri: string;
      documentText: string;
    }>;
  }) {
    return new Promise<ValidationCompleteMessage>((resolve, reject) => {
      const jobId = this.jobCount++;

      if (this.child === null) {
        return reject(new Error("No child process to send validation"));
      }

      if (this.status !== RUNNING) {
        return this._validationBlocked(
          { jobId, projectBasePath },
          resolve,
          reject
        );
      }

      this.jobs[jobId] = { resolve, reject };

      const message: ValidateCommand = {
        type: "VALIDATE",
        jobId,
        uri,
        documentText,
        projectBasePath,
        openDocuments,
      };

      this.child.send(message, (err) => {
        if (err) {
          delete this.jobs[jobId];
          return reject(err);
        }
      });
    });
  }

  /**
   * Inform the background validation process to clear its file caches
   * and reread the solidity files from disk on the next job.
   *
   * @returns whether the cace was cleared
   */
  public async invalidatePreprocessingCache(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.child === null) {
        return reject(
          new Error("No child process to send invalidate preprocessing cache")
        );
      }

      // Only running validators can have their cache cleared
      if (this.status !== RUNNING) {
        return resolve(false);
      }

      const message: InvalidatePreprocessingCacheMessage = {
        type: "INVALIDATE_PREPROCESSING_CACHE",
      };

      this.child?.send(message, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(true);
      });
    });
  }

  /**
   * Stop the current background validation process.
   *
   * The status will be set back to the unstarted state (UNINITIALIZED).
   */
  public kill() {
    this.child?.kill();
    // reset status to allow restarting in future
    this.status = UNINITIALIZED;
  }

  /**
   * Stop the current background validation process and start a new one.
   *
   * The jobs being currently processeded are all cancelled.
   */
  public async restart(): Promise<void> {
    this.logger.trace(`Restarting hardhat worker for ${this.project.basePath}`);

    this._cancelCurrentJobs();

    this.kill();
    this.init();
  }

  public handleExit(code: number | null, signal: NodeJS.Signals | null) {
    this.logger.trace(
      `Hardhat Worker Process restart (${code}): ${this.project.basePath}`
    );

    if (code === 0 || signal !== null) {
      this.status = UNINITIALIZED;
      this._cancelCurrentJobs();
      return;
    }

    if (this.status === STARTING) {
      this.status = INITIALIZATION_ERRORED;
      this._cancelCurrentJobs();
      return;
    }

    if (this.status !== RUNNING) {
      this.logger.error(
        new Error(
          "Exit from validator that is already UNINITIALIZED/INITIALIZATION_ERRORED"
        )
      );
      return;
    }

    return this.restart();
  }

  private _validationComplete(message: ValidationCompleteMessage) {
    if (!(message.jobId in this.jobs)) {
      this.logger.error("No job registered for validation complete");
      return;
    }

    const { resolve } = this.jobs[message.jobId];

    delete this.jobs[message.jobId];

    resolve(message);
  }

  private _unexectpedMessage(message: never) {
    this.logger.error(new Error(`Unexpected error type: ${message}`));
  }

  private _validationBlocked(
    { jobId, projectBasePath }: { jobId: number; projectBasePath: string },
    resolve: (
      value: ValidationCompleteMessage | PromiseLike<ValidationCompleteMessage>
    ) => void,
    _reject: (reason?: string) => void
  ): void {
    if (this.status === STARTING) {
      return resolve({
        type: "VALIDATION_COMPLETE",
        status: "VALIDATOR_ERROR",
        jobId,
        projectBasePath,
        reason: "validator-starting",
      });
    }

    if (this.status === "INITIALIZATION_ERRORED") {
      return resolve({
        type: "VALIDATION_COMPLETE",
        status: "VALIDATOR_ERROR",
        jobId,
        projectBasePath,
        reason: "validator-initialization-failed",
      });
    }

    return resolve({
      type: "VALIDATION_COMPLETE",
      status: "VALIDATOR_ERROR",
      jobId,
      projectBasePath,
      reason: "validator-in-unexpected-state",
    });
  }

  /**
   * Reject any open jobs whose result is still promised.
   */
  private _cancelCurrentJobs() {
    for (const jobId of Object.keys(this.jobs)) {
      const { reject } = this.jobs[jobId];
      reject("Worker process restarted");

      delete this.jobs[jobId];
    }
  }
}
