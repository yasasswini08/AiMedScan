import { createContext, useContext, useState } from "react";

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  const login = (userData, tokenValue) => {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const navigate = (path) => {
    window.location.href = `/${path}`;
  };

  return (
    <AppContext.Provider value={{ token, user, login, logout, navigate }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
