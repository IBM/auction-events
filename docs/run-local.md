<!-- [![Build Status](https://travis-ci.org/IBM/blockchainbean.svg?branch=master)](https://travis-ci.org/IBM/blockchainbean) -->

# Hyperledger Fabric sample Using Event Handling with the next generation IBM Blockchain Platform

# Steps (Local Deployment)

1. [Clone the Repo](#step-1-clone-the-repo)
2. [Start the Fabric Runtime](#step-2-start-the-fabric-runtime)
3. [Install Contract](#step-3-install-contract)
4. [Instantiate Contract](#step-4-Instantiate-contract)
5. [Export Connection Details](#step-5-export-connection-details)
6. [Run the App](#step-5-run-the-app)

Note: This repo assumes you have [VSCode](https://code.visualstudio.com/download) 
and [IBM Blockchain VSCode extension](https://marketplace.visualstudio.com/items?itemName=IBMBlockchain.ibm-blockchain-platform) installed. If you don't, first install the 
latest version of VSCode, and then install the IBM Blockchain VSCode extension ensuring you 
have the correct [system requirements](https://marketplace.visualstudio.com/items?itemName=IBMBlockchain.ibm-blockchain-platform) to run the extension. You will need Docker as 
this is how the extension builds a development Hyperledger Fabric network with a click of a button.

## Step 1. Clone the Repo

Git clone this repo onto your computer in the destination of your choice, then go into the web-app folder:
```
HoreaPorutiu$ git clone https://github.com/IBM/auction-events
```

## Step 2. Start the Fabric Runtime

![startRuntime](https://user-images.githubusercontent.com/10428517/76370968-dea3ae80-62f5-11ea-8793-d04610e8bf30.gif)

- If you get errors like the gRPC error, you may need to download an earlier version of VSCode (1.39) [here](https://code.visualstudio.com/updates/v1_39). Note that if you are using Mac, make sure the VSCode in your ~/Applications
folder shows version 1.39 when you click on show details. You may need to 
move newer version into the trash, and then empty the trash for the older 
version to work.

- First, we need to go to our IBM Blockchain Extension. Click on the IBM Blockchain icon
  in the left side of VSCode (It looks like a square). 
- Next, start your local fabric by clicking on 
  *1 Org Local Fabric* in the **FABRIC ENVIRONMENTS** pane.
  
- Once the runtime is finished starting (this might take a couple of minutes), under *Local Fabric* you should see *Smart Contracts* and a section for both *installed* and *instantiated*.
## Step 3. Install and Instantiate Contract
* <b>Note that in the gif we install a different contract, but the process is the same</b>
![importContract](https://user-images.githubusercontent.com/10428517/76371236-e0ba3d00-62f6-11ea-82a1-bfa4798985b9.gif)
- Next, we have to import our contract before we can install it. Click on 
**View -> Open Command Pallette -> Import Smart Contract**. Next, click 
on the `gensupplychainnet@0.0.1.cds` file that is at the root of our directory.
This will be where you cloned this repo.

![installAndInstantiate](https://user-images.githubusercontent.com/10428517/76371514-bae16800-62f7-11ea-9038-039b0fac6967.gif)
- Now, let's click on *+ Install* and choose the peer that is available. Then the extension will ask you which package to 
 install. Choose *auction@0.0.1.cds*.
- Lastly, we need to instantiate the contract to be able to submit transactions 
on our network. Click on *+ Instantiate* and then choose *auction@0.0.1*.
- When promted for a function, a private data collection, or and endorsement 
policy, hit `enter` on your keyboard, which will take all of the defaults.
- This will instantiate the smart contract. This may take some time. You should see the contract under the *instantiated* tab on the left-hand side, once it 
is finished instantiating.


## Step 5. Run the App
To run the app, we will need to install dependencies for both our front-end and our back-end. 

#### Start the Server
  - First, navigate to the `application` directory, and install the node dependencies.
    ```bash
    cd application/
    npm install
    ```

  - Run the local scripts <b>(blockEventsLocal.js, contractEventsLocal.js and 
  transactionEventsLocal.js):</b>
    ```javascript
    application$ node blockEventsLocal.js
    Wallet path: /Users/Horea.Porutiu@ibm.com/Workdir/testDir/auction-events/application/local_fabric_wallet
    gateway connect
    *************** start block header **********************
    { number: '83',
      previous_hash: '83f26d8028a10a3eaecbbecfbca77224bc93f2c36b8c2793c7c226a8ec8124ef',
      data_hash: '5fa7442733b50ba60d4afc523726afeb49eaae95ee75bc403e17aec8ad241fde' }
    *************** end block header **********************
    *************** start block data **********************
    { signature: <Buffer 30 44 02 20 4c 00 6f 8e 36 0a 2d 24 23 65 dd c2 ee f6 b3 5c 21 6b 84 5f 48 00 24 c2 7b 60 e4 7f 5d 56 c1 c0 02 20 29 10 25 e4 8f 8c 75 cf 43 d2 91 8f ... >,
      payload: 
      { header: 
          { channel_header: 
            { type: 3,
              version: 1,
              timestamp: '2019-09-03T20:11:19.006Z',
              channel_id: 'mychannel',
              tx_id: 'a3f06a7f2481103e99291b84b5c89710a4caba9a37f7a9d0d20661473ce0ce43',
              epoch: '0',
              extension: <Buffer 12 09 12 07 61 75 63 74 69 6f 6e>,
              typeString: 'ENDORSER_TRANSACTION' },
            signature_header: 
            { creator: 
                { Mspid: 'Org1MSP',
                  IdBytes: '-----BEGIN CERTIFICATE-----\nMIICWDCCAf+gAwIBAgIUUsNH/Zb1AOtH4D7JRTL3q9FUS1swCgYIKoZIzj0EAwIw\nczELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\nbiBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\nE2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTkwODI2MTkwNzAwWhcNMjAwODI1MTkx\nMjAwWjBdMQswCQYDVQQGEwJVUzEXMBUGA1UECBMOTm9ydGggQ2Fyb2xpbmExFDAS\nBgNVBAoTC0h5cGVybGVkZ2VyMQ8wDQYDVQQLEwZjbGllbnQxDjAMBgNVBAMTBWFk\nbWluMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE92zzti5OPIMh2JKS1DVVj/dx\nD4RQdKNyEaDw9ecLVzjF6z+XI421hJpmKYx+lnecFRbZh8W8onqdMJE3pFl206OB\nhjCBgzAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQU+Bll\nIUtqcIhHgZDygVbnIUxAs7YwKwYDVR0jBCQwIoAg6R0IKR2epWGBHd6XwNuIrRVw\n6A9bAY5//7n8SP2bZp8wFwYDVR0RBBAwDoIMNjllMTBiYmEwZmVmMAoGCCqGSM49\nBAMCA0cAMEQCID5zRVDNaJXu2UEyIBDIwuT4k6sZQ3nV5B4S3XFqCM0ZAiAEYj2g\nzAkggSS46E5RJB7zQNteCIva1ZSK1+45oL4aOA==\n-----END CERTIFICATE-----\n' },
              nonce: <Buffer 6c e0 3d 50 75 78 5c d0 d6 2f 21 f5 58 b4 f9 0e 9e d4 37 98 b0 da 51 fb> } },
        data: 
          { actions: 
            [ { header: 
                  { creator: [Object],
                    nonce: <Buffer 6c e0 3d 50 75 78 5c d0 d6 2f 21 f5 58 b4 f9 0e 9e d4 37 98 b0 da 51 fb> },
                payload: { chaincode_proposal_payload: [Object], action: [Object] } } ] } } }
    *************** end block data **********************
    *************** start block metadata ****************
    { metadata: 
      [ { value: '\n\u0002\b\u0001',
          signatures: 
            [ { signature_header: 
                { creator: [Object],
                  nonce: <Buffer 6f 75 83 38 ef a9 bf 94 ad 5b 80 bd 71 90 d0 6c 94 34 e7 48 3f a8 b4 07> },
                signature: <Buffer 30 45 02 21 00 b2 24 db ee 56 7f 38 0e ee 5f 51 ee 9a af de db 63 09 eb b3 6a 5e 3d 7f bf 79 d0 ed 8d 68 71 8d 02 20 7f b5 b2 31 1e 6d 09 29 4a 0f ff ... > } ] },
        { value: { index: '1' }, signatures: [] },
        [ 0 ] ] }
    *************** end block metadata ****************
    ```

That's it! Good job! 
