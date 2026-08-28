import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        🚆 <span>ERJA</span>
      </div>

      <div className="nav-right">
        <span className="username">Welcome, Charan</span>

        <button className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;