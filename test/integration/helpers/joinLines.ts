"use strict";
import * as os from "os";

/**
 * OS-independant line joining
 */

export const joinLines = (...args: string[]) =>
  args.join(os.platform() === "win32" ? "\r\n" : "\n");
