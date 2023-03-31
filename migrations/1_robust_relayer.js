const RobustRelayer = artifacts.require("RobustRelayer");

module.exports = function (deployer) {
  deployer.deploy(RobustRelayer);
};
