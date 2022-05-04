import * as path from "path";
import * as childProcess from "child_process";
import { HardhatProject } from "@analyzer/HardhatProject";
import { Logger } from "@utils/Logger";
import { HardhatCompilerError, WorkerProcess } from "../../types";

interface ValidationCompleteMessage {
  type: "VALIDATION_COMPLETE";
  jobId: number;
  errors: HardhatCompilerError[];
}

export class HardhatWorker implements WorkerProcess {
  public project: HardhatProject;
  private child: childProcess.ChildProcess | null;
  private logger: Logger;
  private jobCount: number;

  // eslint-disable-next-line @typescript-eslint/ban-types
  private jobs: { [key: string]: { resolve: Function; reject: Function } };

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

      resolve({ errors: message.errors });
    });
  }

  public async validate({
    uri,
    documentText,
    unsavedDocuments,
  }: {
    uri: string;
    documentText: string;
    unsavedDocuments: Array<{
      uri: string;
      documentText: string;
    }>;
  }) {
    return new Promise<{ errors: HardhatCompilerError[] }>(
      (resolve, reject) => {
        const jobId = this.jobCount++;

        this.jobs[jobId] = { resolve, reject };

        this.child?.send(
          {
            type: "VALIDATE",
            jobId,
            uri,
            documentText,
            unsavedDocuments,
          },
          (err) => {
            if (err) {
              delete this.jobs[jobId];
              return reject(err);
            }
          }
        );
      }
    );
  }

  public kill() {
    this.child?.kill();
  }
}
