const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Delay helper
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAndSave() {
  try {
    const baseDir = path.resolve(__dirname, '..');
    const publicDir = path.join(baseDir, 'public');
    const coinsDir = path.join(publicDir, 'coins');

    try {
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      if (!fs.existsSync(coinsDir)) fs.mkdirSync(coinsDir, { recursive: true });
    } catch (dirErr) {
      console.error('Failed to create public/coins directories:', dirErr.message || dirErr);
      throw dirErr;
    }

    console.log('Fetching coins from CoinGecko (markets)...');
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 2,
        page: 1,
        sparkline: false,
      },
    });

    fs.writeFileSync(path.join(publicDir, 'coins.json'), JSON.stringify(res.data, null, 2), 'utf8');
    console.log(`Saved ${res.data.length} coins to ${path.join(publicDir, 'coins.json')}`);

    console.log('Fetching per-coin details (this may take a while)...');

    const delayMs = Number(30000)

    for (let i = 0; i < res.data.length; i++) {
      const coin = res.data[i];
      const id = coin.id;
      const coinOut = path.join(coinsDir, `${id}.json`);
      try {
        const [detailResp, chartResp] = await Promise.all([
          axios.get(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}`, {
            params: { localization: false },
          }),
          axios.get(
            `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart`,
            {
              params: { vs_currency: 'usd', days: 30 },
            }
          ),
        ]);

        const toSave = {
          savedAt: new Date().toISOString(), // timestamp
          id,
          detail: detailResp.data,
          chart: chartResp.data,
        };
        fs.writeFileSync(coinOut, JSON.stringify(toSave, null, 2), 'utf8');
        process.stdout.write(`.${i + 1}`); // progress dot
      } catch (err) {
        console.error(`\nFailed to fetch detail/chart for ${id}:`, err.message || err);
      }

      await delay(delayMs);
    }

    console.log('\nPer-coin fetch finished.');
    try {
      const savedFiles = fs.readdirSync(coinsDir).filter((f) => f.endsWith('.json'));
      console.log(`Saved ${savedFiles.length} per-coin files into ${coinsDir}`);
    } catch (lsErr) {
      console.warn('Could not list coins directory contents:', lsErr.message || lsErr);
    }
  } catch (err) {
    console.error('Failed to fetch or save coins:', err.message || err);
    process.exitCode = 1;
  }
}

fetchAndSave();
