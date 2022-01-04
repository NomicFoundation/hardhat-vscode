import * as path from "path";
import * as childProcess from "child_process";
import * as utils from "@common/utils";
import {
  COMPILER_DOWNLOADED_EVENT,
  HARDHAT_CONFIG_FILE_EXIST_EVENT,
  SOLIDITY_COMPILE_EVENT,
} from "./events";

export interface CompilerProcess {
  init: () => {
    hardhatConfigFileExistPromise: Promise<unknown>;
    compilerDownloadedPromise: Promise<unknown>;
    solidityCompilePromise: Promise<unknown>;
  };

  send: (message: childProcess.Serializable) => void;
  kill: () => void;
}

export class HardhatProcess implements CompilerProcess {
  private rootPath: string;
  private uri: string;
  private child: null | childProcess.ChildProcess;

  constructor(rootPath: string, uri: string) {
    this.rootPath = rootPath;
    this.uri = uri;
    this.child = null;
  }

  init() {
    const projectRoot = utils.findUpSync("package.json", {
      cwd: path.resolve(this.uri, ".."),
      stopAt: this.rootPath,
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
    // Then using process.kill(pid) method on main process we can kill all processes that are in
    // the same group of a child process with the same pid group.
    this.child?.kill(this.child.pid);
  }
}
