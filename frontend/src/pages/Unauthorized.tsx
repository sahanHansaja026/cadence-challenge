import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Unauthorized() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const goToDashboard = () => {
        if (!user) {
            navigate("/login");
            return;
        }

        switch (user.role) {
            case "COMPANY_ADMIN":
                navigate("/admin/dashboard");
                break;

            case "FINANCE":
                navigate("/finance/dashboard");
                break;

            case "AGENT":
                navigate("/agent/dashboard");
                break;

            default:
                navigate("/login");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold">
                    403
                </h1>

                <h2 className="text-2xl mt-2">
                    Access Denied
                </h2>

                <p className="mt-2 text-gray-600">
                    You do not have permission
                    to access this page.
                </p>

                <button
                    onClick={goToDashboard}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Go to My Dashboard
                </button>
            </div>
        </div>
    );
}

export default Unauthorized;