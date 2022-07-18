/* istanbul ignore file: wrapper around process */
import * as path from "path";
import * as childProcess from "child_process";
import { HardhatProject } from "@analyzer/HardhatProject";
import { Logger } from "@utils/Logger";
import {
  InvalidatePreprocessingCacheMessage,
  ValidateCommand,
  ValidationCompleteMessage,
  WorkerProcess,
} from "../../types";

export class HardhatWorker implements WorkerProcess {
  public project: HardhatProject;
  private child: childProcess.ChildProcess | null;
  private logger: Logger;
  private jobCount: number;

  private jobs: {
    [key: string]: {
      resolve: (message: ValidationCompleteMessage) => void;
      reject: (err: string) => void;
    };
  };

  constructor(project: HardhatProject, logger: Logger) {
    this.project = project;
    this.child = null;
    this.jobCount = 0;
    this.jobs = {};
    this.logger = logger;
  }

  public init() {
    this.child = childProcess.fork(path.resolve(__dirname, "worker.js"), {
      cwd: this.project.basePath,
      detached: true,
    });

    this.child.on("message", (message: ValidationCompleteMessage) => {
      if (!(message.jobId in this.jobs)) {
        this.logger.error("No job registered for validation complete");
        return;
      }

      const { resolve } = this.jobs[message.jobId];

      delete this.jobs[message.jobId];

      resolve(message);
    });

    this.child.on("error", (err) => {
      this.logger.error(err);
    });

    this.child.on("exit", (code, signal) => {
      this.logger.trace(
        `Hardhat Worker Process restart (${code}): ${this.project.basePath}`
      );

      if (code === 0 || signal !== null) {
        return;
      }

      return this.restart();
    });
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

  public async invalidatePreprocessingCache(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.child === null) {
        return reject(
          new Error("No child process to send invalidate preprocessing cache")
        );
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

  public kill() {
    this.child?.kill();
  }

  public async restart(): Promise<void> {
    for (const jobId of Object.keys(this.jobs)) {
      const { reject } = this.jobs[jobId];
      reject("Worker process restarted");

      delete this.jobs[jobId];
    }

    this.kill();
    this.init();
  }
}
