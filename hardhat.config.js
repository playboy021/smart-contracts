require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    base_sepolia: {
      url: "https://base-sepolia.g.alchemy.com/v2/8RYmHUq8Fc-NTL2_4iynp",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    // Use your Basescan API key
    apiKey: {
      // map the custom network name to your key
      base_sepolia: process.env.BASESCAN_API_KEY,
    },
    // Teach the plugin about our custom-named network
    customChains: [
      {
        network: "base_sepolia",         // must match networks key above
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
};
