import path from "path";
import fg from "fast-glob";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";
import fs from "fs";

export class WorkspaceFileRetriever {
  public async findFiles(
    baseUri: string,
    globPattern: string,
    ignore: string[] = []
  ): Promise<string[]> {
    const relativePaths = await fg(globPattern, {
      cwd: baseUri,
      ignore,
      followSymbolicLinks: false,
    });

    return relativePaths.map((rp) =>
      decodeUriAndRemoveFilePrefix(path.join(baseUri, rp))
    );
  }

  public async fileExists(documentUri: string): Promise<boolean> {
    try {
      await fs.promises.access(documentUri, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  public async readFile(documentUri: string): Promise<string> {
    return (await fs.promises.readFile(documentUri)).toString();
  }
}
