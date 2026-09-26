import { useState, useEffect } from "react";
import "./App.css";
import { ref, onValue, set } from "firebase/database";
import { database } from "./firebase";

const ADMIN_PASSWORD = "DREAXXA@123";

function App() {
  /* =========================
     LOGIN
  ========================= */

  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setLoggedIn(true);
      setPassword("");
      setLoginError("");
    } else {
      setLoginError("Incorrect password ❌");
    }
  };

  /* =========================
     DASHBOARD STATES
  ========================= */

  const [active, setActive] = useState("Dashboard");
  const [keys, setKeys] = useState({});

  const [newKey, setNewKey] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryTime, setExpiryTime] = useState("");

  const [adminName, setAdminName] = useState("Admin");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [maintenance, setMaintenance] = useState(false);

  const [settingsMessage, setSettingsMessage] = useState("");

  /* =========================
     FIREBASE KEYS
  ========================= */

  useEffect(() => {
    if (!loggedIn) return;

    const keysRef = ref(database, "keys");

    const unsubscribe = onValue(
      keysRef,
      (snapshot) => {
        setKeys(snapshot.val() || {});
      },
      (error) => {
        console.error("Firebase read error:", error);
      }
    );

    return () => unsubscribe();
  }, [loggedIn]);

  /* =========================
     FIREBASE SETTINGS
  ========================= */

  useEffect(() => {
    if (!loggedIn) return;

    const settingsRef = ref(database, "settings");

    const unsubscribe = onValue(
      settingsRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) return;

        if (data.adminName !== undefined) {
          setAdminName(data.adminName);
        }

        if (data.appVersion !== undefined) {
          setAppVersion(data.appVersion);
        }

        if (data.maintenance !== undefined) {
          setMaintenance(data.maintenance);
        }
      },
      (error) => {
        console.error("Settings read error:", error);
      }
    );

    return () => unsubscribe();
  }, [loggedIn]);

  /* =========================
     MENU
  ========================= */

  const menu = [
    "Dashboard",
    "Create Key",
    "Manage Keys",
    "Settings",
  ];

  const keyList = Object.entries(keys);

  /* =========================
     KEY STATS
  ========================= */

  const activeKeys = keyList.filter(([_, data]) => {
    if (!data?.enabled) return false;

    if (!data?.expiresAt) return true;

    return Date.now() < Number(data.expiresAt);
  });

  const expiredKeys = keyList.filter(([_, data]) => {
    if (!data?.expiresAt) return false;

    return Date.now() >= Number(data.expiresAt);
  });

  const disabledKeys = keyList.filter(
    ([_, data]) => data?.enabled === false
  );

  /* =========================
     CREATE KEY
  ========================= */

  const createKey = async () => {
    const key = newKey.trim();

    if (!key) {
      alert("Please enter license key");
      return;
    }

    if (!expiryDate || !expiryTime) {
      alert("Please select expiry date and time");
      return;
    }

    const expiresAt = new Date(
      `${expiryDate}T${expiryTime}`
    ).getTime();

    try {
      await set(ref(database, `keys/${key}`), {
        enabled: true,
        expiresAt: expiresAt,
      });

      alert("License Key Created Successfully!");

      setNewKey("");
      setExpiryDate("");
      setExpiryTime("");

      setActive("Manage Keys");
    } catch (error) {
      console.error(error);
      alert("Failed to create license key");
    }
  };

  /* =========================
     TOGGLE KEY
  ========================= */

  const toggleKey = async (key, currentStatus) => {
    try {
      await set(
        ref(database, `keys/${key}/enabled`),
        !currentStatus
      );
    } catch (error) {
      console.error(error);
      alert("Failed to change license status");
    }
  };

  /* =========================
     DELETE KEY
  ========================= */

  const deleteKey = async (key) => {
    const confirmDelete = window.confirm(
      `Delete license ${key}?`
    );

    if (!confirmDelete) return;

    try {
      await set(
        ref(database, `keys/${key}`),
        null
      );

      alert("License deleted successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to delete license");
    }
  };

  /* =========================
     SAVE SETTINGS
  ========================= */

  const saveSettings = async () => {
    try {
      await set(ref(database, "settings"), {
        adminName: adminName,
        appVersion: appVersion,
        maintenance: maintenance,
      });

      setSettingsMessage(
        "Settings saved successfully ✅"
      );

      setTimeout(() => {
        setSettingsMessage("");
      }, 3000);

    } catch (error) {
      console.error(error);

      setSettingsMessage(
        "Failed to save settings ❌"
      );
    }
  };

  /* =========================
     LOGIN SCREEN
  ========================= */

  if (!loggedIn) {
    return (
      <div className="app">
        <main
          className="main"
          style={{
            width: "100%",
            marginLeft: 0,
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <section
            className="panel"
            style={{
              width: "100%",
              maxWidth: "420px",
              textAlign: "center",
            }}
          >
            <div className="logo">
              <span>DREAXXA</span>
              <small>ADMIN PANEL</small>
            </div>

            <h2 style={{ marginTop: "10px" }}>
              Admin Login
            </h2>

            <p>
              Enter your administrator password
            </p>

            <div style={{ marginTop: "25px" }}>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#080e17",
                  border: "1px solid #1d2a3d",
                  borderRadius: "9px",
                  outline: "none",
                  color: "white",
                  fontSize: "13px",
                }}
              />
            </div>

            <button
              className="primary"
              onClick={handleLogin}
              style={{
                width: "100%",
                marginTop: "15px",
              }}
            >
              LOGIN TO DASHBOARD
            </button>

            {loginError && (
              <p
                style={{
                  color: "#ff5d5d",
                  marginTop: "15px",
                  fontSize: "12px",
                }}
              >
                {loginError}
              </p>
            )}

            <p
              style={{
                marginTop: "25px",
                color: "#4f5c70",
                fontSize: "10px",
              }}
            >
              DREAXXA MOD • Secure Admin Access
            </p>
          </section>
        </main>
      </div>
    );
  }

  /* =========================
     MAIN DASHBOARD
  ========================= */

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          <span>DREAXXA</span>
          <small>ADMIN PANEL</small>
        </div>

        <div className="menu">

          {menu.map((item) => (
            <button
              key={item}
              className={
                active === item
                  ? "menu-item active"
                  : "menu-item"
              }
              onClick={() => setActive(item)}
            >
              {item}
            </button>
          ))}

          <button
            className="menu-item"
            onClick={() => {
              setLoggedIn(false);
              setActive("Dashboard");
            }}
            style={{
              marginTop: "10px",
              color: "#ff6767",
            }}
          >
            Logout
          </button>

        </div>

        <div className="sidebar-bottom">

          <div className="server">
            <span className="dot"></span>
            Server Online
          </div>

          <div className="version">
            DREAXXA MOD v{appVersion}
          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        {/* TOPBAR */}

        <header className="topbar">

          <div>

            <h1>{active}</h1>

            <p>
              Welcome to DREAXXA MOD control panel
            </p>

          </div>

          <div className="admin">

            <div className="avatar">
              D
            </div>

            <div>

              <strong>
                {adminName}
              </strong>

              <small>
                Administrator
              </small>

            </div>

          </div>

        </header>

        {/* =========================
            DASHBOARD
        ========================= */}

        {active === "Dashboard" && (
          <>

            <section className="stats">

              <div className="card">
                <span>Total Keys</span>
                <strong>{keyList.length}</strong>
                <small>All licenses</small>
              </div>

              <div className="card green">
                <span>Active Keys</span>
                <strong>{activeKeys.length}</strong>
                <small>Currently enabled</small>
              </div>

              <div className="card orange">
                <span>Expired</span>
                <strong>{expiredKeys.length}</strong>
                <small>Expired licenses</small>
              </div>

              <div className="card red">
                <span>Disabled</span>
                <strong>{disabledKeys.length}</strong>
                <small>Turned off</small>
              </div>

            </section>

            {/* QUICK ACTIONS */}

            <section className="panel">

              <div className="panel-title">

                <div>

                  <h2>Quick Actions</h2>

                  <p>
                    Manage your licenses quickly
                  </p>

                </div>

              </div>

              <div className="actions">

                <button
                  onClick={() =>
                    setActive("Create Key")
                  }
                >
                  <b>+</b>
                  Create New Key
                </button>

                <button
                  onClick={() =>
                    setActive("Manage Keys")
                  }
                >
                  <b>⌕</b>
                  Manage Keys
                </button>

              </div>

            </section>

            {/* RECENT LICENSE */}

            <section className="panel">

              <div className="panel-title">

                <div>

                  <h2>Recent License</h2>

                  <p>
                    Latest license activity
                  </p>

                </div>

              </div>

              {keyList.length === 0 ? (

                <div className="key-row">
                  <span>
                    No licenses found
                  </span>
                </div>

              ) : (

                keyList.map(([key, data]) => (

                  <div
                    className="key-row"
                    key={key}
                  >

                    <div>

                      <strong>
                        {key}
                      </strong>

                      <span>
                        {data?.enabled
                          ? "Enabled"
                          : "Disabled"}
                      </span>

                    </div>

                    <span
                      className={
                        data?.enabled
                          ? "badge active-badge"
                          : "badge"
                      }
                    >
                      {data?.enabled
                        ? "ACTIVE"
                        : "OFF"}
                    </span>

                  </div>

                ))

              )}

            </section>

          </>
        )}

        {/* =========================
            CREATE KEY
        ========================= */}

        {active === "Create Key" && (

          <section className="panel page-panel">

            <h2>
              Create License Key
            </h2>

            <p>
              Create a new DREAXXA MOD license.
            </p>

            <div className="form-grid">

              <input
                type="text"
                placeholder="License Key"
                value={newKey}
                onChange={(e) =>
                  setNewKey(e.target.value)
                }
              />

              <input
                type="date"
                value={expiryDate}
                onChange={(e) =>
                  setExpiryDate(e.target.value)
                }
              />

              <input
                type="time"
                value={expiryTime}
                onChange={(e) =>
                  setExpiryTime(e.target.value)
                }
              />

            </div>

            <button
              className="primary"
              onClick={createKey}
            >
              CREATE KEY
            </button>

          </section>

        )}

        {/* =========================
            MANAGE KEYS
        ========================= */}

        {active === "Manage Keys" && (

          <section className="panel page-panel">

            <h2>
              Manage License Keys
            </h2>

            <p>
              Control your licenses directly from Firebase.
            </p>

            {keyList.length === 0 ? (

              <div className="key-row">
                <span>
                  No keys found
                </span>
              </div>

            ) : (

              keyList.map(([key, data]) => (

                <div
                  className="key-row"
                  key={key}
                >

                  <div>

                    <strong>
                      {key}
                    </strong>

                    <span>
                      Status:{" "}
                      {data?.enabled
                        ? "ON"
                        : "OFF"}
                    </span>

                    <span>
                      Expires:{" "}
                      {data?.expiresAt
                        ? new Date(
                            Number(data.expiresAt)
                          ).toLocaleString()
                        : "No expiry"}
                    </span>

                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >

                    <button
                      className="toggle"
                      onClick={() =>
                        toggleKey(
                          key,
                          data?.enabled
                        )
                      }
                    >
                      {data?.enabled
                        ? "ON"
                        : "OFF"}
                    </button>

                    <button
                      className="toggle"
                      onClick={() =>
                        deleteKey(key)
                      }
                    >
                      DELETE
                    </button>

                  </div>

                </div>

              ))

            )}

          </section>

        )}

        {/* =========================
            SETTINGS
        ========================= */}

        {active === "Settings" && (

          <section className="panel page-panel">

            <h2>
              Admin Settings
            </h2>

            <p>
              Configure your DREAXXA MOD control panel.
            </p>

            {/* ADMIN PROFILE */}

            <div
              style={{
                marginTop: "25px",
                marginBottom: "25px",
              }}
            >

              <h3>
                Admin Profile
              </h3>

              <p>
                Change the administrator name.
              </p>

              <input
                type="text"
                placeholder="Admin Name"
                value={adminName}
                onChange={(e) =>
                  setAdminName(e.target.value)
                }
              />

            </div>

            {/* APP VERSION */}

            <div
              style={{
                marginBottom: "25px",
              }}
            >

              <h3>
                App Version
              </h3>

              <p>
                Current DREAXXA MOD version.
              </p>

              <input
                type="text"
                placeholder="1.0.0"
                value={appVersion}
                onChange={(e) =>
                  setAppVersion(e.target.value)
                }
              />

            </div>

            {/* SERVER STATUS */}

            <div
              style={{
                marginBottom: "25px",
              }}
            >

              <h3>
                Server Status
              </h3>

              <p>

                <span
                  style={{
                    color: "#55D98A",
                    fontWeight: "bold",
                  }}
                >
                  ● ONLINE
                </span>

              </p>

            </div>

            {/* MAINTENANCE */}

            <div
              style={{
                marginBottom: "25px",
              }}
            >

              <h3>
                Maintenance Mode
              </h3>

              <p>
                Temporarily disable the app for maintenance.
              </p>

              <button
                className="toggle"
                onClick={() =>
                  setMaintenance(!maintenance)
                }
              >
                {maintenance
                  ? "ENABLED"
                  : "DISABLED"}
              </button>

            </div>

            {/* SAVE */}

            <button
              className="primary"
              onClick={saveSettings}
            >
              SAVE SETTINGS
            </button>

            {settingsMessage && (

              <p
                style={{
                  marginTop: "15px",
                  color: "#55D98A",
                }}
              >
                {settingsMessage}
              </p>

            )}

          </section>

        )}

      </main>

    </div>
  );
}

export default App;