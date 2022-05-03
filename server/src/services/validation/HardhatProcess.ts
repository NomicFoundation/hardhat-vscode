import * as path from "path";
import * as childProcess from "child_process";
import * as utils from "@common/utils";
import { Logger } from "@utils/Logger";
import {
  COMPILER_DOWNLOADED_EVENT,
  HARDHAT_CONFIG_FILE_EXIST_EVENT,
  HARDHAT_PROCESS_ERROR,
  SOLIDITY_COMPILE_EVENT,
} from "./events";
import { CancelResolver, CompilerProcess } from "../../types";
import { HardhatProject } from "@analyzer/HardhatProject";

export class HardhatProcess implements CompilerProcess {
  private project: HardhatProject;
  private uri: string;
  private child: null | childProcess.ChildProcess;
  private cancelResolver: CancelResolver;
  private logger: Logger;

  constructor(
    project: HardhatProject,
    uri: string,
    cancelResolver: CancelResolver,
    logger: Logger
  ) {
    this.project = project;
    this.uri = uri;
    this.child = null;
    this.cancelResolver = cancelResolver;
    this.logger = logger;
  }

  init() {
    const projectRoot = utils.findUpSync("package.json", {
      cwd: path.resolve(this.uri, ".."),
      stopAt: this.project.basePath,
    });

    this.child = childProcess.fork(path.resolve(__dirname, "helper.js"), {
      cwd: projectRoot,
      detached: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hardhatConfigFileExistPromiseResolver: any;
    const hardhatConfigFileExistPromise = new Promise((resolve) => {
      hardhatConfigFileExistPromiseResolver = resolve;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let compilerDownloadedPromiseResolver: any;
    const compilerDownloadedPromise = new Promise((resolve) => {
      compilerDownloadedPromiseResolver = resolve;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let solidityCompilePromiseResolver: any;
    const solidityCompilePromise = new Promise((resolve) => {
      solidityCompilePromiseResolver = resolve;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.child.on("message", (data: any) => {
      switch (data.type) {
        case HARDHAT_CONFIG_FILE_EXIST_EVENT:
          hardhatConfigFileExistPromiseResolver(data.exist);
          break;

        case COMPILER_DOWNLOADED_EVENT:
          compilerDownloadedPromiseResolver(data.isCompilerDownloaded);
          break;

        case SOLIDITY_COMPILE_EVENT:
          solidityCompilePromiseResolver(data.output);
          break;

        case HARDHAT_PROCESS_ERROR:
          this.cancelWithError(data.err);
          break;

        default:
          break;
      }
    });

    return {
      hardhatConfigFileExistPromise,
      compilerDownloadedPromise,
      solidityCompilePromise,
    };
  }

  send(message: childProcess.Serializable) {
    this.child?.send(message);
  }

  kill() {
    this.child?.kill();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cancelWithError(err: any) {
    this.logError(err);
    this.cancelResolver([]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logError(err: any) {
    if (!err) {
      return;
    }

    if (err._isHardhatError) {
      this.logger.error(new Error(err.errorDescriptor?.title));
      return;
    }

    this.logger.error(err);

    this.cancelResolver([]);
  }
}
