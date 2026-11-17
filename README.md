# token-launch-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/dengzy1998/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/dengzy1998/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar over a sealed DefiLlama snapshot of 758 protocols. The board ranks the 204 protocols that pass the watchlist's own pre-token tests (no token recorded, and not a wrapped, staked, bridged or exchange product of a protocol whose token already trades) by implied value: what each protocol's token would be worth if it issued one at the valuation its already-tokenized category peers trade at. The model is stated, not hidden: implied value = TVL × the category's median market-cap/TVL multiple (shrunk toward the global median for thin categories, winsorized at the 95th percentile), scaled by a 7-day TVL momentum factor and a maturity factor from how long the protocol has been tracked, with a value range and confidence score from the comparables' spread. Every row carries a concrete farm plan with amounts and timeframes, and the dashboard adds search, category/chain filters, five sort orders and a per-protocol detail view with the full valuation build-up and its tokenized comparables.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <dir holding snapshot.json>
```

The program writes `board.json`, `data.js`, the dashboard and screenshots into the output directory; open the dashboard's `index.html` from there in a browser. It is fully static and makes no network requests.

---

<sub>Entered on [make.fun](https://make.fun/?ref=01wh7qnm&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
