import { ethers, Contract, Wallet, BigNumber } from "ethers";
import { artifacts } from "hardhat";
import { parseEther } from "ethers/lib/utils";

const PancakeRouter = artifacts.require("./PancakeRouter.sol");
const MockERC20 = artifacts.require("./utils/MockERC20.sol");

async function main() {
  // init provider
  const web3 = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || "http://localhost:8545");
  // init wallet
  const wallet = new Wallet(
    process.env.OWNER_PRIVATE_KEY_TESTNET || console.error("Missing OWNER_PRIVATE_KEY_TESTNET")!,
    web3
  );
  // init PancakeRouter
  const pancakeRouterContract = new Contract(
    process.env.PANCAKE_ROUTER_ADDRESS || console.error("Missing PANCAKE_ROUTER_ADDRESS")!,
    PancakeRouter.abi,
    wallet
  );
  // init token A and B
  const tokenA = new Contract(
    process.env.TOKEN_A_ADDRESS || console.error("Missing TOKEN_A_ADDRESS")!,
    MockERC20.abi,
    wallet
  );
  const tokenB = new Contract(
    process.env.TOKEN_B_ADDRESS || console.error("Missing TOKEN_B_ADDRESS")!,
    MockERC20.abi,
    wallet
  );
  const deadline = BigNumber.from("1000000000000000000");

  const amountTokenAIn = parseEther("10000000");
  const amountTokenAMin = parseEther("10000000");
  const amountTokenBIn = parseEther("10000000");
  const amountTokenBMin = parseEther("10000000");

  // approve token A and B
  await tokenA.approve(pancakeRouterContract.address, amountTokenAIn);
  await tokenB.approve(pancakeRouterContract.address, amountTokenBIn);

  // add liquidity
  const result = await pancakeRouterContract
    .addLiquidity(
      tokenA.address,
      tokenB.address,
      amountTokenAIn,
      amountTokenBIn,
      amountTokenAMin,
      amountTokenBMin,
      wallet.address,
      deadline,
      { gasLimit: 1000000 }
    )
    .then((tx: any) => tx.wait());

  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
