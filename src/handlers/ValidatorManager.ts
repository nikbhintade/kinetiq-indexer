import { ValidatorManager } from "generated";

ValidatorManager.ValidatorActivated.handler(async ({ event, context }) => {
    const { validator } = event.params;

    // Create or update the validator status
    await context.ValidatorStatus.getOrCreate({
        id: validator,
        address: validator,
        active: true,
    });

    console.log(`Validator activated: ${validator}`);
});

ValidatorManager.ValidatorDeactivated.handler(async ({ event, context }) => {
    const { validator } = event.params;

    // Update the validator status to inactive
    await context.ValidatorStatus.getOrCreate({
        id: validator,
        address: validator,
        active: false,
    });

    console.log(`Validator deactivated: ${validator}`);
});

ValidatorManager.ValidatorReactivated.handler(async ({ event, context }) => {
    const { validator } = event.params;

    // Update the validator status to active
    await context.ValidatorStatus.getOrCreate({
        id: validator,
        address: validator,
        active: true,
    });

    console.log(`Validator reactivated: ${validator}`);
});

// TODO: Implementation for RewardEventReported Snapshot
// NOTE: The total delegated amount various from real delegated amount as RewardEventReported events are 
// emitted very day or so. Just something to keep in mind.

ValidatorManager.RewardEventReported.handler(async ({ event, context }) => {
    const { validator, amount } = event.params;
    try {
        const validatorDelegation = await context.ValidatorDelegations
            .getOrThrow(validator, "Validator not found for reward event");

        const updatedDelegation = {
            ...validatorDelegation,
            totalDelegation:
                BigInt(Number(validatorDelegation.totalDelegation) / 1e10) +
                amount,
            totalDelegationPrecision:
                validatorDelegation.totalDelegationPrecision +
                (Number(amount) / 1e18), // Assuming 18 decimals for precision
        };

        // Update the validator delegation with the new reward
        context.ValidatorDelegations.set(updatedDelegation);
    } catch (error) {
        console.error(
            `Error processing reward event for validator ${validator}:`,
            error,
        );
    }
});

ValidatorManager.SlashingEventReported.handler(async ({ event, context }) => {
    const { validator, amount } = event.params;
    try {
        const validatorDelegation = await context.ValidatorDelegations
            .getOrThrow(validator, "Validator not found for slashing event");

        const updatedDelegation = {
            ...validatorDelegation,
            totalDelegation:
                BigInt(Number(validatorDelegation.totalDelegation) / 1e10) -
                amount,
            totalDelegationPrecision:
                validatorDelegation.totalDelegationPrecision -
                (Number(amount) / 1e18), // Assuming 18 decimals for precision
        };

        // Update the validator delegation with the new slashing
        context.ValidatorDelegations.set(updatedDelegation);
    } catch (error) {
        console.error(
            `Error processing slashing event for validator ${validator}:`,
            error,
        );
    }
});
