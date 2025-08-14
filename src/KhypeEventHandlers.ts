import { KHYPE, Storage, User } from "generated";
import { storageID } from "./constants";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function safeStringify(obj: any) {
    return JSON.stringify(
        obj,
        (_k, v) => typeof v === "bigint" ? `${v.toString()}n` : v,
    );
}

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

    // snapshot only needs to be updated if the transfer is from or to the zero address
    if (from === ZERO_ADDRESS || to === ZERO_ADDRESS) {
        let updatedTotalSupply;

        // if the transfer is from the zero address, it means tokens are being minted
        // if the transfer is to the zero address, it means tokens are being burned
        if (from === ZERO_ADDRESS) {
            updatedTotalSupply = lastTSSnapshot.totalSupply + value;
            context.MintBurnSnapshot.set({
                ...lastMBSnapshot,
                mints: lastMBSnapshot.mints + value,
            });
        } else {
            updatedTotalSupply = lastTSSnapshot.totalSupply - value;
            context.MintBurnSnapshot.set({
                ...lastMBSnapshot,
                burns: lastMBSnapshot.burns + value,
            });
        }

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
        } else {
            // update the last snapshot with the new total supply
            context.TotalSupplySnapshot.set({
                ...lastTSSnapshot,
                totalSupply: updatedTotalSupply,
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
