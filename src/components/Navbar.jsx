import { Link } from "react-router-dom";

export default function Navbar({ toggleDarkMode }) {
  return (
    <nav>
      <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
        <h2>Coin Board</h2>
      </Link>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/watchlist">Watch-list</Link>
        <button className="nav-btn" onClick={toggleDarkMode}>
          Dark Mode
        </button>
      </div>
    </nav>
  );
}
