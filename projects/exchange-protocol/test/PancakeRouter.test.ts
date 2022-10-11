/* eslint-disable */

import { formatUnits, parseEther } from "ethers/lib/utils";
import { artifacts, contract } from "hardhat";
import { assert, expect } from "chai";
import { BN, constants, expectEvent, expectRevert, time } from "@openzeppelin/test-helpers";

const MockERC20 = artifacts.require("./utils/MockERC20.sol");
const PancakeFactory = artifacts.require("./PancakeFactory.sol");
const PancakePair = artifacts.require("./PancakePair.sol");
const PancakeRouter = artifacts.require("./PancakeRouter.sol");
const WBNB = artifacts.require("./WBNB.sol");
const MinimalForwarder = artifacts.require("@openzeppelin/contracts/metatx/MinimalForwarder.sol");

contract("PancakeRouter", ([alice, bob, carol, david, erin]) => {
  let pancakeFactory: any;
  let wrappedBNB: any;
  let minimalForwarder: any;
  let pancakeRouter: any;
  let pairAB;
  let pairBC;
  let pairAC;
  let tokenA;
  let tokenC;

  before(async () => {
    // Deploy Factory
    pancakeFactory = await PancakeFactory.new(alice, { from: alice });

    // Deploy Wrapped BNB
    wrappedBNB = await WBNB.new({ from: alice });

    // Deploy MinimalForwarder
    minimalForwarder = await MinimalForwarder.new({ from: alice });

    // Deploy Router
    pancakeRouter = await PancakeRouter.new(
      pancakeFactory.address,
      wrappedBNB.address,
      erin,
      minimalForwarder.address,
      { from: alice }
    );

    console.log("PancakeRouter deployed to:", pancakeRouter.address);

    // Deploy ERC20s
    tokenA = await MockERC20.new("Token A", "TA", parseEther("10000000"), { from: alice });
    tokenC = await MockERC20.new("Token C", "TC", parseEther("10000000"), { from: alice });

    // Create 3 LP tokens
    let result = await pancakeFactory.createPair(tokenA.address, wrappedBNB.address, { from: alice });
    pairAB = await PancakePair.at(result.logs[0].args[2]);

    result = await pancakeFactory.createPair(wrappedBNB.address, tokenC.address, { from: alice });
    pairBC = await PancakePair.at(result.logs[0].args[2]);

    result = await pancakeFactory.createPair(tokenA.address, tokenC.address, { from: alice });
    pairAC = await PancakePair.at(result.logs[0].args[2]);

    assert.equal(String(await pairAB.totalSupply()), parseEther("0").toString());
    assert.equal(String(await pairBC.totalSupply()), parseEther("0").toString());
    assert.equal(String(await pairAC.totalSupply()), parseEther("0").toString());

    console.log("pairAC", pairAC.address);
    // Mint and approve all contracts
    for (let thisUser of [alice, bob, carol, david, erin]) {
      await tokenA.mintTokens(parseEther("2000000"), { from: thisUser });
      await tokenC.mintTokens(parseEther("2000000"), { from: thisUser });

      await tokenA.approve(pancakeRouter.address, constants.MAX_UINT256, {
        from: thisUser,
      });

      await tokenC.approve(pancakeRouter.address, constants.MAX_UINT256, {
        from: thisUser,
      });
    }
    const deadline = new BN(await time.latest()).add(new BN("100"));
    await pancakeRouter.addLiquidity(
      tokenA.address,
      tokenC.address,
      parseEther("1000000"), // 1M token A
      parseEther("1000000"), // 1M token C
      parseEther("1000000"),
      parseEther("1000000"),
      bob,
      deadline,
      { from: bob }
    );
  });

  describe("User swap token A for token C", () => {
    it("exact in fail if is not gasless role", async () => {
      const deadline = new BN(await time.latest()).add(new BN("100"));

      const result = await pancakeRouter.swapExactTokensForTokensWithGasless(
        parseEther("90"),
        parseEther("0.9"),
        parseEther("10"),
        [tokenA.address, tokenC.address],
        minimalForwarder.address,
        deadline,
        { from: bob }
      );
      console.log(result.receipt.rawLogs)
    });
  });
});
