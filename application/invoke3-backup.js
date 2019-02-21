
'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
//const yaml = require('js-yaml');
const path = require('path');
const { FileSystemWallet, Gateway } = require('fabric-network');

// capture network variables from config.json
const configPath = path.join(process.cwd(), 'config.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);
var connection_file = config.connection_file;
var appAdmin = config.appAdmin;
var channelName = config.channel_name;
var smartContractName = config.smart_contract_name;
var appAdminSecret = config.appAdminSecret;
var orgMSPID = config.orgMSPID;

const ccpPath = path.join(process.cwd(), connection_file);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

const gateway = new Gateway();


async function main() {

    console.log("reached1");

try {

        console.log("reached2");

        const client = gateway.getClient();
        let tx_object = client.newTransactionID();

        let tx_id = tx_object.getTransactionID();

        let channel = client.getChannel(channelName);
        let peer = client.getPeer("grpcs://173.193.79.114:30324");

        const channel_event_hub = channel.newChannelEventHub(peer);
        console.log("reached");

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // A gateway defines the peers used to access Fabric networks
        
        await gateway.connect(ccp, { wallet, identity: appAdmin , discovery: {enabled: true, asLocalhost:false }});
        console.log('Connected to Fabric gateway.');

        // Get addressability to network
        const network = await gateway.getNetwork(channelName);
        console.log('Got addressability to network');

        // Get addressability to  contract
        const contract = await network.getContract(smartContractName);
        console.log('Got addressability to contract');

        var listingId = "l1";
        var reservePrice = "50";
        var productId = "p1";

        //startBiddingResponse = await contract.submitTransaction('StartBidding', listingId, reservePrice, productId);

} catch (error) {
      console.log(`Error processing transaction. ${error}`);
      console.log(error.stack);
  } finally {
      // Disconnect from the gateway
      console.log('Disconnect from Fabric gateway.');
      await gateway.disconnect();
    }

}

main ();