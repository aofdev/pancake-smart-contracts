/* eslint-disable */

import { formatEther, formatUnits, parseEther } from "ethers/lib/utils";
import { artifacts, contract } from "hardhat";
import { assert, expect } from "chai";
import { BN, constants, expectEvent, expectRevert, time } from "@openzeppelin/test-helpers";
import { BigNumber } from "ethers";

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
  let tokenA;
  let tokenB;

  let owner = alice;
  let feeManager = bob;
  let user = carol;

  before(async () => {
    // Deploy Factory
    pancakeFactory = await PancakeFactory.new(owner, { from: owner });

    // Deploy Wrapped BNB
    wrappedBNB = await WBNB.new({ from: owner });

    // Deploy MinimalForwarder
    minimalForwarder = await MinimalForwarder.new({ from: owner });

    // Deploy Router
    pancakeRouter = await PancakeRouter.new(
      pancakeFactory.address,   // Factory
      wrappedBNB.address,       // Wrapped ETH or BNB
      feeManager,               // FeeManager
      minimalForwarder.address, // Forwarder
      { from: owner }
    );

    console.log("PancakeFactory deployed to:", pancakeFactory.address);
    console.log("PancakeRouter deployed to:", pancakeRouter.address);

    // Deploy ERC20s
    tokenA = await MockERC20.new("Token A", "TA", parseEther("10000000"), { from: owner });
    tokenB = await MockERC20.new("Token B", "TB", parseEther("10000000"), { from: owner });

    console.log("TokenA deployed to:", tokenA.address);
    console.log("TokenB deployed to:", tokenB.address);

    // Create Pair of tokenA and tokenB
    let result = await pancakeFactory.createPair(tokenA.address, wrappedBNB.address, { from: owner });
    pairAB = await PancakePair.at(result.logs[0].args[2]);
    assert.equal(String(await pairAB.totalSupply()), parseEther("0").toString());
    console.log("PairAB created at:", pairAB.address);

    // Mint tokenA and tokenB for Owner
    await tokenA.mintTokens(parseEther("2000000"), { from: owner });
    await tokenB.mintTokens(parseEther("2000000"), { from: owner });

    // Provide liquidity to pairAB by Owner
    await tokenA.approve(pancakeRouter.address, constants.MAX_UINT256, {
      from: owner,
    });
    await tokenB.approve(pancakeRouter.address, constants.MAX_UINT256, {
      from: owner,
    });
    const deadline = new BN(await time.latest()).add(new BN("100"));
    await pancakeRouter.addLiquidity(
      tokenA.address,
      tokenB.address,
      parseEther("1000000"), // 1M token A
      parseEther("1000000"), // 1M token B
      parseEther("1000000"),
      parseEther("1000000"),
      owner,
      deadline,
      { from: owner }
    );
  });

  describe("User swap token A for token B", () => {
    it("exact in fail if sender is not gasless role", async () => {
      // Setup token A for User
      await tokenA.mintTokens(parseEther("2000000"), { from: user });
      await tokenA.approve(pancakeRouter.address, constants.MAX_UINT256, {
        from: user,
      });

      console.log("Token A before balance:", formatEther(BigNumber.from((await tokenA.balanceOf(user)).toString())));
      console.log("Token B before balance:", formatEther(BigNumber.from((await tokenB.balanceOf(user)).toString())));

      const deadline = new BN(await time.latest()).add(new BN("100"));
      const result = await pancakeRouter.swapExactTokensForTokensWithGasless(
        parseEther("90"),  // Token A
        parseEther("0.9"), // Token B
        parseEther("10"),  // Token A Fee 
        [tokenA.address, tokenB.address],
        minimalForwarder.address, // To
        deadline,
        { from: user }
      );
      // console.log(result.receipt.rawLogs)
      console.log("Token A after balance:", formatEther(BigNumber.from((await tokenA.balanceOf(user)).toString())));
      console.log("Token B after balance:", formatEther(BigNumber.from((await tokenB.balanceOf(user)).toString())));
    });
  });
});
