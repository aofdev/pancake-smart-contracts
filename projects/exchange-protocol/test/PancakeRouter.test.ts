/* eslint-disable */

import { assert } from "chai";
import { formatEther, formatUnits, parseEther } from "ethers/lib/utils";
import { artifacts, contract } from "hardhat";
// import { assert, expect } from "chai";
import { expectEvent, expectRevert, time } from "@openzeppelin/test-helpers";
// import { BigNumber } from "ethers";

const { ethers } = require("hardhat");


// const MockERC20 = artifacts.require("./utils/MockERC20.sol");
// const PancakeFactory = artifacts.require("./PancakeFactory.sol");
const PancakePair = artifacts.require("./PancakePair.sol");
// const PancakeRouter = artifacts.require("./PancakeRouter.sol");
// const WBNB = artifacts.require("./WBNB.sol");
// const MinimalForwarder = artifacts.require("@openzeppelin/contracts/metatx/MinimalForwarder.sol");

import { PancakeFactory } from '../typechain/PancakeFactory'

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then((f) => f.deployed());
}

describe("PancakeRouter", function () {
  let pancakeFactory: PancakeFactory;
  let wrappedBNB: any;
  let forwarder: any;
  let pancakeRouter: any;
  let pairAB;
  let tokenA;
  let tokenB;

  let owner;
  let feeManager;
  let user;
  let relayer;
  let unknownUser;

  before(async () => {
    const accounts = await ethers.getSigners();

    owner = accounts[0];
    feeManager = accounts[1];
    user = accounts[2];
    relayer = accounts[3];
    unknownUser = accounts[4];

    pancakeFactory = await deploy("PancakeFactory", owner.address);
    console.log("PancakeFactory deployed to:", pancakeFactory.address);

    wrappedBNB = await deploy("WBNB");
    console.log("WBNB deployed to:", wrappedBNB.address);

    forwarder = await deploy("MinimalForwarder");
    console.log("forwarder deployed to:", forwarder.address);

    pancakeRouter = await deploy(
      "PancakeRouter",
      pancakeFactory.address,
      wrappedBNB.address,
      feeManager.address,
      forwarder.address,
    );
    console.log("PancakeRouter deployed to:", pancakeRouter.address);

    tokenA = await deploy("MockERC20", "Token A", "TKA", parseEther("1000000"));
    console.log("Token A deployed to:", tokenA.address);
    tokenB = await deploy("MockERC20", "Token B", "TKB", parseEther("1000000"));
    console.log("Token B deployed to:", tokenB.address);

    let result = await pancakeFactory.connect(owner).createPair(tokenA.address, wrappedBNB.address).then((tx) => tx.wait());
    console.log("createPair result:", result.events[0].args.pair);
    const pairABAddress = result.events[0].args.pair
    pairAB = await PancakePair.at(pairABAddress);
    assert.equal(String(await pairAB.totalSupply()), parseEther("0").toString());

    // Provide liquidity to pairAB by Owner
    await tokenA.connect(owner).approve(pancakeRouter.address, ethers.constants.MaxUint256);
    await tokenB.connect(owner).approve(pancakeRouter.address, ethers.constants.MaxUint256);

    const deadline = ethers.constants.MaxUint256;

    await pancakeRouter.connect(owner).addLiquidity(
      tokenA.address,
      tokenB.address,
      parseEther("1000000"), // 1M token A
      parseEther("1000000"), // 1M token B
      parseEther("1000000"),
      parseEther("1000000"),
      owner.address,
      deadline,
    );
  });

  describe("User swap token A for token B", () => {
    it("exact in fail if sender is not gasless role", async () => {
      // Setup token A for User
      await tokenA.connect(user).mintTokens(parseEther("100"));
      await tokenA.connect(user).approve(pancakeRouter.address, ethers.constants.MaxUint256);

      const deadline = ethers.constants.MaxUint256;
      const swapFunction = pancakeRouter.connect(user).swapExactTokensForTokensWithGasless(
        parseEther("90"),  // Token A
        parseEther("0.9"), // Token B
        parseEther("10"),  // Token A Fee 
        [tokenA.address, tokenB.address],
        user.address,     // To
        deadline,
      );

      await expectRevert(
        swapFunction,
        "PancakeRouter: must have gasless role"
      );
    });
  });
});


