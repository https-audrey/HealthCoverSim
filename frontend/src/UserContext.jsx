import { createContext, useContext, useState } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userName, setUserName] = useState(
    () => sessionStorage.getItem("hcs_user") || ""
  );

  function login(name) {
    const trimmed = name.trim();
    sessionStorage.setItem("hcs_user", trimmed);
    setUserName(trimmed);
  }

  function logout() {
    sessionStorage.removeItem("hcs_user");
    setUserName("");
  }

  return (
    <UserContext.Provider value={{ userName, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
