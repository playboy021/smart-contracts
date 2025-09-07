/* scripts/deploy-matic222.js */
/* eslint-disable no-console */
const hre = require("hardhat");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { ethers, network } = hre;

  // INITIAL_SUPPLY is in "whole tokens" (the contract multiplies by 10**decimals() internally).
  // Example: to mint 1,000,000 MT222 (18 decimals), set INITIAL_SUPPLY=1000000
  const initialSupplyEnv = process.env.INITIAL_SUPPLY ?? "1000000";
  // Accept CLI override: --initial-supply 12345
  const cliIdx = process.argv.indexOf("--initial-supply");
  const initialSupply =
    cliIdx !== -1 && process.argv[cliIdx + 1]
      ? process.argv[cliIdx + 1]
      : initialSupplyEnv;

  console.log(`\nNetwork: ${network.name}`);
  console.log(`Initial supply (whole tokens): ${initialSupply}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // Deploy
  const Factory = await ethers.getContractFactory("Matic222");
  const token = await Factory.deploy(initialSupply);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`\nMatic222 deployed at: ${address}`);

  // (Optional but recommended) wait for a couple of confirmations prior to verify
  const deployTx = token.deploymentTransaction();
  if (deployTx && deployTx.wait) {
    console.log("Waiting for 2 block confirmations...");
    await deployTx.wait(2);
  }

  // Hard pause so the explorer indexer catches up
  const pauseMs = 30_000;
  console.log(`Pausing ${pauseMs / 1000}s before verification...`);
  await sleep(pauseMs);

  // Verify
  try {
    console.log("Verifying on explorer...");
    await hre.run("verify:verify", {
      address,
      constructorArguments: [initialSupply],
    });
    console.log("✅ Verification submitted.");
  } catch (err) {
    console.error("❌ Verification error:", err?.message || err);
  }

  console.log("\nDone.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
