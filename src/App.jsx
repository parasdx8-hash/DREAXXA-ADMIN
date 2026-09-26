import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  onValue,
  ref,
  remove,
  set,
} from "firebase/database";

import { auth, database } from "./firebase";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [activePage, setActivePage] = useState("dashboard");

  const [keys, setKeys] = useState({});
  const [settings, setSettings] = useState({
    adminName: "DREAXXA ADMIN",
    appVersion: "1.0.0",
    maintenance: false,
  });

  const [keyName, setKeyName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryTime, setExpiryTime] = useState("23:59");
  const [createMessage, setCreateMessage] = useState("");

  const [adminName, setAdminName] = useState("DREAXXA ADMIN");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [maintenance, setMaintenance] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setKeys({});
      return;
    }

    const keysRef = ref(database, "keys");

    const unsubscribe = onValue(keysRef, (snapshot) => {
      const data = snapshot.val() || {};
      setKeys(data);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const settingsRef = ref(database, "settings");

    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setSettings(data);
        setAdminName(data.adminName || "DREAXXA ADMIN");
        setAppVersion(data.appVersion || "1.0.0");
        setMaintenance(Boolean(data.maintenance));
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoginError("");

    if (!email || !password) {
      setLoginError("Please enter email and password.");
      return;
    }

    try {
      setLoggingIn(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
    } catch (error) {
      console.error(error);
      setLoginError("Invalid email or password.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const generateKey = () => {
    const part1 = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

    const part2 = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

    return "DRX-" + part1 + "-" + part2;
  };

  const createLicenseKey = async (event) => {
    event.preventDefault();

    setCreateMessage("");

    if (!keyName.trim()) {
      setCreateMessage("Please enter a license key.");
      return;
    }

    if (!expiryDate) {
      setCreateMessage("Please select expiry date.");
      return;
    }

    try {
      const key = keyName.trim().toUpperCase();

      const expiresAt = new Date(
        expiryDate + "T" + expiryTime
      ).getTime();

      if (Number.isNaN(expiresAt)) {
        setCreateMessage("Invalid expiry date/time.");
        return;
      }

      await set(ref(database, "keys/" + key), {
        enabled: true,
        expiresAt: expiresAt,
      });

      setCreateMessage("License key created successfully.");

      setKeyName("");
      setExpiryDate("");
      setExpiryTime("23:59");
    } catch (error) {
      console.error(error);
      setCreateMessage("Failed to create license key.");
    }
  };

  const createRandomKey = () => {
    setKeyName(generateKey());
  };

  const toggleKey = async (key, currentStatus) => {
    try {
      await set(
        ref(database, "keys/" + key + "/enabled"),
        !currentStatus
      );
    } catch (error) {
      console.error(error);
      alert("Failed to change key status.");
    }
  };

  const deleteKey = async (key) => {
    const confirmed = window.confirm(
      "Delete license key " + key + "?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await remove(ref(database, "keys/" + key));
    } catch (error) {
      console.error(error);
      alert("Failed to delete key.");
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();

    try {
      await set(ref(database, "settings"), {
        adminName: adminName,
        appVersion: appVersion,
        maintenance: maintenance,
      });

      setSettingsMessage("Settings saved successfully.");
    } catch (error) {
      console.error(error);
      setSettingsMessage("Failed to save settings.");
    }
  };

  const getKeyStatus = (data) => {
    if (!data) {
      return "expired";
    }

    if (!data.enabled) {
      return "disabled";
    }

    if (
      data.expiresAt &&
      Date.now() >= Number(data.expiresAt)
    ) {
      return "expired";
    }

    return "active";
  };

  const formatExpiry = (timestamp) => {
    if (!timestamp) {
      return "No expiry";
    }

    const date = new Date(Number(timestamp));

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleString();
  };

  const keyEntries = Object.entries(keys);

  const totalKeys = keyEntries.length;

  const activeKeys = keyEntries.filter(
    ([, data]) => getKeyStatus(data) === "active"
  ).length;

  const expiredKeys = keyEntries.filter(
    ([, data]) => getKeyStatus(data) === "expired"
  ).length;

  const disabledKeys = keyEntries.filter(
    ([, data]) => getKeyStatus(data) === "disabled"
  ).length;

  if (authLoading) {
    return (
      <div className="auth-screen">
        <div className="login-card">
          <h1>DREAXXA</h1>
          <h2>MOD</h2>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-screen">
        <div className="login-card">
          <div className="login-logo">DREAXXA</div>

          <div className="login-mod">MOD</div>

          <p className="login-subtitle">
            ADMIN PANEL
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />

            {loginError && (
              <div className="error-message">
                {loginError}
              </div>
            )}

            <button
              className="primary-button login-button"
              type="submit"
              disabled={loggingIn}
            >
              {loggingIn ? "LOGIN..." : "LOGIN"}
            </button>
          </form>

          <div className="login-footer">
            DREAXXA MOD • Secure Admin
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-main">
            DREAXXA
          </div>

          <div className="brand-mod">
            MOD
          </div>
        </div>

        <div className="brand-line"></div>

        <nav className="sidebar-nav">

          <button
            className={
              activePage === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("dashboard")}
          >
            <span>▣</span>
            Dashboard
          </button>

          <button
            className={
              activePage === "create"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("create")}
          >
            <span>＋</span>
            Create Key
          </button>

          <button
            className={
              activePage === "manage"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("manage")}
          >
            <span>☷</span>
            Manage Keys
          </button>

          <button
            className={
              activePage === "settings"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("settings")}
          >
            <span>⚙</span>
            Settings
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="server-status">
            <span className="status-dot"></span>
            Server Online
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>

      <main className="main-content">

        <header className="topbar">

          <div>
            <h1>
              {activePage === "dashboard" &&
                "Dashboard"}

              {activePage === "create" &&
                "Create License Key"}

              {activePage === "manage" &&
                "Manage Keys"}

              {activePage === "settings" &&
                "Settings"}
            </h1>

            <p>
              DREAXXA MOD Control Center
            </p>
          </div>

          <div className="admin-user">
            <div className="admin-avatar">
              {adminName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>{adminName}</strong>
              <span>{user.email}</span>
            </div>
          </div>

        </header>

        {activePage === "dashboard" && (
          <section>

            <div className="stats-grid">

              <div className="stat-card">
                <div className="stat-title">
                  TOTAL KEYS
                </div>

                <div className="stat-number">
                  {totalKeys}
                </div>

                <div className="stat-description">
                  All license keys
                </div>
              </div>

              <div className="stat-card active-card">
                <div className="stat-title">
                  ACTIVE KEYS
                </div>

                <div className="stat-number">
                  {activeKeys}
                </div>

                <div className="stat-description">
                  Currently active
                </div>
              </div>

              <div className="stat-card expired-card">
                <div className="stat-title">
                  EXPIRED
                </div>

                <div className="stat-number">
                  {expiredKeys}
                </div>

                <div className="stat-description">
                  Expired licenses
                </div>
              </div>

              <div className="stat-card disabled-card">
                <div className="stat-title">
                  DISABLED
                </div>

                <div className="stat-number">
                  {disabledKeys}
                </div>

                <div className="stat-description">
                  Disabled licenses
                </div>
              </div>

            </div>

            <div className="dashboard-grid">

              <div className="panel-card">

                <div className="panel-header">
                  <div>
                    <h2>Quick Actions</h2>
                    <p>
                      Manage your license system
                    </p>
                  </div>
                </div>

                <div className="quick-actions">

                  <button
                    className="quick-button"
                    onClick={() =>
                      setActivePage("create")
                    }
                  >
                    <strong>
                      ＋ Create Key
                    </strong>

                    <span>
                      Create a new license
                    </span>
                  </button>

                  <button
                    className="quick-button"
                    onClick={() =>
                      setActivePage("manage")
                    }
                  >
                    <strong>
                      ☷ Manage Keys
                    </strong>

                    <span>
                      View and control keys
                    </span>
                  </button>

                  <button
                    className="quick-button"
                    onClick={() =>
                      setActivePage("settings")
                    }
                  >
                    <strong>
                      ⚙ Settings
                    </strong>

                    <span>
                      Configure application
                    </span>
                  </button>

                </div>

              </div>

              <div className="panel-card">

                <div className="panel-header">
                  <div>
                    <h2>System Status</h2>
                    <p>
                      Current server information
                    </p>
                  </div>
                </div>

                <div className="system-row">
                  <span>Firebase Database</span>
                  <strong className="online-text">
                    ONLINE
                  </strong>
                </div>

                <div className="system-row">
                  <span>Authentication</span>
                  <strong className="online-text">
                    SECURE
                  </strong>
                </div>

                <div className="system-row">
                  <span>App Version</span>
                  <strong>
                    {settings.appVersion || "1.0.0"}
                  </strong>
                </div>

                <div className="system-row">
                  <span>Maintenance</span>
                  <strong>
                    {settings.maintenance
                      ? "ON"
                      : "OFF"}
                  </strong>
                </div>

              </div>

            </div>

          </section>
        )}

        {activePage === "create" && (
          <section className="page-section">

            <div className="form-card">

              <div className="panel-header">
                <div>
                  <h2>Create License Key</h2>
                  <p>
                    Generate a new DREAXXA license
                  </p>
                </div>
              </div>

              <form
                className="license-form"
                onSubmit={createLicenseKey}
              >

                <label>
                  License Key
                </label>

                <div className="key-input-row">

                  <input
                    type="text"
                    placeholder="DRX-XXXX-XXXX"
                    value={keyName}
                    onChange={(event) =>
                      setKeyName(event.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={createRandomKey}
                  >
                    Generate
                  </button>

                </div>

                <label>
                  Expiry Date
                </label>

                <input
                  type="date"
                  value={expiryDate}
                  onChange={(event) =>
                    setExpiryDate(event.target.value)
                  }
                />

                <label>
                  Expiry Time
                </label>

                <input
                  type="time"
                  value={expiryTime}
                  onChange={(event) =>
                    setExpiryTime(event.target.value)
                  }
                />

                {createMessage && (
                  <div className="success-message">
                    {createMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary-button"
                >
                  CREATE LICENSE
                </button>

              </form>

            </div>

          </section>
        )}

        {activePage === "manage" && (
          <section className="page-section">

            <div className="panel-card">

              <div className="panel-header">

                <div>
                  <h2>License Keys</h2>

                  <p>
                    Control all DREAXXA licenses
                  </p>
                </div>

                <button
                  className="primary-button small-button"
                  onClick={() =>
                    setActivePage("create")
                  }
                >
                  + CREATE KEY
                </button>

              </div>

              {keyEntries.length === 0 ? (
                <div className="empty-state">
                  No license keys found.
                </div>
              ) : (
                <div className="keys-table">

                  <div className="table-head">
                    <span>LICENSE KEY</span>
                    <span>STATUS</span>
                    <span>EXPIRY</span>
                    <span>ACTION</span>
                  </div>

                  {keyEntries.map(
                    ([key, data]) => {

                      const status =
                        getKeyStatus(data);

                      return (
                        <div
                          className="table-row"
                          key={key}
                        >

                          <div className="key-text">
                            {key}
                          </div>

                          <div>
                            <span
                              className={
                                "status-badge " +
                                status
                              }
                            >
                              {status.toUpperCase()}
                            </span>
                          </div>

                          <div className="expiry-text">
                            {formatExpiry(
                              data.expiresAt
                            )}
                          </div>

                          <div className="action-buttons">

                            <button
                              className={
                                data.enabled
                                  ? "toggle-button on"
                                  : "toggle-button off"
                              }
                              onClick={() =>
                                toggleKey(
                                  key,
                                  Boolean(
                                    data.enabled
                                  )
                                )
                              }
                            >
                              {data.enabled
                                ? "ON"
                                : "OFF"}
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                deleteKey(key)
                              }
                            >
                              DELETE
                            </button>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>

          </section>
        )}

        {activePage === "settings" && (
          <section className="page-section">

            <div className="settings-grid">

              <div className="form-card">

                <div className="panel-header">
                  <div>
                    <h2>Admin Profile</h2>
                    <p>
                      Update dashboard information
                    </p>
                  </div>
                </div>

                <form
                  className="license-form"
                  onSubmit={saveSettings}
                >

                  <label>
                    Admin Name
                  </label>

                  <input
                    type="text"
                    value={adminName}
                    onChange={(event) =>
                      setAdminName(
                        event.target.value
                      )
                    }
                  />

                  <label>
                    App Version
                  </label>

                  <input
                    type="text"
                    value={appVersion}
                    onChange={(event) =>
                      setAppVersion(
                        event.target.value
                      )
                    }
                  />

                  <div className="maintenance-box">

                    <div>
                      <strong>
                        Maintenance Mode
                      </strong>

                      <span>
                        Control application
                        maintenance status
                      </span>
                    </div>

                    <button
                      type="button"
                      className={
                        maintenance
                          ? "toggle-button on"
                          : "toggle-button off"
                      }
                      onClick={() =>
                        setMaintenance(
                          !maintenance
                        )
                      }
                    >
                      {maintenance
                        ? "ON"
                        : "OFF"}
                    </button>

                  </div>

                  {settingsMessage && (
                    <div className="success-message">
                      {settingsMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    SAVE SETTINGS
                  </button>

                </form>

              </div>

              <div className="panel-card">

                <div className="panel-header">
                  <div>
                    <h2>Server Status</h2>
                    <p>
                      Firebase connection
                    </p>
                  </div>
                </div>

                <div className="server-big-status">
                  <span className="status-dot"></span>
                  <strong>ONLINE</strong>
                </div>

                <div className="system-row">
                  <span>Database</span>
                  <strong>
                    Realtime Database
                  </strong>
                </div>

                <div className="system-row">
                  <span>Authentication</span>
                  <strong>
                    Firebase Auth
                  </strong>
                </div>

                <div className="system-row">
                  <span>Logged in as</span>
                  <strong>
                    {user.email}
                  </strong>
                </div>

              </div>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default App;