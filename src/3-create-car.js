import { cryptoWaitReady, mnemonicToMiniSecret, sr25519PairFromSeed, sr25519Sign } from '@polkadot/util-crypto';
import { u8aToHex, stringToU8a, u8aConcat } from '@polkadot/util';
import { connectSdk } from './utils/connect-sdk.js';
import { getRandomInt } from './utils/random.js';

const createToken = async () => {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Run this command: node ./src/3-create-car.js {collectionId} {address} {nickname}");
    process.exit(1);
  }

  const mnemonic = process.env.MNEMONIC;

  await cryptoWaitReady();

  const { account, sdk } = await connectSdk();
  const { publicKey, secretKey } = sr25519PairFromSeed(mnemonicToMiniSecret(mnemonic));

  const message = stringToU8a('Authorize decryption');
  const signedMessage = sr25519Sign(publicKey, { publicKey, secretKey }, message);
  const signedMessageHex = u8aToHex(signedMessage);

  const encryptionKey = signedMessage;
  const [collectionId, owner, nickname] = args;
  const nicknameBytes = stringToU8a(nickname);
  
  const encryptedNicknameBytes = u8aConcat(nicknameBytes, encryptionKey);
  const encryptedNicknameHex = u8aToHex(encryptedNicknameBytes);

  const tokenImage =
    getRandomInt(2) === 0
      ? "https://gateway.pinata.cloud/ipfs/QmfWKy52e8pyH1jrLu4hwyAG6iwk6hcYa37DoVe8rdxXwV"
      : "https://gateway.pinata.cloud/ipfs/QmNn6jfFu1jE7xPC2oxJ75kY1RvA2tz9bpQDsqweX2kDig";

  const tokenTx = await sdk.token.createV2({
    collectionId,
    image: tokenImage,
    owner,
    attributes: [
      {
        trait_type: "Nickname",
        value: encryptedNicknameHex,
      },
      {
        trait_type: "Victories",
        value: 0,
      },
      {
        trait_type: "Defeats",
        value: 0,
      },
    ],
  });

  const token = tokenTx.parsed;
  if (!token) throw Error("Cannot parse token");

  console.log(
    `Explore your NFT: https://uniquescan.io/opal/tokens/${token.collectionId}/${token.tokenId}`
  );

  process.exit(0);
};

createToken().catch((e) => {
  console.log("Something went wrong during token creation");
  throw e;
});
