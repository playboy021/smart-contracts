require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load environment variables from .env file

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    base_sepolia: {
      url: "https://sepolia.base.org", // Base Sepolia RPC URL
      chainId: 84532, // Base Sepolia chain ID
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], // Use private key from .env
    },
    // You can keep your other network configurations here
  },
};