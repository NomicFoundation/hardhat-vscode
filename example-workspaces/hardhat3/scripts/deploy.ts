// Scripts are run with `npx hardhat run <script>`, which builds the project
// first and gives the script access to the Hardhat Runtime Environment.
import { network } from "hardhat";

const { ethers } = await network.create();

// We get the contract to deploy
const greeter = await ethers.deployContract("Greeter", ["Hello, Hardhat!"]);

await greeter.waitForDeployment();

console.log("Greeter deployed to:", await greeter.getAddress());
