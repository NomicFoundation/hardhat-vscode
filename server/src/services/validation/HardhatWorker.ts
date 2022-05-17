import * as path from "path";
import * as childProcess from "child_process";
import { HardhatProject } from "@analyzer/HardhatProject";
import { Logger } from "@utils/Logger";
import { ValidationCompleteMessage, WorkerProcess } from "../../types";

export class HardhatWorker implements WorkerProcess {
  public project: HardhatProject;
  private child: childProcess.ChildProcess | null;
  private logger: Logger;
  private jobCount: number;

  private jobs: {
    [key: string]: {
      resolve: (message: ValidationCompleteMessage) => void;
      reject: () => void;
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

      resolve(message);
    });
  }

  public async validate({
    uri,
    documentText,
    openDocuments,
  }: {
    uri: string;
    documentText: string;
    openDocuments: Array<{
      uri: string;
      documentText: string;
    }>;
  }) {
    return new Promise<ValidationCompleteMessage>((resolve, reject) => {
      const jobId = this.jobCount++;

      this.jobs[jobId] = { resolve, reject };

      this.child?.send(
        {
          type: "VALIDATE",
          jobId,
          uri,
          documentText,
          openDocuments,
        },
        (err) => {
          if (err) {
            delete this.jobs[jobId];
            return reject(err);
          }
        }
      );
    });
  }

  public kill() {
    this.child?.kill();
  }

  public async restart(): Promise<void> {
    this.kill();
    this.init();
  }
}
