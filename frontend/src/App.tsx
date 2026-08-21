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
import ViewBookings from "./pages/admin/bookingdetails";
import ViewBookings_agents from "./pages/agent/bookingdetails";
import View_Bookings_finace from "./pages/finace/bookingdetails";
import EditBooking from "./pages/admin/booking_edit";
import EditBookingFinance from "./pages/finace/booking_edit";
import CommissionRules from "./pages/admin/commion_rule";


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
        <Route path="/viewbookings" element={<ViewBookings />} />
        <Route path="/viewbookings_agent" element={<ViewBookings_agents />} />
        <Route path="/viewbookings_finace" element={<View_Bookings_finace />} />
        <Route path="/editbooking/:id" element={<EditBooking />} />
        <Route path="/editbooking_finace/:id" element={<EditBookingFinance />} />
        <Route path="/commtionrule" element={<CommissionRules />} />

      </Routes>


    </>
  );
}

export default App;