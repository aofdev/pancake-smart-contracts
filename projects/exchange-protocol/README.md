# Pancake Swap gasless

## Prerequisites

copy `.env.example` to `.env` and fill in the values

```bash
cp .env.example .env
```

install dependencies

```bash
yarn install
```

connect to remote remix web

```bash
npx remixd -s /pancake-smart-contracts/projects/exchange-protocol -u https://remix.ethereum.org
```

## How to Run deploy

```bash
npx hardhat run scripts/deploy-pancake-router.ts --network testnet
```

## How to Run test

```bash
npx hardhat test
```

## How to Run scripts

```bash
npx hardhat run scripts/add-lp.ts
```

## Contracts deployed

```bash
PancakeFactory deployed to: 0xAB89e4DbFA5D8e753AE7e8F21e0ec69dBD0755Dc
WBNB deployed to: 0x6ccFF9CAb66c4823BCC5328E8EadEAb5B95c7D92
MinimalForwarder deployed to: 0xf2d4d562B5ba4FCED8C27Eb4A04F9C669715fAf3
PancakeRouter deployed to: 0x1534732a06cA6fB6c90BEC3717d92495B86EF7eF
Token A deployed to: 0x434075d2D73d0205F92A889355F98215C2FE8F9b
Token B deployed to: 0xeFf2DD42Cba2AF88793F083B885B41841bA12d94
```
