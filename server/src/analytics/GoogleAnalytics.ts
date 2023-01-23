/* istanbul ignore file: external system */
import * as os from "os";
import got from "got";
import * as qs from "qs";
import { ServerState } from "../types";
import {
  Analytics,
  AnalyticsPayload,
  DefaultRawAnalyticsPayload,
  RawAnalyticsPayload,
} from "./types";

const GOOGLE_ANALYTICS_URL = "https://www.google-analytics.com/collect";

export class GoogleAnalytics implements Analytics {
  private readonly googleTrackingId: string;
  private serverState: ServerState | null;
  private machineId: string | undefined;
  private extensionVersion: string | undefined;
  private clientName: string | undefined;

  constructor(googleTrackingId: string) {
    this.googleTrackingId = googleTrackingId;

    this.machineId = undefined;
    this.extensionVersion = undefined;
    this.serverState = null;
  }

  public init(
    machineId: string | undefined,
    extensionVersion: string | undefined,
    serverState: ServerState,
    clientName: string | undefined
  ): void {
    this.machineId = machineId;
    this.extensionVersion = extensionVersion;
    this.serverState = serverState;
    this.clientName = clientName;
  }

  public async sendPageView(
    taskName: string,
    more?: RawAnalyticsPayload
  ): Promise<void> {
    try {
      if (
        this.serverState?.env !== "production" ||
        !this.serverState.telemetryEnabled ||
        this.machineId === undefined
      ) {
        return;
      }

      const payload = this._buildPayloadFrom(taskName, this.machineId, more);

      await this._sendHit(payload);
    } catch {
      // continue on failed analytics send
      return;
    }
  }

  private _buildPayloadFrom(
    taskName: string,
    machineId: string,
    more?: RawAnalyticsPayload
  ): AnalyticsPayload {
    const defaultAnalytics: DefaultRawAnalyticsPayload = {
      // Measurement protocol version.
      v: "1",

      // Tracking Id.
      tid: this.googleTrackingId,

      // User agent, must be present.
      // We use it to inform Node version used and OS.
      // Example:
      //   Node/v8.12.0 (Darwin 17.7.0)
      ua: this._getUserAgent(),

      // Client Id.
      cid: machineId,

      // Hit type, we're only using timing for now.
      t: "pageview",

      // Document page
      dp: `/${taskName}`,

      // Custom dimension 1: extension version
      //	 Example: 'v1.0.0'.
      cd1: `v${this.extensionVersion}`,

      // Data source -> vs code or coc
      ds: this.clientName,
    };

    return { ...defaultAnalytics, ...(more || {}) };
  }

  private _sendHit(hit: AnalyticsPayload) {
    const hitPayload = qs.stringify(hit);

    return got.post(GOOGLE_ANALYTICS_URL, {
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "text/plain;charset=UTF-8",
      },
      body: hitPayload,
    });
  }

  private _getUserAgent(): string {
    return `Node/${process.version} ${this._getOperatingSystem()}`;
  }

  /**
   * At the moment, we couldn't find a reliably way to report the OS () in Node,
   * as the versions reported by the various `os` APIs (`os.platform()`, `os.type()`, etc)
   * return values different to those expected by Google Analytics
   * We decided to take the compromise of just reporting the OS Platform (OSX/Linux/Windows) for now (version information is bogus for now).
   */
  private _getOperatingSystem(): string {
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
}
