//Import Hyperledger Fabric 1.4 programming model - fabric-network
'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const util = require('util');

//connect to the config file
const configPath = path.join(process.cwd(), './config.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);

// connect to the local connection file
// const ccpPath = path.join(process.cwd(), 'local_fabric_connection.json');
// const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
// const connectionProfile = JSON.parse(ccpJSON);

// connect to the IBP connection file 
const ccpPath = path.join(process.cwd(), 'ibpConnection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const connectionProfile = JSON.parse(ccpJSON);

// A wallet stores a collection of identities for use with local wallet
// const walletPath = path.join(process.cwd(), './local_fabric_wallet');
// const wallet = new FileSystemWallet(walletPath);
// console.log(`Wallet path: ${walletPath}`);

// A wallet stores a collection of identities for use with local wallet
const walletPath = path.join(process.cwd(), './wallet');
const wallet = new FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

const peerIdentity = 'app-admin2';

// a function that shows how to implement block events
async function transactionEvents() {

  try {

    let response;

    // Check to see if we've already enrolled the user.
    const userExists = await wallet.exists(peerIdentity);
    if (!userExists) {
      console.log('An identity for the user ' + peerIdentity + ' does not exist in the wallet');
      console.log('Run the registerUser.js application before retrying');
      response.error = 'An identity for the user ' + peerIdentity + ' does not exist in the wallet. Register ' + peerIdentity + ' first';
      return response;
    }

    //connect to Fabric Network, but starting a new gateway
    const gateway = new Gateway();

    //use our config file, our peerIdentity, and our discovery options to connect to Fabric network.
    await gateway.connect(connectionProfile, {wallet, identity: peerIdentity, discovery: config.gatewayDiscovery});
    console.log('gateway connect');

    //connect to our channel that has been created on IBM Blockchain Platform
    const network = await gateway.getNetwork('mychannel');

    //our transaction listener is listening to our transactions, and seeing if any transactions are committed. 


    //connect to our insurance contract that has been installed / instantiated on IBM Blockchain Platform
    const contract = await network.getContract('auction');

    var sellerEmail = "auction@acme.org";
    var sellerName = "ACME";
    var sellerBalance = "100";

    const transaction = contract.createTransaction('AddSeller');

    await transaction.addCommitListener((err, txId, status, blockHeight) => {
      if (err) {
        console.log(err)
        return
      }
      if (status === 'VALID') {
        console.log('transaction committed');
        console.log(util.inspect(txId, {showHidden: false, depth: 5}))
        console.log(util.inspect(status, {showHidden: false, depth: 5}))
        console.log(util.inspect(blockHeight, {showHidden: false, depth: 5}))
        console.log('transaction committed end');
      } else {
        console.log('err transaction failed');
        console.log(status);
      }
    });
    await transaction.submit(sellerEmail, sellerName, sellerBalance);

    console.log('Transaction to add seller has been submitted');

    // Disconnect from the gateway.
    await gateway.disconnect();

  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
  }
}

transactionEvents();