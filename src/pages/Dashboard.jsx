import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiCheck } from "react-icons/fi";
import { Link } from "react-router-dom";
import axios from "axios";
import Dropdown from "react-bootstrap/Dropdown";

function parseRangeForValues(label, field) {
  if (!label || label === "All") return () => true;

  // Market cap / volume ranges
  if (label === ">10B") return (coin) => (coin[field] || 0) > 10000000000;
  if (label === "1B to 10B") return (coin) => (coin[field] || 0) >= 1000000000 && (coin[field] || 0) <= 10000000000;
  if (label === "100M to 1B") return (coin) => (coin[field] || 0) >= 100000000 && (coin[field] || 0) < 1000000000;
  if (label === "10M to 100M") return (coin) => (coin[field] || 0) >= 10000000 && (coin[field] || 0) < 100000000;
  if (label === "1M to 10M") return (coin) => (coin[field] || 0) >= 1000000 && (coin[field] || 0) < 10000000;
  if (label === "100k to 1M") return (coin) => (coin[field] || 0) >= 100000 && (coin[field] || 0) < 1000000;
  if (label === "10k to 100k") return (coin) => (coin[field] || 0) >= 10000 && (coin[field] || 0) < 100000;
  if (label === "<10k") return (coin) => (coin[field] || 0) < 10000;

  // Price ranges
  if (label === ">1K") return (coin) => (coin[field] || 0) > 1000;
  if (label === "100 to 1K") return (coin) => (coin[field] || 0) >= 100 && (coin[field] || 0) <= 1000;
  if (label === "10 to 100") return (coin) => (coin[field] || 0) >= 10 && (coin[field] || 0) < 100;
  if (label === "1 to 10") return (coin) => (coin[field] || 0) >= 1 && (coin[field] || 0) < 10;
  if (label === "0.01 to 1") return (coin) => (coin[field] || 0) >= 0.01 && (coin[field] || 0) < 1;
  if (label === "0.001 to 0.01") return (coin) => (coin[field] || 0) >= 0.001 && (coin[field] || 0) < 0.01;
  if (label === "<0.001") return (coin) => (coin[field] || 0) < 0.001;

  // 24h change ranges (percent)
  if (label === ">+50%") return (coin) => (coin[field] || 0) > 50;
  if (label === "10-50") return (coin) => (coin[field] || 0) >= 10 && (coin[field] || 0) <= 50;
  if (label === "0 to 10") return (coin) => (coin[field] || 0) >= 0 && (coin[field] || 0) < 10;
  if (label === "-10 to 0") return (coin) => (coin[field] || 0) >= -10 && (coin[field] || 0) < 0;
  if (label === "-50 to -10") return (coin) => (coin[field] || 0) >= -50 && (coin[field] || 0) < -10;
  if (label === "<-50%") return (coin) => (coin[field] || 0) < -50;

  return () => true;
}

