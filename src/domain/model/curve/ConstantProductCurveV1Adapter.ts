import {
  GetCollateralPriceOptions,
  GetCollateralAmountOptions,
  GetTokenAmountOptions,
} from '../token';
import { GetTokenAmountSyncOptions } from '../token/GetTokenAmountSyncOptions';
import { AbstractCurveAdapter } from './AbstractCurveAdapter';
import { ConstantProductCurveV1 } from '@heliofi/launchpad-common';
import { GetCollateralAmountSyncOptions } from '../token/GetCollateralAmountSyncOptions';

export class ConstantProductCurveV1Adapter extends AbstractCurveAdapter {
  private readonly platformFeeBps: number = 100;

  private readonly curve = new ConstantProductCurveV1();

  getCollateralPrice(options: GetCollateralPriceOptions): Promise<bigint> {
    return this.getCollateralAmountByTokens({
      tokenAmount: options.tokenAmount,
      tradeDirection: 'BUY',
      curvePosition: options.curvePosition,
    });
  }

  async getCollateralAmountByTokens(
    options: GetCollateralAmountOptions,
  ): Promise<bigint> {
    const curvePosition =
      options.curvePosition ?? (await this.getCurvePosition());

    return this.curve.getCollateralAmountFromTokens({
      amount: options.tokenAmount,
      curvePosition,
      platformFeeBps: this.platformFeeBps,
      tradeDirection: options.tradeDirection,
    });
  }

  getCollateralAmountByTokensSync(
    options: GetCollateralAmountSyncOptions,
  ): bigint {
    const curvePosition = options.curvePosition;

    return this.curve.getCollateralAmountFromTokens({
      amount: options.tokenAmount,
      curvePosition,
      platformFeeBps: this.platformFeeBps,
      tradeDirection: options.tradeDirection,
    });
  }

  async getTokenAmountByCollateral(
    options: GetTokenAmountOptions,
  ): Promise<bigint> {
    const curvePosition =
      options.curvePosition ?? (await this.getCurvePosition());

    return this.curve.getTokensAmountFromCollateral({
      amount: options.collateralAmount,
      curvePosition,
      platformFeeBps: this.platformFeeBps,
      tradeDirection: options.tradeDirection,
    });
  }

  getTokenAmountByCollateralSync(options: GetTokenAmountSyncOptions): bigint {
    const curvePosition = options.curvePosition;

    return this.curve.getTokensAmountFromCollateral({
      amount: options.collateralAmount,
      curvePosition,
      platformFeeBps: this.platformFeeBps,
      tradeDirection: options.tradeDirection,
    });
  }
}
