const express = require('express');
const { Connection, PublicKey } = require('@solana/web3.js');

const app = express();
const PORT = process.env.PORT || 3000;

const connection = new Connection("https://api.mainnet-beta.solana.com");

// Mint
const TOKEN_MINT = new PublicKey("2aWos2YsA6YjN5DHX77diRUx7SKMg7H1U8hqL2N1iy5o");

// Burn address
const BURN_ADDRESS = "1nc1nerator11111111111111111111111111111111";

// 1/2 Lock
const SPECIAL_ADDRESS = "7H6GV5zNknr2aYXY7fpRUeiNh26CTiq73aPD2yMtuRNi";

// *.00
function formatTwoDecimals(amountStr, decimals) {
  const amountBI = BigInt(amountStr);
  const denom = 10n ** BigInt(decimals);
  const value = Number(amountBI) / Number(denom);
  return Number(value.toFixed(2));
}

// Get balance
async function getBalance(address, mintPubkey) {
  const ownerPub = new PublicKey(address);
  const resp = await connection.getParsedTokenAccountsByOwner(ownerPub, { mint: mintPubkey });
  let sum = 0n;
  for (const { account } of resp.value) {
    const amt = account.data.parsed.info.tokenAmount.amount;
    sum += BigInt(amt);
  }
  return sum;
}

// ================= TOTAL SUPPLY =================
app.get("/total-supply", async (req, res) => {
  try {
    const tokenSupply = await connection.getTokenSupply(TOKEN_MINT);
    const totalRaw = BigInt(tokenSupply.value.amount);
    const decimals = tokenSupply.value.decimals;

    const burnRaw = await getBalance(BURN_ADDRESS, TOKEN_MINT);
    const totalAdj = (totalRaw - burnRaw).toString();

    res.json(formatTwoDecimals(totalAdj, decimals));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CIRCULATING SUPPLY =================
app.get("/circulating-supply", async (req, res) => {
  try {
    const tokenSupply = await connection.getTokenSupply(TOKEN_MINT);
    const totalRaw = BigInt(tokenSupply.value.amount);
    const decimals = tokenSupply.value.decimals;

    const burnRaw = await getBalance(BURN_ADDRESS, TOKEN_MINT);
    const specialRaw = await getBalance(SPECIAL_ADDRESS, TOKEN_MINT);

    // circulating = total - burn - (special * 2)
    const circulatingRaw = totalRaw - burnRaw - (specialRaw * 2n);

    res.json(formatTwoDecimals(circulatingRaw.toString(), decimals));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`API:
  http://localhost:${PORT}/total-supply
  http://localhost:${PORT}/circulating-supply`);
});

