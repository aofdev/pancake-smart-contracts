/* eslint-disable */

import { formatUnits, parseEther } from "ethers/lib/utils";
import { artifacts, contract } from "hardhat";
import { assert, expect } from "chai";
import { BN, constants, expectEvent, expectRevert, time } from "@openzeppelin/test-helpers";

const MockERC20 = artifacts.require("./utils/MockERC20.sol");
const PancakeFactory = artifacts.require("./PancakeFactory.sol");
const PancakePair = artifacts.require("./PancakePair.sol");
const PancakeRouter = artifacts.require("./PancakeRouter.sol");
const PancakeZapV1 = artifacts.require("./PancakeZapV1.sol");
const WBNB = artifacts.require("./WBNB.sol");
const MinimalForwarder = artifacts.require("@openzeppelin/contracts/metatx/MinimalForwarder.sol");

contract("PancakeRouter", ([alice, bob, carol, david, erin]) => {
  let pancakeFactory: any;
  let wrappedBNB: any;
  let minimalForwarder: any;
  let pancakeRouter: any;

  before(async () => {
    // Deploy Factory
    pancakeFactory = await PancakeFactory.new(alice, { from: alice });

    // Deploy Wrapped BNB
    wrappedBNB = await WBNB.new({ from: alice });

    // Deploy MinimalForwarder
    minimalForwarder = await MinimalForwarder.new({ from: alice });

    // Deploy Router
    pancakeRouter = await PancakeRouter.new(pancakeFactory.address, wrappedBNB.address, erin, minimalForwarder.address, { from: alice });

    console.log("PancakeRouter deployed to:", pancakeRouter.address);
  });

  it("should deploy PancakeRouter", async () => {
    assert.equal(pancakeRouter.address !== "", true);
  })
});
