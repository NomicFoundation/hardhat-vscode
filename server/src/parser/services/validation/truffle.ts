import * as path from "path";
import {
  TextDocument,
  Diagnostic,
  Range,
  DiagnosticSeverity,
} from "@common/types";

const Resolver = require("@truffle/resolver");
const { Compile } = require("@truffle/compile-solidity");
const Config = require("@truffle/config");

export async function truffleValidator(
  uri: string,
  document: TextDocument
): Promise<{ [uri: string]: Diagnostic[] }> {
  try {
    // TypeScript forces to check send method on existence
    if (process.send) {
      const cfg = Config.detect({ workingDirectory: path.resolve(uri, "..") });
      cfg.resolver = new Resolver(cfg);
      try {
        await Compile.necessary(cfg);
      } catch (err: any) {
        if (err && err.name === "CompileError") {
          const splittedMessage = err.message.split("\n");
          const rawMessage = splittedMessage[0].split(": ");
          const message = rawMessage[1] + ": " + rawMessage[2];
          const splittedLocation = rawMessage[0].split(":");
          const relativePath =
            splittedLocation[1].charAt(0) === "/"
              ? splittedLocation[1].slice(1)
              : splittedLocation[1];
          const startLine = splittedLocation[2] - 1;
          const startCharacter = splittedLocation[3] - 1;

          return {
            [relativePath]: [
              <Diagnostic>{
                source: document.languageId,
                severity: message.split(":")[0].toLowerCase().includes("error")
                  ? DiagnosticSeverity.Error
                  : DiagnosticSeverity.Warning,
                message: message,
                range: Range.create(
                  {
                    line: +startLine,
                    character: +startCharacter,
                  },
                  {
                    line: +startLine,
                    character:
                      +startCharacter + splittedMessage[2].trim().length,
                  }
                ),
              },
            ],
          };
        }
      }
    }

    return Promise.resolve({});
  } catch (err) {
    process.exit(1);
  }
}
