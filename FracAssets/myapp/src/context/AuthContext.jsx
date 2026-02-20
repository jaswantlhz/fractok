import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [token, setToken] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated) {
        try {
          const accessToken = await getAccessTokenSilently();
          setToken(accessToken);
          localStorage.setItem("token", accessToken);
          // Store sub so api.js can send it as x-user-sub header
          if (user?.sub) localStorage.setItem("auth0_sub", user.sub);
        } catch (e) {
          console.error("Error getting access token", e);
        }
      } else {
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("auth0_sub");
      }
    };
    getToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  const login = () => loginWithRedirect();
  const logout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
        loading: isLoading,
        getAccessTokenSilently
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
