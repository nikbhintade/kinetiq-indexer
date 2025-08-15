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
