
'use strict';

var creds = require('./mychannel_auction_profile.json');
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

    

try {

    
    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // A gateway defines the peers used to access Fabric networks
    
    await gateway.connect(ccp, { wallet, identity: appAdmin , discovery: {enabled: true, asLocalhost:false }});
    console.log('Connected to Fabric gateway.');

    const network = await gateway.getNetwork(channelName);
    // Get addressability to network

    const client = gateway.getClient();
    
    const channel = client.getChannel('mychannel');
    console.log('Got addressability to channel');
    
    const channel_event_hub = channel.getChannelEventHub('173.193.79.114:30324');

    // Get addressability to network
    //const network = await gateway.getNetwork(channelName);
    console.log('Got addressability to network');


    // Get addressability to  contract
    const contract = await network.getContract(smartContractName);
    console.log('Got addressability to contract');

    var tx_id = client.newTransactionID(true);
    console.log("Assigning transaction_id: ", tx_id._transaction_id);

    var listingId = "l1";
    var reservePrice = "50";
    var productId = "p1";

    //var startBiddingResponse = await contract.submitTransaction('StartBidding', listingId, reservePrice, productId);
    let request = {
    chaincodeId: 'auction',
    fcn: 'StartBidding',
    args: ['l1', '50', 'p1'],
    txId: tx_id
   };

   var startBiddingResponse = channel.sendTransactionProposal(request);

    console.log('startBiddingResponse: ');
    //console.log(JSON.parse(startBiddingResponse.toString()));

    let isProposalGood = false;
    if (startBiddingResponse) {
            isProposalGood = true;
            console.log('Transaction proposal was good');
        } else {
            console.error('Transaction proposal was bad');
        }

    let start_block = null;

    let event_monitor = new Promise((resolve, reject) => {
        let regid = null;
        let handle = setTimeout(() => {
            if (regid) {
               // do the housekeeping when there is a problem
               channel_event_hub.unregisterChaincodeEvent(regid);
               console.log('Timeout - Failed to receive the transaction event');
            }
            reject(new Error('Timed out waiting for chaincode event'));
        }, 20000);

        regid = channel_event_hub.registerChaincodeEvent("auction", '^evtsender*',
        (event, block_num, txnid, status) => {
            // This callback will be called when there is a chaincode event name
            // within a block that will match on the second parameter in the registration
            // from the chaincode with the ID of the first parameter.
            console.log('Successfully got a chaincode event with transid:'+ txnid + ' with status:'+status);
            
            // to see the event payload, the channel_event_hub must be connected(true)
            let event_payload = event.payload.toString('utf8');
            if (event_payload.indexOf('CHAINCODE') > -1) {
                clearTimeout(handle);
                // Chaincode event listeners are meant to run continuously
                // Therefore the default to automatically unregister is false
                // So in this case we want to shutdown the event listener once
                // we see the event with the correct payload
                channel_event_hub.unregisterChaincodeEvent(regid);
                console.log('Successfully received the chaincode event on block number ' + block_num);
                resolve('RECEIVED');
            } else {
                console.log('Successfully got chaincode event ... just not the one we are looking for on block number ' + block_num);
            }
        }, (error) => {
            clearTimeout(handle);
            console.log('Failed to receive the chaincode event ::' + error);
            reject(error);
           })
   });

    

    var memberA_bidPrice = "50";
    var memberAEmail = "memberA@acme.org";
    var listingId = "l1";

    const offerAResponse = await contract.submitTransaction('Offer', memberA_bidPrice, listingId, memberAEmail);
    console.log('offerAResponse: ');
    console.log(JSON.parse(offerAResponse.toString()));



    // now that we have two promises all set to go... execute them
    return Promise.all([event_monitor]); 

        } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
    } finally {
        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        await gateway.disconnect();
    }
  
}

    /*

    var memberA_bidPrice = "50";

    const offerAResponse = await contract.submitTransaction('Offer', memberA_bidPrice, listingId, memberAEmail);
    console.log('offerAResponse: ');
    console.log(JSON.parse(offerAResponse.toString()));

    var memberB_bidPrice = "100";

    const offerBResponse = await contract.submitTransaction('Offer', memberB_bidPrice, listingId, memberBEmail);
    console.log('offerBResponse: ');
    console.log(JSON.parse(offerBResponse.toString()));

    const closebiddingResponse = await contract.submitTransaction('CloseBidding', listingId);
    console.log('closebiddingResponse: ');
    console.log(JSON.parse(closebiddingResponse.toString()));


    //  show state of seller, memberA, memberB
    const sellerStateResponse = await contract.submitTransaction('GetState', sellerEmail);
    console.log('sellerStateResponse: ')
    console.log(JSON.parse(sellerStateResponse.toString()));

    const memberAStateResponse = await contract.submitTransaction('GetState', memberAEmail);
    console.log('memberAStateResponse: ')
    console.log(JSON.parse(memberAStateResponse.toString()));

    const memberBStateResponse = await contract.submitTransaction('GetState', memberBEmail);
    console.log('memberBStateResponse: ')
    console.log(JSON.parse(memberBStateResponse.toString()));
*/





// invoke the main function, can catch any error that might escape
main();