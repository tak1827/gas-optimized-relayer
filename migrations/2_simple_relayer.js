const SimpleRelayer = artifacts.require("SimpleRelayer");

module.exports = function (deployer) {
  deployer.deploy(SimpleRelayer);
};
