const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();
require('dotenv').config();

module.exports = {
    networks: {
        development: {
            host: "127.0.0.1",     // Localhost (default: none)
            port: 8545,            // Standard Ethereum port (default: none)
            network_id: "*",       // Any network (default: none)
        },
        mainnet: {
            provider: () => new HDWalletProvider(mnemonic, `https://mainnet.infura.io/v3/${env.INFURA_API_KEY}`),
            network_id: 80001,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        },
        mumbai: {
            provider: () => new HDWalletProvider(mnemonic, `https://rpc-mumbai.matic.today`),
            network_id: 80001,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        },
        matic: {
            provider: () => new HDWalletProvider(mnemonic, `https://rpc-mainnet.maticvigil.com/`),
            network_id: 137,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        },
        polygon: {
            provider: () => new HDWalletProvider(mnemonic, `https://rpc-mainnet.maticvigil.com/`),
            network_id: 137,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        },
        polygon: {
            provider: () => new HDWalletProvider(mnemonic, `https://rpc-mainnet.maticvigil.com/`),
            network_id: 137,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true
        },
    },
    
    // Set default mocha options here, use special reporters etc.
    mocha: {
        // timeout: 100000
    },
    
    // Configure your compilers
    compilers: {
        solc: {
            version: "0.8.4"
        }
    }
}