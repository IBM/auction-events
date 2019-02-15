/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

// predefined listing states
const ListingState = {
    ForSale: {code: 1, text: 'FOR_SALE'},
    ReserveNotMet: {code: 2, text: 'RESERVE_NOT_MET'},
    Sold: {code: 3, text: 'SOLD'},  
};

class AuctionEvents extends Contract {

    async instantiate(ctx) {
        console.info('instantiate');
        let emptyList = [];
        await ctx.stub.putState('members', Buffer.from(JSON.stringify(emptyList)));
        await ctx.stub.putState('sellers', Buffer.from(JSON.stringify(emptyList)));
    }

    // add a seller object to the blockchain state identifited by their email
    async AddSeller(ctx, email, companyName, balance) {

        let seller = {
            email: email,
            companyName: companyName,            
            balance: Number(balance),
            products: [],
            type: 'seller'
        };
        await ctx.stub.putState(email, Buffer.from(JSON.stringify(seller)));

        // add email to 'sellers' key
        let sellersData = await ctx.stub.getState('sellers');
        if (sellersData) {
            let sellers = JSON.parse(sellersData.toString());
            sellers.push(email);
            await ctx.stub.putState('sellers', Buffer.from(JSON.stringify(sellers)));
        } else {
            throw new Error('sellers not found');
        }

        // return seller object
        return JSON.stringify(seller);
    }


    // add a member object to the blockchain state identifited by their email
    async AddMember(ctx, email, firstName, lastName, balance) {

        let member = {
            email: email,
            firstName: firstName,
            lastName: lastName,
            balance: Number(balance),
            products: [],            
            type: 'member',
        };
        await ctx.stub.putState(email, Buffer.from(JSON.stringify(member)));

        //add email to 'member' key
        let membersData = await ctx.stub.getState('members');
        if (membersData) {
            let members = JSON.parse(membersData.toString());
            members.push(email);
            await ctx.stub.putState('members', Buffer.from(JSON.stringify(members)));
        } else {
            throw new Error('members not found');
        }

        // return buyer object
        return JSON.stringify(member);
    }

    async AddProduct(ctx, productId, description, ownerId) {

        // verify id and retreive seller
        let sellerData = await ctx.stub.getState(ownerId);
        let seller;
        if (sellerData) {
            seller = JSON.parse(sellerData.toString());
            if (seller.type !== 'seller') {
                throw new Error('seller not identified');
            }
        } else {
            throw new Error('seller not found');
        }

        let product = {
            productId: productId,
            description: description,
            ownerId: ownerId
        };

        //store product identified by productId
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

        //add product to seller
        seller.products.push(productId);
        await ctx.stub.putState(ownerId, Buffer.from(JSON.stringify(seller)));

        // return product object
        return JSON.stringify(product);
    }

    async StartBidding(ctx, listingId, reservePrice, productId) {

        // store listing identified by listingId
        let productListing = {
            listingId: listingId,
            reservePrice: Number(reservePrice),
            state: JSON.stringify(ListingState.ForSale),
            productId: productId,
            offers: []
        };        
        await ctx.stub.putState(listingId, Buffer.from(JSON.stringify(productListing)));

        // get product
        let productData = await ctx.stub.getState(productId);
        let product;
        if (productData) {
            product = JSON.parse(productData.toString());
        } else {
            throw new Error('product not found');
        }

        // define and set tradeEvent
        let tradeEvent = {
            type: "Start Auction",
            ownerId: product.ownerId,
            id: productListing.listingId,
            description: product.description,
            status: productListing.state,
            amount: productListing.reservePrice,
            buyerId: product.ownerId
        };
        await ctx.stub.setEvent('TradeEvent', Buffer.from(JSON.stringify(tradeEvent)));

        // return listing object
        return JSON.stringify(productListing);
        
    }

