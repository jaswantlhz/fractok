import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";

const Callback = () => {
    const { error, isLoading, isAuthenticated } = useAuth0();

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="p-8 bg-white/10 rounded-xl border border-red-500/30">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Authentication Error</h2>
                    <p>{error.message}</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    return <Navigate to="/" />;
};

export default Callback;
