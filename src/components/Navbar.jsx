import { Link } from "react-router-dom";
import { BsIncognito } from "react-icons/bs";

export default function Navbar({ toggleDarkMode }) {
  return (
    <nav>
      <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
        <h2>Coin Board</h2>
      </Link>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/watchlist">Watch-list</Link>
        <button
          className="nav-btn"
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          <BsIncognito size={18} aria-hidden />
        </button>
      </div>
    </nav>
  );
}
