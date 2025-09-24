import { NavLink } from "react-router-dom";
import { useState } from "react";
import '../components/navBar.css';
import Apparentlylogo from '../assets/apparently-digital-logo.png';

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="navbar">
      <div className="navLeft">
        <NavLink to="/">
          <img src={Apparentlylogo} style={{with: "50px", height: "50px"}} alt="logo" />
        </NavLink>
      </div>

      <div className="nav-toggle" onClick={toggleMobileMenu}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      <div className={`navMiddle ${isMobileMenuOpen ? "open" : ""}`}>
        <ul>
          <li>
            <NavLink to="/" activeClassName="active-link" onClick={toggleMobileMenu}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/Hourly" activeClassName="active-link" onClick={toggleMobileMenu}>
              Hourly
            </NavLink>
          </li>
          <li>
            <NavLink to="/GeoLocation" activeClassName="active-link" onClick={toggleMobileMenu}>
              GeoLocation
            </NavLink>
          </li>
          <li>
            <NavLink to="/HourlyReport" activeClassName="active-link" onClick={toggleMobileMenu}>
              OverAll Report
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="navRight">
        <NavLink className="tryDemo" to="/TryDemo">
          <div className="demoText">Notifications</div>
        </NavLink>
      </div>
    </div>
  );
}

export default Navbar;