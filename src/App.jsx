import './App.css'
import { Route, Routes} from "react-router-dom";
import Hourly from './hourlyComponent/Hourly';
import Navbar from './components/Navbar'
import HourlyReport from './hourlyComponent/HourlyReports';
import GeoRevenue from './components/geoLocationComp/GeoRevenue';
function App() {
  

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Hourly />} />
        <Route path="/Hourly" element={<Hourly />} />
        <Route path="/HourlyReport" element={<HourlyReport />} />
        <Route path="/GeoLocation" element={<GeoRevenue />} />
      </Routes>
    </>
  );
}

export default App
