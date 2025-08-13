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

    // get last block from storage
    let storage = await context.Storage.getOrCreate({
        id: storageID,
        lastBlockNumber: event.block.number,
    });

    // get the last snapshot if there isn't one create it
    const lastSnapshot = await context.TotalSupplySnapshot.getOrCreate({
        id: storage.lastBlockNumber.toString(),
        blockNumber: storage.lastBlockNumber,
        totalSupply: BigInt(0),
    });

    // snapshot only needs to be updated if the transfer is from or to the zero address
    if (from === ZERO_ADDRESS || to === ZERO_ADDRESS) {
        let updatedTotalSupply;

        // if the transfer is from the zero address, it means tokens are being minted
        // if the transfer is to the zero address, it means tokens are being burned
        if (from === ZERO_ADDRESS) {
            updatedTotalSupply = lastSnapshot.totalSupply + value;
        } else {
            updatedTotalSupply = lastSnapshot.totalSupply - value;
        }

        // if the storage's last block number is not the same as the current block number,
        // we need to create a new snapshot for the current block
        // otherwise, we update the last snapshot
        if (storage.lastBlockNumber !== event.block.number) {
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
                ...lastSnapshot,
                totalSupply: updatedTotalSupply,
            });
        }
    }
});
