import { window, extensions } from "vscode";
import { Logger } from "../utils/Logger";

const CONFLICTING_EXTENSION_ID = "juanblanco.solidity";
const CONFLICTING_EXTENSION_NAME = "solidity";

export async function warnOnOtherSolidityExtensions({
  logger,
}: {
  logger: Logger;
}) {
  const conflictingExtension = extensions.getExtension(
    CONFLICTING_EXTENSION_ID
  );

  if (conflictingExtension === undefined) {
    return;
  }

  try {
    await window.showWarningMessage(
      `Both this extension and the \`${CONFLICTING_EXTENSION_NAME}\` (${CONFLICTING_EXTENSION_ID}) extension are enabled. They have conflicting functionality. Disable one of them.`,
      "Okay"
    );
  } catch (err) {
    logger.error(err);
  }
}
