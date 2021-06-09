import * as fs from "fs";
import * as path from "path";

import { projectRootPath } from "./finder";

export function findNodeModules(fromURI: string): string | undefined {
    let nodeModulesPath = path.join(fromURI, "..", "node_modules");

    while (projectRootPath && nodeModulesPath.includes(projectRootPath) && !fs.existsSync(nodeModulesPath)) {
        nodeModulesPath = path.join(nodeModulesPath, "..", "..", "node_modules");
    }

    if (fs.existsSync(nodeModulesPath)) {
        return nodeModulesPath;
    }

    return undefined;
}
