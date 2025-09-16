import { NavLink } from "react-router-dom";
import '../components/navBar.css';
import Apparentlylogo from '../assets/apparently-digital-logo.png';
function Navbar() {
  return (
    <div className="navbar">
      <div className="navLeft">
        <NavLink to="/">
          <img src={Apparentlylogo} style={{with:"50px", height:"50px"}}alt="logo" />
        </NavLink>
      </div>
      <div className="navMiddle">
        <ul>
          <li>
            <NavLink to="/" activeclassName="active-link">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/Hourly" activeclassName="active-link">
              Hourly
            </NavLink>
          </li>
          {/* <li>
            <NavLink to="/Weekly" activeclassName="active-link">
              Weekly Report
            </NavLink>
          </li> */}
          <li>
            <NavLink to="/GeoLocation" activeclassName="active-link">
              GeoLocation
            </NavLink>
          </li>
          <li>
            <NavLink to="/HourlyReport" activeclassName="active-link">
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
