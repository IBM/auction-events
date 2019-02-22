
'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode Invoke
 */

var util = require('util');
const fs = require('fs');
//const yaml = require('js-yaml');
const path = require('path');
const { FileSystemWallet, Gateway } = require('fabric-network');
var Fabric_Client = require('fabric-client');
var fabric_client = new Fabric_Client();
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


// Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    var member_user = null;

    // A gateway defines the peers used to access Fabric networks
    
    await gateway.connect(ccp, { wallet, identity: appAdmin , discovery: {enabled: true, asLocalhost:false }});
    console.log('Connected to Fabric gateway.');

    const network = await gateway.getNetwork(channelName);
    // Get addressability to network

    const client = gateway.getClient();
    
    const channel = client.getChannel('mychannel');
    console.log('Got addressability to channel');
    
    const channel_event_hub = channel.getChannelEventHub('173.193.79.114:30324');

	var user = await client.getUserContext('app-admin', true);

    // Get addressability to  contract
    const contract = await network.getContract(smartContractName);
    console.log('Got addressability to contract');

    var tx_id = client.newTransactionID(true);
    console.log("Assigning transaction_id: ", tx_id._transaction_id);



// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
Fabric_Client.newDefaultKeyValueStore({ path: walletPath
}).then((wallet) => {
	// assign the store to the fabric client
	/*client.setStateStore(wallet);
	var crypto_suite = client.getCryptoSuite();
	// use the same location for the state store (where the users' certificate are kept)
	// and the crypto store (where the users' keys are kept)
	var crypto_store = Fabric_Client.newCryptoKeyStore({path: walletPath});
	crypto_suite.setCryptoKeyStore(crypto_store);
	client.setCryptoSuite(crypto_suite);*/

	// get the enrolled user from persistence, this user will sign all requests
	//return client.getUserContext('app-admin', true);
	return user
}).then((user_from_store) => {
	if (user_from_store && user_from_store.isEnrolled()) {
		console.log('Successfully loaded user1 from persistence');
		member_user = user_from_store;
	} else {
		throw new Error('Failed to get user1.... run registerUser.js');
	}

	// get a transaction id object based on the current user assigned to fabric client
	tx_id = client.newTransactionID(true);
	console.log("Assigning transaction_id: ", tx_id._transaction_id); 

    var listingId = "l1";
    var reservePrice = "50";
    var productId = "p1";
	
	// must send the proposal to endorsing peers
	var request = {
		//targets: let default to the peer assigned to the client
		chaincodeId: 'auction',
		fcn: 'StartBidding',
		args: ['l1', '50', 'p1'],
		chainId: 'mychannel',
		txId: tx_id
	};

	// send the transaction proposal to the peers
	return channel.sendTransactionProposal(request);
}).then((results) => {
	var proposalResponses = results[0];
	var proposal = results[1];
	let isProposalGood = false;
	if (proposalResponses && proposalResponses[0].response &&
		proposalResponses[0].response.status === 200) {
			isProposalGood = true;
			console.log('Transaction proposal was good');
		} else {
			console.error('Transaction proposal was bad');
		}
	if (isProposalGood) {
		console.log(util.format(
			'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
			proposalResponses[0].response.status, proposalResponses[0].response.message));

		// build up the request for the orderer to have the transaction committed
		var request = {
			proposalResponses: proposalResponses,
			proposal: proposal
		};

		// set the transaction listener and set a timeout of 30 sec
		// if the transaction did not get committed within the timeout period,
		// report a TIMEOUT status
		var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
		var promises = [];

		var sendPromise = channel.sendTransaction(request);
		promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

		// get an eventhub once the fabric client has a user assigned. The user
		// is required because the event registration must be signed
		let event_hub = channel.newChannelEventHub('173.193.79.114:30324');
		
		event_hub.connect(true);
		var regid = event_hub.registerChaincodeEvent('auction', 'TradeEvent', function(event) {
			console.log(`event`);
			console.log(event);
			console.log(util.format("Custom event received, payload: %j\n", event.payload.toString()));
			event_hub.unregisterChaincodeEvent(regid);
		});
        
    
		// using resolve the promise so that result status may be processed
		// under the then clause rather than having the catch clause process
		// the status
		let txPromise = new Promise((resolve, reject) => {
			let handle = setTimeout(() => {
				event_hub.unregisterTxEvent(transaction_id_string);
				event_hub.disconnect();
				resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
			}, 3000);
			event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
				// this is the callback for transaction event status
				// first some clean up of event listener
				clearTimeout(handle);

				// now let the application know what happened
				var return_status = {event_status : code, tx_id : transaction_id_string};
				if (code !== 'VALID') {
					console.error('The transaction was invalid, code = ' + code);
					resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
				} else {
					console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
					resolve(return_status);
				}
			}, (err) => {
				//this is the callback if something goes wrong with the event registration or processing
				reject(new Error('There was a problem with the eventhub ::'+err));
			},
				{disconnect: true} //disconnect when complete
			);
			event_hub.connect();

		});
		promises.push(txPromise);

		return Promise.all(promises);
	} else {
		console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
	}
}).then((results) => {
	console.log('Send transaction promise and event listener promise have completed');
	//console.log(results);
	// check the results in the order the promises were added to the promise all list
	
	if (results && results[0] && results[0].status === 'SUCCESS') {
		console.log('Successfully sent transaction to the orderer.');
	} else {
		console.error('Failed to order the transaction. Error code: ' + results[0].status);
	}

	if(results && results[1] && results[1].event_status === 'VALID') {
		console.log('Successfully committed the change to the ledger by the peer');
	} else {
		console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
	}
}).catch((err) => {
	console.error('Failed to invoke successfully :: ' + err);
});


}

main();
