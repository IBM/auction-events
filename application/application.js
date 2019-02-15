
'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const { FileSystemWallet, Gateway } = require('fabric-network');


// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), '_idwallet');
const wallet = new FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);


async function main(){

    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {

        // A gateway defines the peers used to access Fabric networks
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'User1@org1.example.com', discovery: { enabled: false } });
 
        console.log('Connected to Fabric gateway.');

        // Get addressability to network
        const network = await gateway.getNetwork('mychannel');

        console.log('Got addressability to network');

        // Get addressability to  contract
        const contract = await network.getContract('auction');

        console.log('Got addressability to contract');

        console.log('\nSubmit first transaction.');
    
        var sellerEmail = "auction@acme.org";
        var sellerName = "ACME";
        var sellerBalance = "100";

        const addSellerResponse = await contract.submitTransaction('AddSeller', sellerEmail, sellerName, sellerBalance);
        console.log('addSellerResponse: ');
        console.log(JSON.parse(addSellerResponse.toString()));

        var memberAEmail = "memberA@acme.org";
        var memberAFirstName = "Amy";
        var memberALastName = "Williams";
        var memberABalance = "1000";

        const addMemberAResponse = await contract.submitTransaction('AddMember', memberAEmail, memberAFirstName, memberALastName, memberABalance);
        console.log('addMemberAResponse: ');
        console.log(JSON.parse(addMemberAResponse.toString()));

        var memberBEmail = "memberB@acme.org";
        var memberBFirstName = "Billy";
        var memberBLastName = "Thompson";
        var memberBBalance = "1000";

        const addMemberBResponse = await contract.submitTransaction('AddMember', memberBEmail, memberBFirstName, memberBLastName, memberBBalance);
        console.log('addMemberBResponse: ');
        console.log(JSON.parse(addMemberBResponse.toString()));

        var productId = "p1";
        var description = "Sample Product";

        const addProductResponse = await contract.submitTransaction('AddProduct', productId, description, sellerEmail);
        console.log('addProductResponse: ');
        console.log(JSON.parse(addProductResponse.toString()));

        // can start emiting events for the auction transactions

        var listingId = "l1";
        var reservePrice = "50";

        const startBiddingResponse = await contract.submitTransaction('StartBidding', listingId, reservePrice, productId);
        console.log('startBiddingResponse: ');
        console.log(JSON.parse(startBiddingResponse.toString()));

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

    } catch (error) {
        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);
    } finally {
        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        await gateway.disconnect();
    }
}

// invoke the main function, can catch any error that might escape
main().then(()=>{
    console.log('done');
}).catch((e)=>{
    console.log('Final error checking.......');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);
});