import got from "got";
import crypto from "crypto";
import { ServerState } from "../../types";

export interface FeatureFlag {
  percent: number;
}

export interface FeatureFlags {
  semanticHighlighting: FeatureFlag;
  documentSymbol: FeatureFlag;
}

const DEFAULT_FLAGS: FeatureFlags = {
  semanticHighlighting: {
    percent: 0,
  },
  documentSymbol: {
    percent: 0,
  },
};

export async function fetchFeatureFlags(
  state: ServerState
): Promise<FeatureFlags> {
  state.logger.info("Fetching feature flags");

  try {
    return await got
      .get(
        "https://raw.githubusercontent.com/antico5/hardhat-vscode/flags/flags.json",
        {
          timeout: 2000,
        }
      )
      .json();
  } catch (error) {
    state.telemetry.captureException(error);
    return DEFAULT_FLAGS;
  }
}

export function isFeatureEnabled(
  { logger }: ServerState,
  flags: FeatureFlags,
  feature: keyof FeatureFlags,
  machineId?: string
): boolean {
  const flag = flags[feature];

  if (machineId === undefined) {
    logger.info(`MachineId is undefined, turning feature flags off`);
    return false;
  }

  if (flag === undefined) {
    throw new Error(`Feature flag not found: ${feature}`);
  }

  // hash the machineId to get an evenly distributed value
  const machineIdHash = crypto.createHash("md5");
  machineIdHash.update(machineId);
  const digest = machineIdHash.digest("hex").slice(-4); // get last 2 bytes

  // check what percentile the current machineId is in
  const numberDigest = parseInt(digest, 16);
  const percentile = numberDigest / 65536;
  const enabled = percentile < flag.percent;

  return enabled;
}
