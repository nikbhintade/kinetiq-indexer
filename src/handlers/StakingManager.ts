import { StakingManager } from "generated";

StakingManager.Delegate.handler(async ({ event, context }) => {
    console.log("Delegate event received");
    const { validator, staking, amount } = event.params;
    console.log(`Validator: ${validator}`);

    // Create or update the delegation status
    const delegation = await context.Delegations.getOrCreate({
        id: `${validator}_${staking}`,
        validator: validator,
        staking: staking,
        delegation: amount,
        firstDelegatedAt: event.block.timestamp,
    });

    // if the delegation was just created, then no need to update
    // if not then update the delegation amount
    if (delegation.firstDelegatedAt !== event.block.timestamp) {
        const updatedDelegation = {
            ...delegation,
            delegation: delegation.delegation + amount,
        };

        context.Delegations.set(updatedDelegation);
    }
});

StakingManager.ValidatorWithdrawal.handler(async ({ event, context }) => {
    console.log("Validator withdrawal event received");
    const { validator, staking, amount } = event.params;

    // Check if the delegation exists before updating
    // If it doesn't exist, then throw error and log it
    // The error shouldn't arise in normal operations, but it's good to handle it gracefully
    try {
        // Update the delegation status by reducing the amount
        const delegation = await context.Delegations.getOrThrow(
            `${validator}_${staking}`,
            "Delegation not found",
        );

        const updatedDelegation = {
            ...delegation,
            delegation: delegation.delegation - amount,
        };

        context.Delegations.set(updatedDelegation);
    } catch (error) {
        console.error(
            `Error updating delegation for validator ${validator} and staking ${staking}:`,
            error,
        );
    }
});
