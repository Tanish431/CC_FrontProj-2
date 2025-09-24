import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <div className="home-container">
        <div className="home-text">
          <h1>
            Track, Analyze <br /> & Save Your Crypto
          </h1>
          <p>
            Coin Board is your all-in-one cryptocurrency dashboard. Get live
            market data, analyze trends with interactive charts, and keep track
            of your favorite coins using a personalized watchlist.
          </p>
          <Link to="/dashboard">
            <button className="home-btn">Go to Dashboard</button>
          </Link>
        </div>
        <img
          src="https://images.unsplash.com/photo-1631603090989-93f9ef6f9d80?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGNyeXB0b2N1cnJlbmN5fGVufDB8fDB8fHww"
          alt="Crypto Illustration"
          className="home-image"
        />
      </div>

      <div className="features">
        <div className="feature-card">
          <h3>📊Market Data</h3>
          <p>
            Analye the top 200 cryptocurrencies by market cap with price
            updates, 24h changes, volume, and market cap data.
          </p>
        </div>
        <div className="feature-card">
          <h3>📈 Advanced Analytics</h3>
          <p>
            View historical charts, track trends across 1/7/30 days, and
            visualize market dominance and volume traded with interactive graphs.
          </p>
        </div>
        <div className="feature-card">
          <h3>⭐ Personalized Watchlist</h3>
          <p>
            Save your favorite coins in a private watchlist stored locally on
            your device.
          </p>
        </div>
      </div>
    </>
  );
}
