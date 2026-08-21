import { Routes, Route } from "react-router-dom";
import { Login } from "./pages/auth/login";
import Admin_dashboard from "./pages/admin/dashboard";
import Agent_Dashboard from "./pages/agent/dashboard";
import Finace_Dashboard from "./pages/finance/dashboard";
import Unauthorized from "./pages/Unauthorized";
// dashboard components
import UserManagement from "./pages/admin/UserManagement";
import ViewUsers from "./pages/admin/viewusers";
import EditUser from "./pages/admin/edituser";
import Booking_infomation from "./pages/admin/booking";
import ViewBookings from "./pages/admin/bookingdetails";
import ViewBookings_agents from "./pages/agent/bookingdetails";
import View_Bookings_finace from "./pages/finance/bookingdetails";
import EditBooking from "./pages/admin/booking_edit";
import EditBookingFinance from "./pages/finance/booking_edit";
import CommissionRules from "./pages/admin/commion_rule";
import PayoutRuns from "./pages/admin/payoutrun";
import PayoutRuns_finace from "./pages/finance/payoutrun";
import Booking_Import_finace from "./pages/finance/booking";
import Refunds from "./pages/admin/refunds";
import Refunds_finance from "./pages/finance/refunds";
import CreateRefund from "./pages/admin/create_refund";
import EditRefund from "./pages/admin/editrefund";
import AgentPayouts from "./pages/agent/payouts";
import Report from "./pages/admin/report";
import AgentReports from "./pages/agent/statement";
import Settings from "./pages/admin/Settings";
import ExchangeRates from "./pages/finance/ExchangeRates";
import TeamManagement from "./pages/admin/TeamManagement";
import FinancialReport from "./pages/finance/FinancialReport";


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
        <Route path="/payoutrun" element={<PayoutRuns />} />
        <Route path="/payoutrun_finace" element={<PayoutRuns_finace />} />
        <Route path="/booking_finace" element={<Booking_Import_finace />} />
        <Route path="/refundadmin" element={<Refunds />} />
        <Route path="/createrefund" element={<CreateRefund />} />
        <Route path="/editrefund/:id" element={<EditRefund />} />
        <Route path="/refundfinace" element={<Refunds_finance />} />
        <Route path="/mypayout" element={<AgentPayouts />} />
        <Route path="/reportadmin" element={<Report />} />
        <Route path="/reportagent" element={<AgentReports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/exchagerateinsert" element={<ExchangeRates />} />
        <Route path="/teammanagement" element={<TeamManagement />} />
        <Route path="/financialreport" element={<FinancialReport />} />
      </Routes>


    </>
  );
}

export default App;