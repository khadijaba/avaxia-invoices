import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShellBar, ShellBarItem, Avatar } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/log.js";
import "@ui5/webcomponents-icons/dist/home.js";
import "@ui5/webcomponents-icons/dist/table-view.js";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <ShellBar
      primaryTitle="AVAXIA Group"
      secondaryTitle="Gestion des Factures SAP"
      profile={<Avatar><span>{user?.name?.charAt(0)}</span></Avatar>}
      onProfileClick={handleLogout}
    >
      <ShellBarItem icon="home"        text="Dashboard"   onClick={() => navigate("/dashboard")} />
      {user?.role === "ADMIN" && (
        <ShellBarItem icon="table-view" text="Admin"      onClick={() => navigate("/admin")} />
      )}
      <ShellBarItem icon="log"         text="Déconnexion" onClick={handleLogout} />
    </ShellBar>
  );
}

export default Navbar;