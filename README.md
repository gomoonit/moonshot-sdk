# ⚠️ Moonshot is now [Moonit](https://github.com/gomoonit/moonit-sdk) 

Moonshot is upgraded into Moonit, see the Moonit SDK [npm link](https://www.npmjs.com/package/@moonit/sdk) and [Github Repository](https://github.com/gomoonit/moonit-sdk)

Follow this [simple migration guide](https://docs.moon.it/docs/editor#migration-from-wen-moon-ser-moonshot-sdk) in case you are currently using the old `@wen-moon-ser/moonshot-sdk` package.

## ℹ️ The documentation below is deprecated and is only for referencing the old SDK. Please use the new [documentation](https://docs.moon.it/) and [SDK](https://www.npmjs.com/package/@moonit/sdk) to get the latest updates.

## @wen-moon-ser/moonshot-sdk
Moonshot SDK for Solana helps calculate moonshot token prices at any point in the bonding curve. The package also allows the users to generate buy and sell transactions, provide the slippage amount and fix it to a trading side. 

By Following the example you can create your high-performance trading bot within minutes.

[npm link](https://www.npmjs.com/package/@wen-moon-ser/moonshot-sdk)

## Installation

Install the package using `yarn` or `npm`

```shell
npm i @wen-moon-ser/moonshot-sdk
# or
yarn add @wen-moon-ser/moonshot-sdk
```

## Direct RPC call prepare and send transaction

Generate a keypair and send funds for the right environment (devnet or mainnet).

### Buy example
```typescript
import { Environment, FixedSide, Moonshot } from '@wen-moon-ser/moonshot-sdk';
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import testWallet from '../test-wallet.json';

export const buyIx = async (): Promise<void> => {
  console.log('--- Buying token example ---');

  const rpcUrl = 'https://api.devnet.solana.com';

  const connection = new Connection(rpcUrl);

  const moonshot = new Moonshot({
    rpcUrl,
    environment: Environment.DEVNET,
    chainOptions: {
      solana: { confirmOptions: { commitment: 'confirmed' } },
    },
  });

  const token = moonshot.Token({
    mintAddress: '9ThH8ayxFCFZqssoZmodgvtbTiBmMoLWUqQhRAP89Y97',
  });

  const curvePos = await token.getCurvePosition();
  console.log('Current position of the curve: ', curvePos); // Prints the current curve position

  // make sure creator has funds
  const creator = Keypair.fromSecretKey(Uint8Array.from(testWallet));
  console.log('Creator: ', creator.publicKey.toBase58());

  const tokenAmount = 10000n * 1000000000n; // Buy 10k tokens

  // Buy example
  const collateralAmount = await token.getCollateralAmountByTokens({
    tokenAmount,
    tradeDirection: 'BUY',
  });

  const { ixs } = await token.prepareIxs({
    slippageBps: 500,
    creatorPK: creator.publicKey.toBase58(),
    tokenAmount,
    collateralAmount,
    tradeDirection: 'BUY',
    fixedSide: FixedSide.OUT, // This means you will get exactly the token amount and slippage is applied to collateral amount
  });

  const priorityIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 200_000,
  });

  const blockhash = await connection.getLatestBlockhash('confirmed');
  const messageV0 = new TransactionMessage({
    payerKey: creator.publicKey,
    recentBlockhash: blockhash.blockhash,
    instructions: [priorityIx, ...ixs],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  transaction.sign([creator]);
  const txHash = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    maxRetries: 0,
    preflightCommitment: 'confirmed',
  });

  console.log('Buy Transaction Hash:', txHash);
};
```

### Sell example
```typescript
import { Environment, FixedSide, Moonshot } from '@wen-moon-ser/moonshot-sdk';
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import testWallet from '../test-wallet.json';

export const sellIx = async (): Promise<void> => {
  console.log('--- Selling token example ---');
  const rpcUrl = 'https://api.devnet.solana.com';

  const connection = new Connection(rpcUrl);

  const moonshot = new Moonshot({
    rpcUrl,
    environment: Environment.DEVNET,
    chainOptions: {
      solana: { confirmOptions: { commitment: 'confirmed' } },
    },
  });

  const token = moonshot.Token({
    mintAddress: '9ThH8ayxFCFZqssoZmodgvtbTiBmMoLWUqQhRAP89Y97',
  });

  const curvePos = await token.getCurvePosition();
  console.log('Current position of the curve: ', curvePos); // Prints the current curve position

  // make sure creator has funds
  const creator = Keypair.fromSecretKey(Uint8Array.from(testWallet));
  console.log('Creator: ', creator.publicKey.toBase58());

  const tokenAmount = 10000n * 1000000000n; // Buy 10k tokens

  // Buy example
  const collateralAmount = await token.getCollateralAmountByTokens({
    tokenAmount,
    tradeDirection: 'SELL',
  });

  const { ixs } = await token.prepareIxs({
    slippageBps: 500,
    creatorPK: creator.publicKey.toBase58(),
    tokenAmount,
    collateralAmount,
    tradeDirection: 'SELL',
    fixedSide: FixedSide.IN, // This means you will pay exactly the token amount slippage is applied to collateral amount
  });

  const priorityIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 200_000,
  });

  const blockhash = await connection.getLatestBlockhash('confirmed');
  const messageV0 = new TransactionMessage({
    payerKey: creator.publicKey,
    recentBlockhash: blockhash.blockhash,
    instructions: [priorityIx, ...ixs],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  transaction.sign([creator]);
  const txHash = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    maxRetries: 0,
    preflightCommitment: 'confirmed',
  });

  console.log('Sell Transaction Hash:', txHash);
};
```


### Mint token using SDK

You can now mint tokens using the SDK. The SDK abstracts and handles the preparation, the submissions and the upload of all assets.
We introduce two new functions on `Moonshot` class: `prepareMintTx` and `submitMintTx`.

The `prepareMintTx` will gather all the necessary data to mint a token, and the function will return a transaction, which needs to be signed by creator wallet.
This can be done both in the browser or on the server side using KeyPair of the creator.

Example:
```typescript
import {
  CurveType,
  Environment,
  MigrationDex,
  Moonshot,
  SolanaSerializationService,
} from '@wen-moon-ser/moonshot-sdk';
import { Keypair } from '@solana/web3.js';
import testWallet from '../../test-wallet.json';

export const createMint = async (): Promise<void> => {
  console.log('--- Create mint example ---');

  const creator = Keypair.fromSecretKey(Uint8Array.from(testWallet));
  console.log('Creator: ', creator.publicKey.toBase58());

  const moonshot = new Moonshot({
    rpcUrl: 'https://api.devnet.solana.com',
    environment: Environment.DEVNET,
    chainOptions: {
      solana: { confirmOptions: { commitment: 'confirmed' } },
    },
  });

  const icon =
    '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Y29tL2V4aWYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NDI8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpVc2VyQ29tbWVudD5TY3JlZW5zaG90PC9leGlmOlVzZXJDb21tZW50PgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+NDA8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj4xNDQ8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjE0NDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+ClYMW38AAAANSURBVAgdY/gzT/0/AAccAsEB1H3vAAAAAElFTkSuQmCC';

  const prepMint = await moonshot.prepareMintTx({
    creator: creator.publicKey.toBase58(),
    name: 'SDK_MINT',
    symbol: 'SDK_MINT',
    curveType: CurveType.CONSTANT_PRODUCT_V1,
    migrationDex: MigrationDex.RAYDIUM,
    icon,
    description: 'Token minted using the @wen-moon-ser/moonshot-sdk',
    links: [{ url: 'https://x.com', label: 'x handle' }],
    banner: icon,
    tokenAmount: '42000000000',
  });

  const deserializedTransaction =
    SolanaSerializationService.deserializeVersionedTransaction(
      prepMint.transaction,
    );
  if (deserializedTransaction == null) {
    throw new Error('Failed to deserialize transaction');
  }

  deserializedTransaction.sign([creator]);

  const signedTransaction =
    SolanaSerializationService.serializeVersionedTransaction(
      deserializedTransaction,
    );

  const res = await moonshot.submitMintTx({
    tokenId: prepMint.tokenId,
    token: prepMint.token,
    signedTransaction,
  });

  console.log(res);
};

```
For full example code please refer to [moonshot-bot-examples](https://github.com/gomoonit/moonshot-bot-examples) repository.
> Please note the mint endpoint is subject to rate limit per IP address, current limit is **2 requests per 10 seconds**.

