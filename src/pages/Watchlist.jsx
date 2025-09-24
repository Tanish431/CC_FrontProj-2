import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiX } from 'react-icons/fi';

export default function Watchlist() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load watchlist coins on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/coins.json");
        const data = await res.json();
        const raw = localStorage.getItem("watchlist") || "[]";
        const ids = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        const filtered = Array.isArray(data) ? data.filter((c) => ids.includes(c.id)) : [];
        setCoins(filtered);
      } catch (err) {
        console.error("Failed to load watchlist coins:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
    // Also respond to storage changes in other tabs
    function onStorage(e) {
      if (e.key === "watchlist") load();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const removeFromWatchlist = (coinId) => {
    try {
      const raw = localStorage.getItem('watchlist') || '[]';
      const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
      const idx = list.indexOf(coinId);
      if (idx !== -1) list.splice(idx, 1);
      localStorage.setItem('watchlist', JSON.stringify(list));
      setCoins((prev) => prev.filter((c) => c.id !== coinId));
    } catch (err) {
      console.error('Failed to remove from watchlist', err);
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">My Watchlist</h1>
      {loading ? (
        <p style={{textAlign: 'center'}}>Loading watchlist...</p>
      ) : coins.length === 0 ? (
        <p style={{ padding: 20 }}>Your watchlist is empty. Add coins from a Coin page.</p>
      ) : (
        <table className="crypto-table">
          <thead>
            <tr>
              <th>Coin</th>
              <th>Price</th>
              <th>24h Change</th>
              <th>Market Cap</th>
              <th>Volume</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => (
              <tr key={coin.id}>
                <td>
                  <div className="coin-cell">
                    <img src={coin.image} alt={coin.name} className="coin-logo-small" />
                    <Link to={`/coin/${coin.id}`}>
                      <span>
                        {coin.name} ({coin.symbol.toUpperCase()})
                      </span>
                    </Link>
                  </div>
                </td>
                <td>${coin.current_price.toLocaleString()}</td>
                <td
                  style={{
                    color:
                      coin.price_change_percentage_24h === null
                        ? "inherit"
                        : coin.price_change_percentage_24h >= 0
                        ? "green"
                        : "red",
                  }}
                >
                  {coin.price_change_percentage_24h !== null
                    ? coin.price_change_percentage_24h.toFixed(2) + "%"
                    : "N/A"}
                </td>
                <td>${coin.market_cap.toLocaleString()}</td>
                <td>${coin.total_volume.toLocaleString()}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className="watch-icon-box">
                    <button
                      className={`watch-toggle in watch-remove`}
                      onClick={(e) => {
                        removeFromWatchlist(coin.id);
                        e.currentTarget.blur();
                      }}
                      title="Remove from watchlist"
                      aria-label={`Remove ${coin.name} from watchlist`}
                    >
                      <FiX size={18} aria-hidden />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
