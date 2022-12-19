import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.8",
    settings: {
      optimizer: {
        enabled: false,
        runs: 1,
      },
      outputSelection: {},
    },
  },
};

export default config;
