import * as os from "os";
import * as qs from "qs";
import * as path from "path";
import * as fs from "fs-extra";
import got from "got";
import { v4 as uuid } from "uuid";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pjson = require("../../../package.json");

// VERY IMPORTANT:
// The documentation doesn't say so, but the user-agent parameter is required (ua).
// If you don't send it, you won't get an error or anything, Google will *silently* drop your hit.
//
// https://stackoverflow.com/questions/27357954/google-analytics-measurement-protocol-not-working
interface DefaultRawAnalyticsPayload {
  v: "1";
  tid: string;
  ua: string;
  cid: string;
  t: string;
  dp: string;
  cd1: string;
}

interface RawAnalyticsPayload {
  // Specifies the time it took for a page to load. The value is in milliseconds.
  plt?: number;
}

interface AnalyticsPayload
  extends DefaultRawAnalyticsPayload,
    RawAnalyticsPayload {}

type AnalyticsData = {
  clientId: string;
  isAllowed?: boolean;
};

const GOOGLE_ANALYTICS_URL = "https://www.google-analytics.com/collect";

export interface Analytics {
  sendTaskHit(taskName: string, more?: RawAnalyticsPayload): Promise<void>;
}

export async function getAnalytics(): Promise<Analytics> {
  const analyticsData = await getAnalyticsData();

  if (analyticsData.isAllowed) {
    return new GoogleAnalytics(analyticsData.clientId);
  }

  return new EmptyAnalytics();
}

class EmptyAnalytics implements Analytics {
  public async sendTaskHit(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    taskName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    more?: RawAnalyticsPayload
  ): Promise<void> {
    // DO NOTHING
    return Promise.resolve();
  }
}

class GoogleAnalytics implements Analytics {
  private readonly _clientId: string;
  private readonly _version: string;

  // Tracking ID. I guess there's no other choice than keeping it here.
  private readonly _trackingId: string = "UA-117668706-4";

  constructor(clientId: string) {
    this._clientId = clientId;
    this._version = pjson.version;
  }

  public async sendTaskHit(
    taskName: string,
    more?: RawAnalyticsPayload
  ): Promise<void> {
    const task = this._taskHit(taskName, more);
    return this._sendHit(task);
  }

  private _taskHit(
    taskName: string,
    more?: RawAnalyticsPayload
  ): AnalyticsPayload {
    const defaultAnalytics: DefaultRawAnalyticsPayload = {
      // Measurement protocol version.
      v: "1",

      // Tracking Id.
      tid: this._trackingId,

      // User agent, must be present.
      // We use it to inform Node version used and OS.
      // Example:
      //   Node/v8.12.0 (Darwin 17.7.0)
      ua: getUserAgent(),

      // Client Id.
      cid: this._clientId,

      // Hit type, we're only using timing for now.
      t: "timing",

      // Document page
      dp: `/${taskName}`,

      // Custom dimension 1: solidity-extension version
      //	 Example: 'v1.0.0'.
      cd1: `v${this._version}`,
    };

    return { ...defaultAnalytics, ...(more || {}) };
  }

  private async _sendHit(hit: AnalyticsPayload): Promise<void> {
    const hitPayload = qs.stringify(hit);
    await got.post(GOOGLE_ANALYTICS_URL, {
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "text/plain;charset=UTF-8",
      },
      body: hitPayload,
    });
  }
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  let data = await readAnalyticsData();

  if (!data?.clientId) {
    const tmpData: AnalyticsData = {
      clientId: uuid(),
      isAllowed: data?.isAllowed,
    };
    data = tmpData;

    await writeAnalytics(data);
  }

  return data;
}

/**
 * At the moment, we couldn't find a reliably way to report the OS () in Node,
 * as the versions reported by the various `os` APIs (`os.platform()`, `os.type()`, etc)
 * return values different to those expected by Google Analytics
 * We decided to take the compromise of just reporting the OS Platform (OSX/Linux/Windows) for now (version information is bogus for now).
 */
function getOperatingSystem(): string {
  switch (os.type()) {
    case "Windows_NT":
      return "(Windows NT 6.1; Win64; x64)";
    case "Darwin":
      return "(Macintosh; Intel Mac OS X 10_13_6)";
    case "Linux":
      return "(X11; Linux x86_64)";
    default:
      return "(Unknown)";
  }
}

function getUserAgent(): string {
  return `Node/${process.version} ${getOperatingSystem()}`;
}

async function generatePaths(packageName = "solidity-extension") {
  const { default: envPaths } = await import("env-paths");
  return envPaths(packageName);
}

async function getDataDir(packageName?: string): Promise<string> {
  const { data } = await generatePaths(packageName);
  await fs.ensureDir(data);
  return data;
}

async function readAnalyticsData(): Promise<AnalyticsData | undefined> {
  const globalDataDir = await getDataDir();
  const idFile = path.join(globalDataDir, "analytics.json");
  return read(idFile);
}

async function read(idFile: string): Promise<AnalyticsData | undefined> {
  let data: AnalyticsData;
  try {
    data = await fs.readJSON(idFile, { encoding: "utf8" });
  } catch (error) {
    return undefined;
  }

  return data;
}

export async function writeAnalytics(data: AnalyticsData) {
  const globalDataDir = await getDataDir();
  const idFile = path.join(globalDataDir, "analytics.json");
  await fs.writeJSON(
    idFile,
    {
      clientId: data.clientId,
      isAllowed: data.isAllowed === true ? true : false,
    },
    { encoding: "utf-8", spaces: 2 }
  );
}
