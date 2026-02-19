import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Portfolio from "./pages/Portfolio";
import Wallet from "./pages/Wallet";
import NotFound from "./pages/NotFound";
import Navbar from "./pages/Navbar";
import Marketplace from "./pages/Marketplace";
import TokenizeAsset from "./pages/TokenizeAsset";
import Register from "./pages/Register";

// Contexts
import { useAuth } from "./context/AuthContext";
import { useWallet } from "./context/WalletContext";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { connected } = useWallet();
  // Allow access if logged in via email/password OR via MetaMask wallet
  return isAuthenticated || connected ? children : <Navigate to="/" />;
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/assets" element={<PrivateRoute><Assets /></PrivateRoute>} />
          <Route path="/marketplace" element={<PrivateRoute><Marketplace /></PrivateRoute>} />
          <Route path="/portfolio" element={<PrivateRoute><Portfolio /></PrivateRoute>} />
          <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
          <Route path="/tokenize" element={<PrivateRoute><TokenizeAsset /></PrivateRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
