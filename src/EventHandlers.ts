// import "./handlers/KhypeEventHandlers";
// import "./handlers/ValidatorManager";
import "./handlers/StakingManager";

// import { StakingAccountant, StakingManager } from "generated";

// StakingManager.L1OperationAggregated.handler(async ({ event, context }) => {
//     const { staking, validator, addedAmount, operationType, newTotalAmount } =
//         event.params;

//     context.L1OperationAggregated.set({
//         id: `${staking}_${event.logIndex}_${event.block.timestamp}`,
//         staking: staking,
//         validator: validator,
//         addedAmount: addedAmount,
//         operationType: operationType,
//         newTotalAmount: newTotalAmount,
//     });
// });

// StakingAccountant.StakingManagerAuthorized.handler(
//     async ({ event, context }) => {
//         context.StakingManagerAuthorized.set({
//             id: `${event.logIndex}_${event.block.timestamp}`,
//             manager: event.params.manager,
//             token: event.params.token,
//         });
//     },
// );
