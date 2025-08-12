import { KHYPE, User } from "generated";

KHYPE.Transfer.handler(async ({ event, context }) => {
    const amount = event.params.value;
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    const from = event.params.from;
    const to = event.params.to;

    const sender = await context.User.get(from);
    const receiver = await context.User.get(to);

    // Update sender balance only if not zero address
    if (from !== zeroAddress) {
        if (sender) {
            context.User.set({
                ...sender,
                balance: sender.balance - amount,
            });
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
