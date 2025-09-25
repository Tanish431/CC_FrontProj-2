import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiPlus, FiCheck } from "react-icons/fi";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale
);

export default function CoinDetails() {
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [pchart, setPchart] = useState([]);
  const [mchart, setMchart] = useState([]);
  const [vchart, setVchart] = useState([]);
  const [rangePrice, setRangePrice] = useState("7D");
  const [rangeMarket, setRangeMarket] = useState("7D");
  const [rangeVolume, setRangeVolume] = useState("7D");
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "light"
  );

  // Load coin data on mount or id change
  useEffect(() => {
    const loadCoin = async () => {
      try {
        const res = await fetch(`/coins/${id}.json`);
        const data = await res.json();
        setCoin(data.detail);
        setPchart(data.chart?.prices || []);
        setMchart(data.chart?.market_caps || []);
        setVchart(data.chart?.total_volumes || []);
      } catch (err) {
        console.error("Failed to load coin:", err);
      }
    };
    loadCoin();
  }, [id]);

  // Watch for theme changes
  useEffect(() => {
    const root = document.documentElement;
    const mo = new MutationObserver(() => {
      const t = root.getAttribute("data-theme") || "light";
      setTheme(t);
    });
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  // Convert hex or rgb color to rgba with given alpha
  function hexToRgba(hex, alpha = 1) {
    if (!hex) return hex;
    const h = hex.trim();
    if (h.startsWith("rgb")) {
      return h.replace(/rgb(a?)\(([^)]+)\)/, (m, a, inner) => {
        const parts = inner.split(",").map((p) => p.trim());
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
      });
    }
    // handle #rgb
    const hexNormalized = h.replace(/^#/, "");
    if (hexNormalized.length === 3) {
      const r = hexNormalized[0] + hexNormalized[0];
      const g = hexNormalized[1] + hexNormalized[1];
      const b = hexNormalized[2] + hexNormalized[2];
      const ri = parseInt(r, 16);
      const gi = parseInt(g, 16);
      const bi = parseInt(b, 16);
      return `rgba(${ri}, ${gi}, ${bi}, ${alpha})`;
    }
    if (hexNormalized.length === 6) {
      const ri = parseInt(hexNormalized.slice(0, 2), 16);
      const gi = parseInt(hexNormalized.slice(2, 4), 16);
      const bi = parseInt(hexNormalized.slice(4, 6), 16);
      return `rgba(${ri}, ${gi}, ${bi}, ${alpha})`;
    }
    return hex;
  }

  // Format large numbers
  function formatBigNumber(value) {
    if (value === null || value === undefined || isNaN(value)) return "-";
    const abs = Math.abs(value);
    if (abs >= 1.0e12)
      return (value / 1.0e12).toFixed(2).replace(/\.00$/, "") + "T";
    if (abs >= 1.0e9)
      return (value / 1.0e9).toFixed(2).replace(/\.00$/, "") + "B";
    if (abs >= 1.0e6)
      return (value / 1.0e6).toFixed(2).replace(/\.00$/, "") + "M";
    if (abs >= 1.0e3)
      return (value / 1.0e3).toFixed(2).replace(/\.00$/, "") + "K";
    return value.toLocaleString();
  }

  if (!coin) return <p className="loading" style={{textAlign: 'center'}}>Loading...</p>;

  // Chart color responding to theme toggle
  const rootStyles = getComputedStyle(document.documentElement);
  const primaryColor = rootStyles.getPropertyValue("--chart-primary").trim();
  const marketColor = rootStyles.getPropertyValue("--chart-market").trim();
  const volumeColor = rootStyles.getPropertyValue("--chart-volume").trim();
  const axisColor = rootStyles.getPropertyValue("--text").trim() || "#111111";

  // computing cutoff and downsampling so each chart can use its own range
  function cutoffFor(rangeVal, lastTs) {
    if (rangeVal === "1D") return lastTs - 1 * 24 * 60 * 60 * 1000;
    if (rangeVal === "7D") return lastTs - 7 * 24 * 60 * 60 * 1000;
    return lastTs - 30 * 24 * 60 * 60 * 1000;
  }
  function computeFiltered(series = [], rangeVal = "7D") {
    const last = series.length > 0 ? series[series.length - 1][0] : Date.now();
    const cutoff = cutoffFor(rangeVal, last);
    let arr = series.filter(([time]) => time >= cutoff);
    if (rangeVal === "1M" || rangeVal === "7D") {
      const step = Math.ceil(arr.length / 200) || 1;
      if (step > 1) arr = arr.filter((_, i) => i % step === 0);
    }
    return arr;
  }

  const priceFiltered = computeFiltered(pchart, rangePrice);
  const marketFiltered = computeFiltered(mchart, rangeMarket);
  const volumeFiltered = computeFiltered(vchart, rangeVolume);

  // helper to build options per-chart
  const makeOptions = (r) => ({
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            const date = new Date(items[0].parsed.x);
            if (r === "1M") {
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }
            return date.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          },
          label: (ctx) => {
            // Format y value in tooltip
            const v = ctx.parsed.y;
            return formatBigNumber(v);
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: r === "1D" ? "hour" : r === "7D" ? "day" : "week" },
        ticks: { maxTicksLimit: 8, color: axisColor },
        grid: { color: hexToRgba(axisColor, 0.12) },
      },
      y: {
        beginAtZero: false,
        ticks: {
          color: axisColor,
          callback: (val) => formatBigNumber(val),
        },
        grid: { color: hexToRgba(axisColor, 0.12) },
      },
    },
  });

  // Price Chart initialization
  const pchartData = {
    labels: priceFiltered.map(([time]) => new Date(time)),
    datasets: [
      {
        label: `${coin.name} Price (USD)`,
        data: priceFiltered.map(([, price]) => price),
        borderColor: primaryColor,
        backgroundColor: "transparent",
        tension: 0,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: "transparent",
        pointBorderColor: primaryColor,
      },
    ],
  };

  // Market Cap Chart initialization
  const mcapData = {
    labels: marketFiltered.map(([time]) => new Date(time)),
    datasets: [
      {
        label: `${coin.name} Market Cap (USD)`,
        data: marketFiltered.length
          ? marketFiltered.map(([, v]) => v)
          : marketFiltered.map(() => null),
        borderColor: marketColor,
        backgroundColor: "transparent",
        tension: 0,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: "transparent",
        pointBorderColor: marketColor,
      },
    ],
  };

  // Volume Chart initialization
  const volData = {
    labels: volumeFiltered.map(([time]) => new Date(time)),
    datasets: [
      {
        label: `${coin.name} Volume (USD)`,
        data: volumeFiltered.length
          ? volumeFiltered.map(([, v]) => v)
          : volumeFiltered.map(() => null),
        borderColor: volumeColor,
        backgroundColor: "transparent",
        tension: 0,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: "transparent",
        pointBorderColor: volumeColor,
      },
    ],
  };

  // Watchlist Button 
  function WatchlistButton({ coinId }) {
    const [saved, setSaved] = useState(() => {
      try {
        const raw = localStorage.getItem("watchlist") || "[]";
        const list = JSON.parse(raw);
        return Array.isArray(list) && list.includes(coinId);
      } catch (e) {
        return false;
      }
    });

    useEffect(() => {
      // keep UI in sync if storage changed elsewhere
      function onStorage(e) {
        if (e.key === "watchlist") {
          try {
            const list = JSON.parse(e.newValue || "[]");
            setSaved(Array.isArray(list) && list.includes(coinId));
          } catch (err) {}
        }
      }
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }, [coinId]);

    const toggle = () => {
      try {
        const raw = localStorage.getItem("watchlist") || "[]";
        const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        const idx = list.indexOf(coinId);
        if (idx === -1) list.push(coinId);
        else list.splice(idx, 1);
        localStorage.setItem("watchlist", JSON.stringify(list));
        setSaved(idx === -1);
      } catch (err) {
        console.error("Failed to toggle watchlist:", err);
      }
    };

    return (
      <button
        className={`watchlist-btn ${saved ? "saved" : ""}`}
        onClick={toggle}
        title={saved ? "Remove from watchlist" : "Add to watchlist"}
        aria-pressed={saved}
        style={{
          background: "transparent",
          border: "none",
          padding: 6,
          cursor: "pointer",
          width: 40,
          height: 40,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          color: saved ? "green" : "var(--primary)",
        }}
      >
        {saved ? (
          <FiCheck size={22} aria-hidden />
        ) : (
          <FiPlus size={22} aria-hidden />
        )}
      </button>
    );
  }
  return (
    <div className="coin-page">
      <Link to="/dashboard" className="back-btn">
        ⬅ Back
      </Link>

      <div className="coin-header">
        <img src={coin.image.large} alt={coin.name} className="coin-logo" />
        <div>
          <h1>
            {coin.name} ({coin.symbol.toUpperCase()})
          </h1>
          <h2 className="coin-price">
            ${coin.market_data.current_price.usd.toLocaleString()}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="rank">Rank #{coin.market_cap_rank}</span>
            {/* Watchlist Button */}
            <WatchlistButton coinId={coin.id} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Market Cap</h3>
          <p>${coin.market_data.market_cap.usd.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>24h Volume</h3>
          <p>${coin.market_data.total_volume.usd.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Circulating Supply</h3>
          <p>
            {coin.market_data.circulating_supply.toLocaleString()}{" "}
            {coin.symbol.toUpperCase()}
          </p>
        </div>
        <div className="stat-card">
          <h3>24h High</h3>
          <p>${coin.market_data.high_24h?.usd?.toLocaleString() ?? "-"}</p>
        </div>
        <div className="stat-card">
          <h3>24h Low</h3>
          <p>${coin.market_data.low_24h?.usd?.toLocaleString() ?? "-"}</p>
        </div>
      </div>

      {/* Description */}
      <div className="coin-description">
        <h2>About {coin.name}</h2>
        <p dangerouslySetInnerHTML={{ __html: coin.description.en }} />{" "}
        {/*preserve formatting*/}
      </div>

      {/* Price Chart */}
      <div className="pchart-container">
        <h2>{rangePrice} Price Chart</h2>
        <div className="pchart-range-buttons">
          {["1D", "7D", "1M"].map((r) => (
            <button
              key={r}
              className={`range-btn ${rangePrice === r ? "active" : ""}`}
              onClick={() => setRangePrice(r)}
            >
              {r}
            </button>
          ))}
        </div>

        {priceFiltered.length > 0 ? (
          <Line data={pchartData} options={makeOptions(rangePrice)} />
        ) : (
          <p>No price chart data available</p>
        )}
      </div>

      {/* Market Cap Chart */}
      <div className="pchart-container">
        <h2>{rangeMarket} Market Cap Chart</h2>
        <div className="pchart-range-buttons">
          {["1D", "7D", "1M"].map((r) => (
            <button
              key={r}
              className={`range-btn ${rangeMarket === r ? "active" : ""}`}
              onClick={() => setRangeMarket(r)}
            >
              {r}
            </button>
          ))}
        </div>

        {marketFiltered.length > 0 ? (
          <Line data={mcapData} options={makeOptions(rangeMarket)} />
        ) : (
          <p>No market cap data available</p>
        )}
      </div>

      {/* Volume Chart */}
      <div className="pchart-container">
        <h2>{rangeVolume} Volume Chart</h2>
        <div className="pchart-range-buttons">
          {["1D", "7D", "1M"].map((r) => (
            <button
              key={r}
              className={`range-btn ${rangeVolume === r ? "active" : ""}`}
              onClick={() => setRangeVolume(r)}
            >
              {r}
            </button>
          ))}
        </div>

        {volumeFiltered.length > 0 ? (
          <Line data={volData} options={makeOptions(rangeVolume)} />
        ) : (
          <p>No volume data available</p>
        )}
      </div>

      {/* Links */}
      <div className="coin-links">
        <h2>Resources</h2>
        <ul>
          {coin.links.homepage[0] && (
            <li>
              <a href={coin.links.homepage[0]} target="_blank" rel="noreferrer">
                Website
              </a>
            </li>
          )}
          {coin.links.blockchain_site[0] && (
            <li>
              <a
                href={coin.links.blockchain_site[0]}
                target="_blank"
                rel="noreferrer"
              >
                Explorer
              </a>
            </li>
          )}
          {coin.links.repos_url.github[0] && (
            <li>
              <a
                href={coin.links.repos_url.github[0]}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </li>
          )}
          {coin.links.subreddit_url && (
            <li>
              <a
                href={coin.links.subreddit_url}
                target="_blank"
                rel="noreferrer"
              >
                Reddit
              </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