export default function Dashboard() {
  const [allCoins, setAllCoins] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [marketCapFilter, setMarketCapFilter] = useState("All");
  const [volumeFilter, setVolumeFilter] = useState("All");
  const [changeFilter, setChangeFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);

  const perPage = 20;

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
    } catch {
      setWatchlist([]);
    }

    // sync watchlist across tabs
    function onStorage(e) {
      if (e.key === "watchlist") {
        try {
          const ids = Array.isArray(JSON.parse(e.newValue || "[]"))
            ? JSON.parse(e.newValue || "[]")
            : [];
          setWatchlist(ids);
        } catch {
          setWatchlist([]);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Filtering + Search
  const filtered = useMemo(() => {
    if (!Array.isArray(allCoins)) return [];

    const marketVal = parseRangeForValues(marketCapFilter, "market_cap");
    const volumeVal = parseRangeForValues(volumeFilter, "total_volume");
    const changeVal = parseRangeForValues(changeFilter, "price_change_percentage_24h");
    const priceVal = parseRangeForValues(priceFilter, "current_price");

    return allCoins
      .filter((coin) => marketVal(coin))
      .filter((coin) => volumeVal(coin))
      .filter((coin) => changeVal(coin))
      .filter((coin) => priceVal(coin))
      .filter((coin) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (coin.name || "").toLowerCase().includes(s) || (coin.symbol || "").toLowerCase().includes(s);
      });
  }, [allCoins, marketCapFilter, volumeFilter, changeFilter, priceFilter, search]);

  // Sorting
  const sorted = useMemo(() => {
    if (!sortConfig.key) return [...filtered];
    const dir = sortConfig.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortConfig.key] ?? 0;
      const bv = b[sortConfig.key] ?? 0;
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  }, [filtered, sortConfig]);

  useEffect(() => setPage(1), [sorted]);

  const paginated = useMemo(() => sorted.slice((page - 1) * perPage, page * perPage), [sorted, page]);

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
      const raw = localStorage.getItem("watchlist") || "[]";
      const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
      const idx = list.indexOf(id);
      if (idx === -1) {
        list.push(id);
      } else {
        list.splice(idx, 1);
      }
      localStorage.setItem("watchlist", JSON.stringify(list));
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
        <Dropdown autoClose="true">
          <Dropdown.Toggle variant="primary" id="marketcap-dropdown">
            Market Cap: {marketCapFilter}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {["All", ">10B", "1B to 10B", "100M to 1B", "10M to 100M", "1M to 10M", "100k to 1M", "10k to 100k", "<10k"].map(
              (val) => (
                <Dropdown.Item
                  key={val}
                  active={marketCapFilter === val}
                  onClick={() => setMarketCapFilter(val)}
                >
                  {val}
                </Dropdown.Item>
              )
            )}
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown autoClose="true">
          <Dropdown.Toggle variant="primary" id="volume-dropdown">
            24h Volume: {volumeFilter}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {["All", ">10B", "1B to 10B", "100M to 1B", "10M to 100M", "1M to 10M", "100k to 1M", "10k to 100k", "<10k"].map(
              (val) => (
                <Dropdown.Item
                  key={val}
                  active={volumeFilter === val}
                  onClick={() => setVolumeFilter(val)}
                >
                  {val}
                </Dropdown.Item>
              )
            )}
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown autoClose="true">
          <Dropdown.Toggle variant="primary" id="change-dropdown">
            24h Change: {changeFilter}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {["All", ">+50%", "10-50", "0 to 10", "-10 to 0", "-50 to -10", "<-50%"].map((val) => (
              <Dropdown.Item
                key={val}
                active={changeFilter === val}
                onClick={() => setChangeFilter(val)}
              >
                {val}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown autoClose="true">
          <Dropdown.Toggle variant="primary" id="price-dropdown">
            Price: {priceFilter}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {["All", ">1K", "100 to 1K", "10 to 100", "1 to 10", "0.01 to 1", "0.001 to 0.01", "<0.001"].map((val) => (
              <Dropdown.Item
                key={val}
                active={priceFilter === val}
                onClick={() => setPriceFilter(val)}
              >
                {val}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        <input
          type="text"
          placeholder="Search coin..."
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            if (value && search === "") setPage(1);
            if (value === "" && search !== "") setPage(1);
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
                <th className="sortable" onClick={() => handleSort("current_price")}>
                  Price <span>{getArrow("current_price")}</span>
                </th>
                <th className="sortable" onClick={() => handleSort("price_change_percentage_24h")}>
                  24h Change <span>{getArrow("price_change_percentage_24h")}</span>
                </th>
                <th className="sortable" onClick={() => handleSort("market_cap")}>
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
                      <Link to={`/coin/${coin.id}`}>
                      <img src={coin.image} alt={coin.name} className="coin-logo-small" />
                      </Link>
                      <Link to={`/coin/${coin.id}`}>
                        <span>
                          {coin.name} ({coin.symbol.toUpperCase()})
                        </span>
                      </Link>
                    </div>
                  </td>
                  <td>${coin.current_price?.toLocaleString()}</td>
                  <td
                    style={{
                      color:
                        coin.price_change_percentage_24h == null
                          ? "inherit"
                          : coin.price_change_percentage_24h >= 0
                          ? "green"
                          : "red",
                    }}
                  >
                    {coin.price_change_percentage_24h != null
                      ? coin.price_change_percentage_24h.toFixed(2) + "%"
                      : "N/A"}
                  </td>
                  <td>${coin.market_cap?.toLocaleString()}</td>
                  <td>${coin.total_volume?.toLocaleString()}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className="watch-icon-box">
                      <button
                        className={`watch-toggle ${watchlist.includes(coin.id) ? "in" : "out"}`}
                        onClick={(e) => {
                          toggleWatchlist(coin.id);
                          e.currentTarget.blur();
                        }}
                        title={
                          watchlist.includes(coin.id) ? "Remove from watchlist" : "Add to watchlist"
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
              onClick={() => setPage((p) => (p * perPage < filtered.length ? p + 1 : p))}
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
