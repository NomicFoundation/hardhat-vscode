import * as fs from "fs";
import * as path from "path";
import { Logger } from "@utils/Logger";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";

export class WorkspaceFileRetriever {
  public findSolFiles(
    base: string | undefined,
    documentsUri: string[],
    logger: Logger
  ): void {
    if (!base) {
      return;
    }

    try {
      const files = fs.readdirSync(base);

      files.forEach((file) => {
        const newBase = path.join(base || "", file);

        if (fs.statSync(newBase).isDirectory()) {
          this.findSolFiles(newBase, documentsUri, logger);
        } else if (
          newBase.slice(-4) === ".sol" &&
          newBase.split("node_modules").length < 3 &&
          !documentsUri.includes(newBase)
        ) {
          documentsUri.push(decodeUriAndRemoveFilePrefix(newBase));
        }
      });
    } catch (err) {
      logger.trace("Unable to scan directory: " + err);
    }
  }
}
