import { useEffect, useState } from "react";
import { FiPlus, FiCheck } from "react-icons/fi";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Dashboard() {
  const [allCoins, setAllCoins] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [loading, setLoading] = useState(true);
  const [lastPage, setLastPage] = useState(1);
  const [watchlist, setWatchlist] = useState([]);

  const perPage = 20;
  // Load coins.json on mount
  useEffect(() => {
    const loadCoins = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/coins.json");
        if (Array.isArray(data)) setAllCoins(data);
      } catch (err) {
        console.error("Error loading local coins.json:", err.message || err);
      } finally {
        setLoading(false);
      }
    };
    loadCoins();

    // load watchlist from localStorage
    try {
      const raw = localStorage.getItem("watchlist") || "[]";
      const ids = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
      setWatchlist(ids);
    } catch (e) {
      setWatchlist([]);
    }

    // listen for watchlist changes from other tabs
    function onStorage(e) {
      if (e.key === "watchlist") {
        try {
          const ids = Array.isArray(JSON.parse(e.newValue || "[]"))
            ? JSON.parse(e.newValue || "[]")
            : [];
          setWatchlist(ids);
        } catch (err) {
          setWatchlist([]);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Filter
  let filtered = allCoins.filter((coin) => {
    if (filter === "gainers") return coin.price_change_percentage_24h > 0;
    if (filter === "losers") return coin.price_change_percentage_24h < 0;
    if (filter === "volume") return coin.total_volume > 1_000_000_000;
    return true;
  });

  // Search
  filtered = filtered.filter(
    (coin) =>
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  // Sorting
  if (sortConfig.key) {
    const { key, direction } = sortConfig;
    const direction_factor = direction === "asc" ? 1 : -1;
    filtered.sort((a, b) => (a[key] - b[key]) * direction_factor);
  }

  // Pagination
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Sort handler
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key && prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key, direction: "asc" };
    });
  };

  const getArrow = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  // Watchlist toggle
  const toggleWatchlist = (id) => {
    try {
      const raw = localStorage.getItem("watchlist") || "[]"; // get current list
      const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
      const idx = list.indexOf(id);
      if (idx === -1) {
        list.push(id);
      } else {
        list.splice(idx, 1);
      }
      localStorage.setItem("watchlist", JSON.stringify(list)); // save updated list
      setWatchlist(list);
    } catch (err) {
      console.error("Failed to toggle watchlist", err);
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">Dashboard</h1>

      {/* Filter + Search */}
      <div className="filter-bar">
        <button className="filter-btn" onClick={() => setFilter("all")}>
          All
        </button>
        <button className="filter-btn" onClick={() => setFilter("gainers")}>
          Top Gainers
        </button>
        <button className="filter-btn" onClick={() => setFilter("losers")}>
          Top Losers
        </button>
        <button className="filter-btn" onClick={() => setFilter("volume")}>
          High Volume
        </button>

        <input
          type="text"
          placeholder="Search coin..."
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            if (value && search === "") {
              setLastPage(page);
              setPage(1);
            }
            if (value === "" && search !== "") {
              setPage(lastPage);
            }
            setSearch(value);
          }}
          className="search-input"
        />
      </div>

      {loading ? (
        <p style={{ textAlign: "center" }}>Loading coins...</p>
      ) : (
        <>
          <table className="crypto-table">
            <thead>
              <tr>
                <th>Coin</th>
                <th
                  className="sortable"
                  onClick={() => handleSort("current_price")}
                >
                  Price <span>{getArrow("current_price")}</span>
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("price_change_percentage_24h")}
                >
                  24h Change{" "}
                  <span>{getArrow("price_change_percentage_24h")}</span>
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("market_cap")}
                >
                  Market Cap <span>{getArrow("market_cap")}</span>
                </th>
                <th>Volume</th>
                <th>Watchlist</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((coin) => (
                <tr key={coin.id}>
                  <td>
                    <div className="coin-cell">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="coin-logo-small"
                      />
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

                  {/* Watchlist Button */}
                  <td style={{ textAlign: "center" }}>
                    <span className="watch-icon-box">
                      <button
                        className={`watch-toggle ${
                          watchlist.includes(coin.id) ? "in" : "out"
                        }`}
                        onClick={(e) => {
                          toggleWatchlist(coin.id);
                          e.currentTarget.blur();
                        }}
                        title={
                          watchlist.includes(coin.id)
                            ? "Remove from watchlist"
                            : "Add to watchlist"
                        }
                        aria-pressed={watchlist.includes(coin.id)}
                      >
                        {watchlist.includes(coin.id) ? (
                          <FiCheck size={20} aria-hidden />
                        ) : (
                          <FiPlus size={20} aria-hidden />
                        )}
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ⬅ Prev
            </button>
            <span>Page {page}</span>
            <button
              className="page-btn"
              onClick={() =>
                setPage((p) => (p * perPage < filtered.length ? p + 1 : p))
              }
              disabled={page * perPage >= filtered.length}
            >
              Next ➡
            </button>
          </div>
        </>
      )}
    </div>
  );
}
