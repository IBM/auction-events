//Import Hyperledger Fabric 1.4 programming model - fabric-network
'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');

//connect to the config file
const configPath = path.join(process.cwd(), './configLocal.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);

// connect to the local connection file
const ccpPath = path.join(process.cwd(), 'local_fabric_connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const connectionProfile = JSON.parse(ccpJSON);


//A wallet stores a collection of identities for use with local wallet
const walletPath = path.join(process.cwd(), './local_fabric_wallet');
const wallet = new FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

const peerIdentity = 'admin';

async function contractEvents() {

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
    await gateway.connect(connectionProfile, {
      wallet,
      identity: peerIdentity,
      discovery: config.gatewayDiscovery
    });
    console.log('gateway connect');

    //connect to our channel that has been created on IBM Blockchain Platform
    const network = await gateway.getNetwork('mychannel');

    //connect to our insurance contract that has been installed / instantiated on IBM Blockchain Platform
    const contract = await network.getContract('auction');

    await contract.addContractListener('my-contract-listener', 'TradeEvent', (err, event, blockNumber, transactionId, status) => {
      if (err) {
        console.error(err);
        return;
      }

      //convert event to something we can parse 
      event = event.payload.toString();
      event = JSON.parse(event)

      //where we output the TradeEvent
      console.log('************************ Start Trade Event *******************************************************');
      console.log(`type: ${event.type}`);
      console.log(`ownerId: ${event.ownerId}`);
      console.log(`id: ${event.id}`);
      console.log(`description: ${event.description}`);
      console.log(`status: ${event.status}`);
      console.log(`amount: ${event.amount}`);
      console.log(`buyerId: ${event.buyerId}`);
      console.log(`Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);
      console.log('************************ End Trade Event ************************************');
    });

    var sellerEmail = "auction@acme.org";
    var sellerName = "ACME";
    var sellerBalance = "100";

    //addSeller - this is the one that will have product to sell on the auction
    const addSellerResponse = await contract.submitTransaction('AddSeller', sellerEmail, sellerName, sellerBalance);

    var memberAEmail = "memberA@acme.org";
    var memberAFirstName = "Amy";
    var memberALastName = "Williams";
    var memberABalance = "1000";

    //addMember - this is the person that can bid on the item
    const addMemberAResponse = await contract.submitTransaction('AddMember', memberAEmail, memberAFirstName, memberALastName, memberABalance);

    var memberBEmail = "memberB@acme.org";
    var memberBFirstName = "Billy";
    var memberBLastName = "Thompson";
    var memberBBalance = "1000";

    //addMember - this is the person that will compete in bids to win the auction
    const addMemberBResponse = await contract.submitTransaction('AddMember', memberBEmail, memberBFirstName, memberBLastName, memberBBalance);

    var productId = "p1";
    var description = "Sample Product";

    //addProduct - add a product that people can bid on
    const addProductResponse = await contract.submitTransaction('AddProduct', productId, description, sellerEmail);

    var listingId = "l1";
    var reservePrice = "50";
    //start the auction
    const startBiddingResponse = await contract.submitTransaction('StartBidding', listingId, reservePrice, productId);

    var memberA_bidPrice = "50";
    //make an offer
    const offerAResponse = await contract.submitTransaction('Offer', memberA_bidPrice, listingId, memberAEmail);

    var memberB_bidPrice = "100";
    const offerBResponse = await contract.submitTransaction('Offer', memberB_bidPrice, listingId, memberBEmail);

    const closebiddingResponse = await contract.submitTransaction('CloseBidding', listingId);
    console.log('closebiddingResponse: ');
    console.log(JSON.parse(closebiddingResponse.toString()));
    console.log('Transaction to close the bidding has been submitted');

    // Disconnect from the gateway.
    await gateway.disconnect();

  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
  }
}

contractEvents();