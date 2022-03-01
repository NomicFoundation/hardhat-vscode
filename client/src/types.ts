export type Environment = "development" | "production";

export type HardhatVSCodeConfig = {
  name: string;
  version: string;
  env: Environment;
};
