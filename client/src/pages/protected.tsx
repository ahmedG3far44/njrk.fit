import { Navigate } from "react-router-dom"

const ProtectedPage = ({ children }: { children: React.ReactNode }) => {
    const user = true;
    if (!user) {
        return <Navigate to="/login" replace />
    }

    return children

}

export default ProtectedPage