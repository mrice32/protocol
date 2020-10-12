#!/usr/bin/env node

const { ethers } = require("ethers");
const Web3 = require("web3");
const { getAbi } = require("@uma/core");

const argv = require("minimist")(process.argv.slice(), { string: ["emp", "collateral"] });

const collateralToSend = "100000";
const tokensToCreate = "100";
const approvalAmount = "99999999999999999999";

const nodeUrl = "http://127.0.0.1:9545";
const developerAddress = "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";

function getTagBytes(address) {
  const paddedAddress = web3.utils.padLeft(address, 64);
  // 32 byte "f" is the delimeter (very large number), then the padded address needs to have its "0x" prefix removed.
  return "f".repeat(64) + paddedAddress.slice(2);
}

async function createAndTagEthers(empAddress, collateralAddress, providerUrl) {
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const signer = provider.getSigner();
  const collateral = new ethers.Contract(collateralAddress, getAbi("ERC20"), signer);
  const emp = new ethers.Contract(empAddress, getAbi("ExpiringMultiParty"), signer);

  await collateral.approve(emp.address, ethers.utils.parseUnits(approvalAmount));

  const unsignedTxn = await emp.populateTransaction.create(
    { rawValue: ethers.utils.parseUnits(collateralToSend) },
    { rawValue: ethers.utils.parseUnits(tokensToCreate) }
  );

  unsignedTxn.data = unsignedTxn.data.concat(getTagBytes(developerAddress));
  console.log(await signer.sendTransaction(unsignedTxn));
}

async function createAndTagWeb3(empAddress, collateralAddress, providerUrl) {
  const web3 = new Web3(providerUrl);
  const collateral = new web3.eth.Contract(getAbi("ERC20"), collateralAddress);
  const emp = new web3.eth.Contract(getAbi("ExpiringMultiParty"), empAddress);

  const account = (await web3.eth.getAccounts())[0];

  await collateral.methods
    .approve(emp.options.address, web3.utils.toWei(approvalAmount))
    .send({ from: account, gas: 1000000 });
  let encodedData = emp.methods
    .create({ rawValue: web3.utils.toWei(collateralToSend) }, { rawValue: web3.utils.toWei(tokensToCreate) })
    .encodeABI();

  encodedData = encodedData.concat(getTagBytes(developerAddress));

  console.log(
    await web3.eth.sendTransaction({
      from: account,
      to: emp.options.address,
      value: 0,
      data: encodedData,
      gas: 1000000
    })
  );
}

createAndTagEthers(argv.emp, argv.collateral, nodeUrl)
  .catch(err => console.log("ethers failed", err))
  .then(() => createAndTagWeb3(argv.emp, argv.collateral, nodeUrl).catch(err => console.log("web3 failed", err)));
