import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  ShellBar,
  Avatar,
  Menu,
  MenuItem,
  ResponsivePopover,
  Switch,
  FlexBox,
  FlexBoxJustifyContent,
  FlexBoxAlignItems,
  Text,
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/settings.js";
import "@ui5/webcomponents-icons/dist/log.js";
import "@ui5/webcomponents-icons/dist/notification.js";
import "@ui5/webcomponents-icons/dist/action-settings.js";
import "@ui5/webcomponents-icons/dist/translate.js";

function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Chaque avatar gère sa propre référence + son propre état d'ouverture.
  // C'est le même schéma fiable pour les trois (profil, langue, paramètres) :
  // plus de showPopover() hasardeux sur l'Avatar, on pilote le popover nous-mêmes.
  const profileRef  = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const langRef  = useRef(null);
  const [langOpen, setLangOpen] = useState(false);

  const settingsRef = useRef(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openSettingsFromProfileMenu = () => {
    setProfileOpen(false);
    setSettingsOpen(true);
  };

  return (
    <ShellBar
      logo={
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg"
          alt="SAP Logo"
          style={{ height: "32px" }}
        />
      }
      primaryTitle="AVAXIA Group"
      secondaryTitle="Gestion des Factures SAP"
      showProductSwitch
      onProductSwitchClick={() => navigate("/dashboard")}
      profile={
        <Avatar
          ref={profileRef}
          icon="employee"
          interactive
          onClick={() => setProfileOpen((open) => !open)}
        />
      }
      notificationsCount="3"
      onNotificationsClick={() => alert("Notifications (simulées)")}
    >
      {/* Menu utilisateur (avatar de profil) */}
      <Menu
        open={profileOpen}
        opener={profileRef.current || undefined}
        onAfterClose={() => setProfileOpen(false)}
      >
        <MenuItem icon="employee" text={user?.name || "Utilisateur"} />
        <MenuItem icon="settings" text="Paramètres" onClick={openSettingsFromProfileMenu} />
        <MenuItem icon="log" text="Déconnexion" onClick={handleLogout} />
      </Menu>

      {/* Actions supplémentaires : langue et paramètres */}
      <div
        slot="default-1"
        style={{ display: "flex", alignItems: "center", marginRight: "0.5rem" }}
      >
        <Avatar
          ref={langRef}
          icon="translate"
          interactive
          size="S"
          onClick={() => setLangOpen((open) => !open)}
        />
        <Menu
          open={langOpen}
          opener={langRef.current || undefined}
          onAfterClose={() => setLangOpen(false)}
        >
          <MenuItem text="Français" />
          <MenuItem text="English" />
          <MenuItem text="عربي" />
        </Menu>
      </div>

      <div slot="default-2">
        <Avatar
          ref={settingsRef}
          icon="action-settings"
          interactive
          size="S"
          onClick={() => setSettingsOpen((open) => !open)}
        />
        <ResponsivePopover
          open={settingsOpen}
          opener={settingsRef.current || undefined}
          placementType="Bottom"
          headerText="Paramètres"
          onAfterClose={() => setSettingsOpen(false)}
        >
          <div style={{ padding: "1rem", minWidth: "240px" }}>
            <FlexBox justifyContent={FlexBoxJustifyContent.SpaceBetween} alignItems={FlexBoxAlignItems.Center} style={{ gap: "16px" }}>
              <FlexBox direction="Column">
                <Text style={{ fontWeight: "600" }}>Mode sombre</Text>
                <Text style={{ fontSize: "12px", color: "var(--sapContent_LabelColor)" }}>
                  {isDark ? "Activé" : "Désactivé"}
                </Text>
              </FlexBox>
              <Switch checked={isDark} onChange={toggleTheme} />
            </FlexBox>
          </div>
        </ResponsivePopover>
      </div>
    </ShellBar>
  );
}

export default Navbar;
