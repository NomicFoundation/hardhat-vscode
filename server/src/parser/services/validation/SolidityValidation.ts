import * as path from "path";
import * as fs from "fs";

import * as utils from "@common/utils";
import { Analyzer } from "@analyzer/index";
import { TextDocument, Diagnostic } from "@common/types";
import { ValidationJob, validationJobOptions } from "./types";
import { hardhatValidator } from "./hardhat";
import { truffleValidator } from "./truffle";

const HARDHAT_CONFIG_FILE_JS = "hardhat.config.js";
const HARDHAT_CONFIG_FILE_TS = "hardhat.config.ts";

const TRUFFLE_CONFIG_FILE_JS = "truffle-config.js";
const TRUFFLE_CONFIG_FILE_TS = "truffle-config.ts";

export class SolidityValidation {
  analyzer: Analyzer;

  constructor(analyzer: Analyzer) {
    this.analyzer = analyzer;
  }

  public getValidationJob(uri: string): ValidationJob {
    const options: validationJobOptions = {
      isCompilerDownloaded: true,
    };

    let canceledResolver: any;
    const canceled = new Promise((resolve) => {
      canceledResolver = resolve;
    });

    return {
      run: async (
        uri: string,
        document: TextDocument,
        unsavedDocuments: TextDocument[]
      ): Promise<{ [uri: string]: Diagnostic[] }> => {
        const projectRoot = utils.findUpSync("package.json", {
          cwd: path.resolve(uri, ".."),
          stopAt: this.analyzer.rootPath,
        });
        if (!projectRoot) {
          return Promise.resolve({});
        }

        if (
          fs.existsSync(path.resolve(projectRoot, HARDHAT_CONFIG_FILE_JS)) ||
          fs.existsSync(path.resolve(projectRoot, HARDHAT_CONFIG_FILE_TS))
        ) {
          return hardhatValidator(
            projectRoot,
            uri,
            document,
            unsavedDocuments,
            options,
            canceled
          );
        }

        if (
          fs.existsSync(path.resolve(projectRoot, TRUFFLE_CONFIG_FILE_JS)) ||
          fs.existsSync(path.resolve(projectRoot, TRUFFLE_CONFIG_FILE_TS))
        ) {
          return truffleValidator(uri, document);
        }

        return Promise.resolve({});
      },

      close: async () => {
        if (!options.isCompilerDownloaded) {
          return;
        }

        canceledResolver([]);
      },
    } as ValidationJob;
  }
}
