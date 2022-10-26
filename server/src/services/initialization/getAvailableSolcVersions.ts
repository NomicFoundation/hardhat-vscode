import _ from "lodash";
import got from "got";
import { ServerState } from "../../types";

const availableVersions = [
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
];

export async function getAvailableSolcVersions(state: ServerState) {
  const latestVersions = await fetchLatestVersions();

  state.solcVersions = _.union(availableVersions, latestVersions);
}

interface VersionsResponse {
  builds: Array<{ version: string }>;
}
async function fetchLatestVersions() {
  try {
    const data: VersionsResponse = await got
      .get("https://binaries.soliditylang.org/wasm/list.json", {
        timeout: 2000,
      })
      .json();

    return _.map(data.builds, "version");
  } catch (error) {
    return [];
  }
}
