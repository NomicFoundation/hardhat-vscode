import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const greeter = await ethers.deployContract("Greeter", ["Hello, world!"]);

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
