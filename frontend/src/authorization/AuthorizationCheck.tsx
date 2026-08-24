import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function useAuthorizationCheck() {
    const {
        user,
        isAuthenticated,
        isLoading,
    } = useAuth();

    const navigate = useNavigate();

    // --------------------------------
    // CHECK AUTHENTICATION
    // --------------------------------
    const checkAuthentication = () => {

        // AuthContext is still restoring
        // the session from localStorage
        if (isLoading) {
            return false;
        }

        if (!isAuthenticated || !user) {
            navigate("/", {
                replace: true,
            });

            return false;
        }

        return true;
    };


    // --------------------------------
    // CHECK COMPANY
    // --------------------------------
    const checkCompany = (
        companyId?: string
    ) => {

        if (!user) {
            return false;
        }

        // User must have a company
        if (!user.companyId) {
            navigate("/unauthorized", {
                replace: true,
            });

            return false;
        }

        // If specific company is required
        if (
            companyId &&
            user.companyId !== companyId
        ) {
            navigate("/unauthorized", {
                replace: true,
            });

            return false;
        }

        return true;
    };


    // --------------------------------
    // ADMIN ONLY
    // --------------------------------
    const adminAuthorization = (
        companyId?: string
    ) => {

        if (!checkAuthentication()) {
            return false;
        }

        if (!checkCompany(companyId)) {
            return false;
        }

        if (
            user?.role !== "COMPANY_ADMIN"
        ) {
            navigate("/unauthorized", {
                replace: true,
            });

            return false;
        }

        return true;
    };


    // --------------------------------
    // ADMIN + FINANCE
    // --------------------------------
    const financeAuthorization = (
        companyId?: string
    ) => {

        if (!checkAuthentication()) {
            return false;
        }

        if (!checkCompany(companyId)) {
            return false;
        }

        if (
            user?.role !== "COMPANY_ADMIN" &&
            user?.role !== "FINANCE"
        ) {
            navigate("/unauthorized", {
                replace: true,
            });

            return false;
        }

        return true;
    };


    // --------------------------------
    // ADMIN + FINANCE + AGENT
    // --------------------------------
    const agentAuthorization = (
        companyId?: string
    ) => {

        if (!checkAuthentication()) {
            return false;
        }

        if (!checkCompany(companyId)) {
            return false;
        }

        if (
            user?.role !== "COMPANY_ADMIN" &&
            user?.role !== "FINANCE" &&
            user?.role !== "AGENT"
        ) {
            navigate("/unauthorized", {
                replace: true,
            });

            return false;
        }

        return true;
    };


    return {
        adminAuthorization,
        financeAuthorization,
        agentAuthorization,
        isLoading,
    };
}