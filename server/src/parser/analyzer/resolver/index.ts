import * as path from "path";
import { exec, execSync } from "child_process";

import * as utils from "@common/utils";
import { ImportDirective } from "@common/types";

const DAPP_FILENAME = ".dapprc";

const dappRemapptingCache: { [path: string]: { [alias: string]: string } } = {};

export function resolveDependency(cwd: string, stopAt: string, importDirective: ImportDirective): string {
    const paths = [cwd];

    const resolvedPath = resolveDappDependency(cwd, stopAt, importDirective.path, paths);
    if (resolvedPath) {
        importDirective.path = resolvedPath;
    }

    return require.resolve(importDirective.path, { paths });
}

function resolveDappDependency(cwd: string, stopAt: string, importPath: string, paths: string[]): string | undefined {
    try {
        const dappFilePath = utils.findUpSync(DAPP_FILENAME, { cwd, stopAt });

        if (dappFilePath) {
            if (!dappRemapptingCache[dappFilePath]) {
                const output = execSync(`. ${path.resolve(dappFilePath, DAPP_FILENAME)} && echo $DAPP_REMAPPINGS`, { encoding: "utf-8" });
                const aliases = output.replace("\n", " ").trim().split(/\s+/);

                dappRemapptingCache[dappFilePath] = {};
                for (const alias of aliases) {
                    const aliasSplit = alias.split("=");
                    if (aliasSplit.length === 2) {
                        dappRemapptingCache[dappFilePath][aliasSplit[0]] = aliasSplit[1];
                    }
                }
            }

            for (const alias of Object.keys(dappRemapptingCache[dappFilePath])) {
                if (alias === importPath.slice(0, alias.length)) {
                    if (dappFilePath) {
                        paths.push(dappFilePath);
                    }

                    return path.resolve(dappRemapptingCache[dappFilePath][alias], importPath.slice(alias.length));
                }
            }
        }

        return undefined;
    } catch (err) {
        return undefined;
    }
}
