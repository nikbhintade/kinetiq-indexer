import { KHYPE, User } from "generated";
import { storageID } from "./constants";

function safeStringify(obj: any) {
    return JSON.stringify(
        obj,
        (_k, v) => typeof v === "bigint" ? `${v.toString()}n` : v,
    );
}


KHYPE.Transfer.handler(async ({ event, context }) => {
    const amount = event.params.value;
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    const from = event.params.from;
    const to = event.params.to;

    const sender = await context.User.get(from);
    const receiver = await context.User.get(to);

    // increase total supply
    if (from === zeroAddress) {
        // get last block
        const storage = await context.Storage.get(storageID);

        // get totalSupplySnapshot for last block
        const lastSnapshot = await context.TotalSupplySnapshot.get(
            storage?.lastBlockNumber.toString() || "0",
        );

        // if no snapshot exists, create one
        if (!lastSnapshot) {
            console.log(
                `Creating new TotalSupplySnapshot for block ${event.block.number}`,
            );
            // create a new snapshot
            context.TotalSupplySnapshot.set({
                id: event.block.number.toString(),
                totalSupply: BigInt(amount),
            });
        } else {
            // update the existing snapshot
            context.TotalSupplySnapshot.set({
                ...lastSnapshot,
                totalSupply: lastSnapshot.totalSupply + amount,
            });
        }

        // update storage with the new block number
        context.Storage.set({
            id: storageID,
            lastBlockNumber: event.block.number,
        });
    }

    // decrease total supply
    if (to === zeroAddress) {
        // get last block
        const storage = await context.Storage.get(storageID);

        // get totalSupplySnapshot for last block
        const lastSnapshot = await context.TotalSupplySnapshot.get(
            storage?.lastBlockNumber.toString() || "0",
        );

        // if no snapshot exists, create one
        if (!lastSnapshot) {
            context.TotalSupplySnapshot.set({
                id: event.block.number.toString(),
                totalSupply: BigInt(amount),
            });
        } else {
            // update the existing snapshot
            context.TotalSupplySnapshot.set({
                ...lastSnapshot,
                totalSupply: lastSnapshot.totalSupply - amount,
            });
        }

        // update storage with the new block number
        context.Storage.set({
            id: storageID,
            lastBlockNumber: event.block.number,
        });
    }

    // Update sender balance only if not zero address
    
    if (from !== zeroAddress) {
        if (sender) {
            
        } else {
            console.warn(`Unexpected non-zero sender: ${from}`);
            context.User.set({
                id: from,
                balance: BigInt(0),
                balancePrecision: 0,
            });
        }
    }

    // Update receiver balance
    if (receiver) {
        context.User.set({
            ...receiver,
            balance: receiver.balance + amount,
        });
    } else {
        context.User.set({
            id: to,
            balance: amount,
            balancePrecision: 0,
        });
    }
});
