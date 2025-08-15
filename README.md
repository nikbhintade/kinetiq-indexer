## Kinetiq Indexer

Indexer for Kinetiq written with HyperIndex by Envio.

Tasks:

-   [x] Track kHYPE user balances
-   [ ] Track LST exchange rate with contract events (timeseries updated in db every min, not after every transaction I think that much accuracy is good enough for this dashboard, other calculations that depend on it will have error but I don't think that is an error. I will put a warning on the dashboard about this)
-   [ ] Delegated amount to validators
-   [ ] Withdrawal queue & confirmed withdrawals
-   [ ] Track kHYPE user balances

Event Handlers:

-   kHYPE
    -   [x] `Transfer`
-   Staking Manager
    -   [ ] `StakeReceived`
    -   [ ] `WithdrawalQueued`
    -   [ ] `WithdrawalCancelled`
    -   [ ] `WithdrawalConfirmed`
    -   [ ] `Delegate`
    -   [ ] `ValidatorWithdrawal`

```solidity
    event StakeReceived(address indexed staking, address indexed staker, uint256 amount);
    event WithdrawalQueued(
        address indexed staking,
        address indexed user,
        uint256 indexed withdrawalId,
        uint256 kHYPEAmount,
        uint256 hypeAmount,
        uint256 feeAmount
    );
    event WithdrawalConfirmed(address indexed user, uint256 indexed withdrawalId, uint256 amount);
    event WithdrawalCancelled(
        address indexed user, uint256 indexed withdrawalId, uint256 amount, uint256 totalCancelled
    );
    event Delegate(address indexed staking, address indexed validator, uint256 amount);
    event ValidatorWithdrawal(address indexed staking, address indexed validator, uint256 amount);
```

## Extra

-   [ ] Figure out how StakingAccountant fits
-   [ ] Earn & vkHYPE
-   [ ] Any active iHYPE or HIP-3 deployments (on testnet, is anyone trying it with Kinetiq)
-   [ ] Create metrics list that needs to be tracked on dashboard
-   [ ] Wireframe for dashboard

## Notes

-   Get exchange rate:
    -   Need to use `StakedReceived` & `WithdrawalConfirmed` events from Staking Manager and `RewardEventReported` & `SlashingEventReported` from StakingAccountant.
    -   current total supply / net staked  = current total supply / ( sum stake received - sum withdrawal confirmed + all rewards - all slashing)

- To track delegations to validators, process `L1DelegationProcessed` event