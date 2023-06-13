const betting = artifacts.require("betting");
//import {betting} from 'artifacts'

module.exports = function(deployer) {
    deployer.deploy(betting);
}