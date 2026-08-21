import { Routes, Route } from "react-router-dom";
import { Login } from "./pages/auth/login";
import Admin_dashboard from "./pages/admin/dashboard";
import Agent_Dashboard from "./pages/agent/dashboard";
import Finace_Dashboard from "./pages/finace/dashboard";
import Unauthorized from "./pages/Unauthorized";
// dashboard components
import UserManagement from "./pages/admin/UserManagement";
import ViewUsers from "./pages/admin/viewusers";
import EditUser from "./pages/admin/edituser";
import Booking_infomation from "./pages/admin/booking";


function App() {
  return (
    <>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin/dashboard" element={<Admin_dashboard />} />
        <Route path="/finance/dashboard" element={<Finace_Dashboard />} />
        <Route path="/agent/dashboard" element={<Agent_Dashboard />} />
        <Route path="/usermangemtn" element={<UserManagement />} />
        <Route path="/edituser/:id" element={<EditUser />} />
        <Route path="/viewusers" element={<ViewUsers />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/bookinginfo" element={<Booking_infomation />} />

      </Routes>


    </>
  );
}

export default App;