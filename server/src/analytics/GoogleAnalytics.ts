/* istanbul ignore file: external system */
import * as os from "os";
import got from "got";
import { ServerState } from "../types";
import { Analytics, AnalyticsPayload } from "./types";

const GA_URL = "https://www.google-analytics.com/mp/collect";
const TELEMETRY_USER_ID = "hh_vscode_telemetry_consent";

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

      const payload = this._buildTaskPayload(taskName, this.machineId);

      await this._sendHit(payload);
    } catch {
      // continue on failed analytics send
      return;
    }
  }

  // Meant for the initial response to the telemetry consent popup
  public async sendTelemetryResponse(userConsent: boolean): Promise<void> {
    try {
      const payload = this._buildTelemetryResponsePayload(userConsent);

      await this._sendHit(payload);
    } catch {
      return;
    }
  }

  // Meant for subsequent changes to the telemetry setting
  public async sendTelemetryChange(userConsent: boolean): Promise<void> {
    try {
      const payload = this._buildTelemetryChangePayload(userConsent);

      await this._sendHit(payload);
    } catch {
      return;
    }
  }

  private _buildTaskPayload(
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

  private _buildTelemetryResponsePayload(userConsent: boolean) {
    return {
      client_id: TELEMETRY_USER_ID,
      user_id: TELEMETRY_USER_ID,
      user_properties: {},
      events: [
        {
          name: "TelemetryConsentResponse",
          params: {
            userConsent: userConsent ? "yes" : "no",
          },
        },
      ],
    };
  }

  private _buildTelemetryChangePayload(userConsent: boolean) {
    return {
      client_id: TELEMETRY_USER_ID,
      user_id: TELEMETRY_USER_ID,
      user_properties: {},
      events: [
        {
          name: "TelemetryConsentChange",
          params: {
            userConsent: userConsent ? "yes" : "no",
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
