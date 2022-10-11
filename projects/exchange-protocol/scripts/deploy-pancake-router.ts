import { ethers, run } from "hardhat";

async function main() {
  // Compile contracts
  await run("compile");
  console.log("Compiled contracts.");

  const ownerAddress = process.env.OWNER_ADDRESS || console.error("Missing OWNER_ADDRESS");
  const feeManagerAddress = process.env.FEE_MANAGER_ADDRESS || console.error("Missing FEE_MANAGER_ADDRESS");

  const PancakeFactory = await ethers.getContractFactory("PancakeFactory");
  const pancakeFactory = await PancakeFactory.deploy(ownerAddress);
  await pancakeFactory.deployed();
  console.log("PancakeFactory deployed to:", pancakeFactory.address);

  const WBNB = await ethers.getContractFactory("WBNB");
  const wrappedBNB = await WBNB.deploy();
  await wrappedBNB.deployed();
  console.log("WBNB deployed to:", wrappedBNB.address);

  const MinimalForwarder = await ethers.getContractFactory("MinimalForwarder");
  const minimalForwarder = await MinimalForwarder.deploy();
  await minimalForwarder.deployed();
  console.log("MinimalForwarder deployed to:", minimalForwarder.address);

  const PancakeRouter = await ethers.getContractFactory("PancakeRouter");
  const pancakeRouter = await PancakeRouter.deploy(
    pancakeFactory.address,
    wrappedBNB.address,
    feeManagerAddress,
    minimalForwarder.address
  );
  await pancakeRouter.deployed();
  console.log("PancakeRouter deployed to:", pancakeRouter.address);

  // Deploy ERC20s
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Token A", "TA", "10000000000000000000000000");
  await tokenA.deployed();
  console.log("Token A deployed to:", tokenA.address);

  const tokenB = await MockERC20.deploy("Token B", "TB", "10000000000000000000000000");
  await tokenB.deployed();
  console.log("Token B deployed to:", tokenB.address);

  // Deploy pair AB
  const result = await pancakeFactory.createPair(tokenA.address, tokenB.address);
  console.log("Pair AB created:", result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
