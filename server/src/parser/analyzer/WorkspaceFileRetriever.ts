import * as path from "path";
import * as fg from "fast-glob";
import { decodeUriAndRemoveFilePrefix } from "@utils/index";

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
}
