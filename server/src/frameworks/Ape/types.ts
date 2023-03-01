/* eslint-disable @typescript-eslint/naming-convention */
export interface ApeDependency {
  name: string;
  github: string;
  version: string;
}

export interface ApeSolidityConfig {
  import_remapping: string[];
  version: string;
}

export interface ApeConfig {
  name?: string;
  contracts_folder?: string;
  dependencies?: ApeDependency[];
  solidity?: ApeSolidityConfig;
}
