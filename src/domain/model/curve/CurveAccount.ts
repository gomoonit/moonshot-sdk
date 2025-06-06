import { ContractCurrency, ContractCurveType } from '@heliofi/launchpad-common';

export interface CurveAccount {
  totalSupply: bigint;
  curveAmount: bigint;
  mint: string;
  decimals: number;
  collateralCurrency: ContractCurrency;
  curveType: ContractCurveType;
  marketcapThreshold: bigint; // !NOTE For FLAT_CURVE MC threshold is also collateral collected
  marketcapCurrency: ContractCurrency;
  migrationFee: bigint;
  coefB: number;
  bump: number;
  migrationTarget: number;
  priceIncrease: number;
}
