import { StakingManager } from "generated";

// L1OperationProcessed Event Handler
// If OperationType is 0 | 1 | 2, then it is a delegation operation
// If OperationType is 3 | 4, then it is a withdrawal operation
StakingManager.L1DelegationProcessed.handler(async ({ event, context }) => {
    // get params from the event
    const { amount, staking, validator, operationType } = event.params;

    // get the validator from db or create a new one if it doesn't exist
    const validatorDelegation = await context.ValidatorDelegations
        .getOrCreate({
            id: `${validator}`,
            validator: validator,
            totalDelegation: 0n,
            totalDelegationPrecision: Number(0) / 1e8, // Assuming 18 decimals for precision
        });

    if (operationType === 0n || operationType === 1n || operationType === 2n) {
        console.log(
            `Delegation ${validator} with amount ${amount}`,
        );
        // increase delegation if operationType is 0, 1, or 2
        const updatedDelegation = {
            ...validatorDelegation,
            totalDelegation: validatorDelegation.totalDelegation + amount,
            totalDelegationPrecision:
                validatorDelegation.totalDelegationPrecision +
                (Number(amount) / 1e8),
        };

        // update the validator delegation
        context.ValidatorDelegations.set(updatedDelegation);
    } else if (operationType === 3n || operationType === 4n) {
        console.log(
            `Withdrawal ${validator} with amount ${amount}`,
        );
        // decrease delegation if operationType is 3 or 4
        const updatedDelegation = {
            ...validatorDelegation,
            totalDelegation: validatorDelegation.totalDelegation - amount,
            totalDelegationPrecision:
                validatorDelegation.totalDelegationPrecision -
                (Number(amount) / 1e8),
        };

        // update the validator delegation
        context.ValidatorDelegations.set(updatedDelegation);
    } else {
        // this should not happen, but just in case
        console.error(`Unhandled operation type: ${operationType}`);
    }
});

// EmergencyWithdrawalExecuted Event Handler
StakingManager.EmergencyWithdrawalExecuted.handler(
    async ({ event, context }) => {
        // get params from the event
        const { validator, amount } = event.params;

        try {
            const validatorDelegation = await context.ValidatorDelegations
                .getOrThrow(
                    `${validator}`,
                    "Can't withdraw without delegating to validator first",
                );

            const updatedDelegation = {
                ...validatorDelegation,
                totalDelegation: validatorDelegation.totalDelegation - amount,
                totalDelegationPrecision:
                    validatorDelegation.totalDelegationPrecision -
                    (Number(amount) / 1e18),
            };

            // update the validator delegation
            context.ValidatorDelegations.set(updatedDelegation);
        } catch (error) {
            console.error(
                `Emergency withdrawal for validator without delegation: ${validator}`,
                error,
            );
        }
    },
);


