import React, { createContext, useContext, useState } from "react";
import { saveToken, getToken, removeToken, saveUser, getUser, removeUser } from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken());
  const [user, setUser]   = useState(getUser());

  const login = (token, user) => {
    saveToken(token);
    saveUser(user);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    removeToken();
    removeUser();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}