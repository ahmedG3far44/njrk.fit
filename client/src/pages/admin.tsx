import { Outlet, Navigate } from "react-router-dom"

const ProtectedAdminPage = ({ children }: { children: React.ReactNode }) => {
    const isAdmin = true;
    const isUser = true;

    if (isAdmin && isUser) {
        return children || <Outlet />
    }

    if (isUser && !isAdmin) {
        return <Navigate to="/dashboard" replace />
    }

    return <Navigate to="/login" replace />
}

export default ProtectedAdminPage