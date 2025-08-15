import { KHYPE, Storage, User } from "generated";
import { storageID, totalSupplyID, ZERO_ADDRESS } from "../constants";

KHYPE.Transfer.handler(async ({ event, context }) => {
    const { from, to, value } = event.params;

    const timestamp = event.block.timestamp;
    const date = new Date(timestamp * 1000);
    date.setHours(0, 0, 0, 0);
    const midnightTimestamp = Math.floor(date.getTime() / 1000);

    /*//////////////////////////////////////////////////////////////
                             SNAPSHOT LOGIC
    //////////////////////////////////////////////////////////////*/

    // get last block from storage
    let storage = await context.Storage.getOrCreate({
        id: storageID,
        lastBlockNumber: event.block.number,
    });

    // get the last snapshot if there isn't one create it
    const lastTSSnapshot = await context.TotalSupplySnapshot.getOrCreate({
        id: storage.lastBlockNumber.toString(),
        blockNumber: storage.lastBlockNumber,
        totalSupply: BigInt(0),
    });

    const lastMBSnapshot = await context.MintBurnSnapshot.getOrCreate({
        id: midnightTimestamp.toString(),
        date: midnightTimestamp,
        mints: BigInt(0),
        burns: BigInt(0),
    });

    /*//////////////////////////////////////////////////////////////
                              FLAWED LOGIC
    //////////////////////////////////////////////////////////////*/

    // following logic for total supply snapshot is totally flawed as for snapshot we are taking total supply from the last snapshot
    // but that would have been updated but we didn't save it so that value is not accurate

    // the snapshot was not accurately representing the total supply at the end of the block. Instead, it was getting updated till next snap shot is taken. That gives us correct current total supply but wrong total supply at the particular block.

    // snapshot only needs to be updated if the transfer is from or to the zero address
    if (from === ZERO_ADDRESS || to === ZERO_ADDRESS) {
        let updatedTotalSupply;

        const totalSupply = await context.TotalSupply.getOrCreate({
            id: totalSupplyID,
            totalSupply: BigInt(0),
            totalSupplyPrecision: 0,
        });

        // if the transfer is from the zero address, it means tokens are being minted
        // if the transfer is to the zero address, it means tokens are being burned
        if (from === ZERO_ADDRESS) {
            updatedTotalSupply = totalSupply.totalSupply + value;
            context.MintBurnSnapshot.set({
                ...lastMBSnapshot,
                mints: lastMBSnapshot.mints + value,
            });
        } else {
            updatedTotalSupply = totalSupply.totalSupply - value;
            context.MintBurnSnapshot.set({
                ...lastMBSnapshot,
                burns: lastMBSnapshot.burns + value,
            });
        }

        context.TotalSupply.set({
            ...totalSupply,
            totalSupply: updatedTotalSupply,
        });

        // if the storage's last block number is not the same as the current block number,
        // we need to create a new snapshot for the current block
        // otherwise, we update the last snapshot
        if (event.block.number - storage.lastBlockNumber > 2500) {
            // create a new snapshot for the current block
            context.TotalSupplySnapshot.set({
                id: event.block.number.toString(),
                blockNumber: event.block.number,
                totalSupply: updatedTotalSupply,
            });

            // update the storage's last block number
            context.Storage.set({
                id: storageID,
                lastBlockNumber: event.block.number,
            });
        }
    }

    /*//////////////////////////////////////////////////////////////
                             USER BALANCES
    //////////////////////////////////////////////////////////////*/

    if (from !== ZERO_ADDRESS) {
        // get the user entity for the sender
        const fromUser = await context.User.getOrCreate({
            id: from,
            balance: BigInt(0),
            balancePrecision: 0,
        });

        // update the sender's balance
        context.User.set({
            ...fromUser,
            balance: fromUser.balance - value,
        });
    }

    if (to !== ZERO_ADDRESS) {
        // get the user entity for the receiver
        const toUser = await context.User.getOrCreate({
            id: to,
            balance: BigInt(0),
            balancePrecision: 0,
        });

        // update the receiver's balance
        context.User.set({
            ...toUser,
            balance: toUser.balance + value,
        });
    }

    /*//////////////////////////////////////////////////////////////
                             MINTS & BURNS
    //////////////////////////////////////////////////////////////*/
});
