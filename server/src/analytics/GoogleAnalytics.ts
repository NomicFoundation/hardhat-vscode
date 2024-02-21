/* istanbul ignore file: external system */
import * as os from "os";
import got from "got";
import { ServerState } from "../types";
import { Analytics, AnalyticsPayload } from "./types";

const GA_URL = "https://www.google-analytics.com/mp/collect";

export class GoogleAnalytics implements Analytics {
  private readonly measurementID: string;
  private readonly apiSecret: string;
  private serverState: ServerState | null;
  private machineId: string | undefined;
  private extensionVersion: string | undefined;
  private clientName: string | undefined;
  private sessionId: string;

  constructor(measurementID: string, apiSecret: string) {
    this.measurementID = measurementID;
    this.apiSecret = apiSecret;

    this.machineId = undefined;
    this.extensionVersion = undefined;
    this.serverState = null;
    this.sessionId = Math.random().toString();
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

  public async sendPageView(taskName: string): Promise<void> {
    try {
      if (
        this.serverState?.env !== "production" ||
        !this.serverState?.telemetryEnabled ||
        this.machineId === undefined
      ) {
        return;
      }

      const payload = this._buildPayloadFrom(taskName, this.machineId);

      await this._sendHit(payload);
    } catch {
      // continue on failed analytics send
      return;
    }
  }

  private _buildPayloadFrom(
    taskName: string,
    machineId: string
  ): AnalyticsPayload {
    return {
      client_id: machineId,
      user_id: machineId,
      user_properties: {
        extensionVersion: { value: this.extensionVersion },
        languageClient: { value: this.clientName },
        operatingSystem: { value: os.type() },
      },
      events: [
        {
          name: taskName,
          params: {
            engagement_time_msec: "10000",
            session_id: this.sessionId,
          },
        },
      ],
    };
  }

  private _sendHit(payload: AnalyticsPayload) {
    return got.post(GA_URL, {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      searchParams: new URLSearchParams([
        ["api_secret", this.apiSecret],
        ["measurement_id", this.measurementID],
      ]),
    });
  }
}
