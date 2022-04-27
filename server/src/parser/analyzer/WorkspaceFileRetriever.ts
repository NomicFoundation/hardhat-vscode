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
    const relativePaths = await fg(globPattern, { cwd: baseUri, ignore });

    return relativePaths.map((rp) =>
      decodeUriAndRemoveFilePrefix(path.join(baseUri, rp))
    );
  }

  public async readFile(documentUri: string): Promise<string> {
    return (await fs.promises.readFile(documentUri)).toString();
  }
}
