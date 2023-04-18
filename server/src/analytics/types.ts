/* eslint-disable @typescript-eslint/naming-convention */

import { ServerState } from "../types";

export interface AnalyticsPayload {
  client_id: string;
  user_id: string;

  user_properties: {
    extensionVersion: {
      value?: string;
    };
    languageClient: {
      value?: string;
    };
    operatingSystem: {
      value?: string;
    };
  };

  events: Array<{
    name: string;
    params: {
      engagement_time_msec: string;
      session_id?: string;
    };
  }>;
}

export interface Analytics {
  init(
    trackingId: string | undefined,
    extensionVersion: string | undefined,
    serverState: ServerState,
    clientName: string | undefined
  ): void;

  sendPageView(taskName: string): Promise<void>;
}