    async Offer(ctx, bidPrice, listingId, memberId) {

        // get listing
        let listingData = await ctx.stub.getState(listingId);
        let listing;
        if (listingData) {
            listing = JSON.parse(listingData.toString());
        } else {
            throw new Error('product not found');
        }

        // get product from the listing
        let productData = await ctx.stub.getState(listing.productId);
        let product;
        if (productData) {
            product = JSON.parse(productData.toString());
        } else {
            throw new Error('product not found');
        }

        // verify and retrieve member
        let memberData = await ctx.stub.getState(memberId);
        let member;
        if (memberData) {
            member = JSON.parse(memberData.toString());
            if (member.type !== 'member') {
                throw new Error('member not identified');
            }
        } else {
            throw new Error('member not found');
        }

        // ensure valid offer
        if (listing.state !== JSON.stringify(ListingState.ForSale)) {
            throw new Error('Listing is not FOR SALE');
        }
        if (Number(bidPrice) < listing.reservePrice) {
            throw new Error('Bid amount less than reserve amount!!');
        }
        if (member.balance < Number(bidPrice)) {
            throw new Error('Insufficient fund for bid. Please verify the placed bid!!');
        }

        //add offer to listing
        let offer = {
            bidPrice: Number(bidPrice),
            memberId: memberId
        };
        listing.offers.push(offer);
        await ctx.stub.putState(listingId, Buffer.from(JSON.stringify(listing)));

        // define and set tradeEvent
        let tradeEvent = {
            type: "Offer",
            ownerId: product.ownerId,
            id: listing.listingId,
            description: product.description,
            status: listing.state,
            amount: Number(bidPrice),
            buyerId: memberId
        };
        await ctx.stub.setEvent('TradeEvent', Buffer.from(JSON.stringify(tradeEvent)));

        // return listing object
        return JSON.stringify(listing);

    }

    async CloseBidding(ctx, listingId) {

        // get listing
        let listingData = await ctx.stub.getState(listingId);
        let listing;
        if (listingData) {
            listing = JSON.parse(listingData.toString());
        } else {
            throw new Error('product not found');
        }

        // get product from the listing
        let productData = await ctx.stub.getState(listing.productId);
        let product;
        if (productData) {
            product = JSON.parse(productData.toString());
        } else {
            throw new Error('product not found');
        }

        // ensure valid request
        if (listing.state !== JSON.stringify(ListingState.ForSale)) {
            throw new Error('Listing is not FOR SALE');
        }

        // assign initial values
        listing.state = JSON.stringify(ListingState.ReserveNotMet);
        let originalOwner = product.ownerId;
        let highestOffer = null;

        // verify id and retreive seller
        let sellerData = await ctx.stub.getState(originalOwner);
        let seller;
        if (sellerData) {
            seller = JSON.parse(sellerData.toString());
            if (seller.type !== 'seller') {
                throw new Error('seller not identified');
            }
        } else {
            throw new Error('seller not found');
        }

        if(listing.offers && listing.offers.length > 0) {
            // sort the bids by bidPrice
            listing.offers.sort(function(a, b) {
              return(b.bidPrice - a.bidPrice);
            });
            highestOffer = listing.offers[0];
            if(highestOffer.bidPrice >= listing.reservePrice) {
                
                // verify and retrieve buyer with the highest offer
                let buyerId = highestOffer.memberId;
                let buyerData = await ctx.stub.getState(buyerId);
                let buyer;
                if (buyerData) {
                    buyer = JSON.parse(buyerData.toString());
                    if (buyer.type !== 'member') {
                        throw new Error('member not identified');
                    }
                } else {
                    throw new Error('member not found');
                }

                // update the balance of the seller
                seller.balance += highestOffer.bidPrice;
                // update the balance of the buyer
                buyer.balance -= highestOffer.bidPrice;
                // transfer the product to the buyer
                product.ownerId = buyerId;

                await ctx.stub.putState(originalOwner, Buffer.from(JSON.stringify(seller)));
                await ctx.stub.putState(buyerId, Buffer.from(JSON.stringify(buyer)));
                await ctx.stub.putState(listing.productId, Buffer.from(JSON.stringify(product)));
                
                // mark the listing as SOLD
                listing.state = JSON.stringify(ListingState.Sold);
            }
        }

        await ctx.stub.putState(listingId, Buffer.from(JSON.stringify(listing)));

        // define and set tradeEvent
        let tradeEvent = {
            type: "End Auction",
            ownerId: originalOwner,
            id: listing.listingId,
            description: product.description,
            status: listing.state,
            amount: highestOffer.bidPrice,
            buyerId: product.ownerId
        };
        await ctx.stub.setEvent('TradeEvent', Buffer.from(JSON.stringify(tradeEvent)));

        // return listing object
        return JSON.stringify(listing);

    }

    // get the state from key
    async GetState(ctx, key) {

        let data = await ctx.stub.getState(key);
        let jsonData = JSON.parse(data.toString());
        return JSON.stringify(jsonData);
    
    }

}

module.exports = AuctionEvents;
