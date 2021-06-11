var BuyzookaToken = artifacts.require("BuyzookaToken");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(BuyzookaToken);
};