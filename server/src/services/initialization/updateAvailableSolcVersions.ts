import _ from "lodash";
import got from "got";
import semver from "semver";
import { ServerState } from "../../types";
import { isTestMode } from "../../utils";

export const availableVersions = [
  "0.3.6",
  "0.4.0",
  "0.4.1",
  "0.4.2",
  "0.4.3",
  "0.4.4",
  "0.4.5",
  "0.4.6",
  "0.4.7",
  "0.4.8",
  "0.4.9",
  "0.4.10",
  "0.4.11",
  "0.4.12",
  "0.4.13",
  "0.4.14",
  "0.4.15",
  "0.4.16",
  "0.4.17",
  "0.4.18",
  "0.4.19",
  "0.4.20",
  "0.4.21",
  "0.4.22",
  "0.4.23",
  "0.4.24",
  "0.4.25",
  "0.4.26",
  "0.5.0",
  "0.5.1",
  "0.5.2",
  "0.5.3",
  "0.5.4",
  "0.5.5",
  "0.5.6",
  "0.5.7",
  "0.5.8",
  "0.5.9",
  "0.5.10",
  "0.5.11",
  "0.5.12",
  "0.5.13",
  "0.5.14",
  "0.5.15",
  "0.5.16",
  "0.5.17",
  "0.6.0",
  "0.6.1",
  "0.6.2",
  "0.6.3",
  "0.6.4",
  "0.6.5",
  "0.6.6",
  "0.6.7",
  "0.6.8",
  "0.6.9",
  "0.6.10",
  "0.6.11",
  "0.6.12",
  "0.7.0",
  "0.7.1",
  "0.7.2",
  "0.7.3",
  "0.7.4",
  "0.7.5",
  "0.7.6",
  "0.8.0",
  "0.8.1",
  "0.8.2",
  "0.8.3",
  "0.8.4",
  "0.8.5",
  "0.8.6",
  "0.8.7",
  "0.8.8",
  "0.8.9",
  "0.8.10",
  "0.8.11",
  "0.8.12",
  "0.8.13",
  "0.8.14",
  "0.8.15",
  "0.8.16",
  "0.8.17",
  "0.8.18",
  "0.8.19",
  "0.8.20",
  "0.8.21",
  "0.8.22",
  "0.8.23",
  "0.8.24",
  "0.8.25",
  "0.8.26",
  "0.8.27",
  "0.8.28",
  "0.8.29",
  "0.8.30",
  "0.8.31",
  "0.8.32",
  "0.8.33",
  "0.8.34",
  "0.8.35",
  "0.8.36",
];

export async function updateAvailableSolcVersions(state: ServerState) {
  if (isTestMode()) {
    return;
  }

  state.logger.info("Fetching latest solidity versions");

  const latestVersions = await fetchLatestVersions(state);

  state.solcVersions = _.union(availableVersions, latestVersions);
}

interface VersionsResponse {
  // Every build, including pre-releases. A pre-release build carries the
  // version it is a pre-release *of*, so mapping over this yields versions that
  // have not been released yet.
  builds?: Array<{ version?: string; prerelease?: unknown }>;
  // Released versions only, keyed by version.
  releases?: Record<string, string>;
}

async function fetchLatestVersions(state: ServerState) {
  try {
    const data: VersionsResponse = await got
      .get("https://binaries.soliditylang.org/wasm/list.json", {
        timeout: 2000,
      })
      .json();

    return releasedVersionsFrom(data);
  } catch (error) {
    state.telemetry.captureException(error);

    return [];
  }
}

/**
 * Filter to released versions only (ignore pre-released versions).
 *
 * Exported for testing only.
 */
export function releasedVersionsFrom(data: VersionsResponse): string[] {
  if (data?.releases !== undefined && !Array.isArray(data.releases)) {
    return onlyValidVersions(Object.keys(data.releases));
  }

  // Older/alternative payloads without a `releases` map.
  const builds = Array.isArray(data?.builds) ? data.builds : [];

  // Truthiness rather than `!== undefined`: the field is absent on releases,
  // but null or "" would otherwise read as "not a pre-release".
  return onlyValidVersions(
    builds.filter((build) => !build?.prerelease).map((build) => build?.version)
  );
}

function onlyValidVersions(versions: Array<string | undefined>): string[] {
  return versions.flatMap((version) => {
    const normalized = version === undefined ? null : semver.valid(version);

    return normalized === null ? [] : [normalized];
  });
}
