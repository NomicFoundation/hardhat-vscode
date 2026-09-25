import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig, task } from "hardhat/config";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/docs/learn-more/writing-tasks
const accountsTask = task("accounts", "Prints the list of accounts")
  .setInlineAction(async (_taskArguments, hre) => {
    const { ethers } = await hre.network.create();

    for (const account of await ethers.getSigners()) {
      console.log(account.address);
    }
  })
  .build();

// You need to export a config object to set up your project
// Go to https://hardhat.org/docs/reference/configuration to learn more

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  tasks: [accountsTask],
  solidity: {
    profiles: {
      default: {
        compilers: [
          {
            version: "0.8.8",
          },
          {
            version: "0.8.24",
          },
          {
            version: "0.8.30",
          },
          {
            version: "0.8.37",
          },
        ],
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
  },
});
