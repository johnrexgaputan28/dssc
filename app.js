(() => {
  const storageKey = "smartScheduleData";
  const sessionKey = "smartScheduleSession";

  const today = new Date();
  const iso = (offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };

  const seedData = {
    users: [
      { id: "u-student", name: "Juan Dela Cruz", email: "student@college.edu", password: "password123", role: "student", section: "BSIT-2A", course: "BSIT" },
      { id: "u-prof", name: "Prof. Maria Santos", email: "professor@college.edu", password: "password123", role: "professor", sections: ["BSIT-2A", "BSIT-3B"], department: "Information Technology" },
      { id: "u-admin", name: "Admin Reyes", email: "admin@college.edu", password: "password123", role: "admin", department: "College Administration" }
    ],
    sections: [
      { id: "BSIT-2A", name: "BSIT-2A", course: "BSIT", yearLevel: "2nd Year" },
      { id: "BSIT-3B", name: "BSIT-3B", course: "BSIT", yearLevel: "3rd Year" },
      { id: "BSCS-1A", name: "BSCS-1A", course: "BSCS", yearLevel: "1st Year" }
    ],
    schedules: [
      { id: "sched-1", subject: "Web Systems and Technologies", professor: "Prof. Maria Santos", professorId: "u-prof", section: "BSIT-2A", date: iso(1), startTime: "08:00", endTime: "10:00", room: "IT Lab 2", status: "scheduled" },
      { id: "sched-2", subject: "Database Management", professor: "Prof. Maria Santos", professorId: "u-prof", section: "BSIT-2A", date: iso(2), startTime: "13:00", endTime: "15:00", room: "Room 204", status: "room_changed" },
      { id: "sched-3", subject: "Systems Analysis", professor: "Prof. Maria Santos", professorId: "u-prof", section: "BSIT-3B", date: iso(3), startTime: "10:00", endTime: "12:00", room: "Room 301", status: "cancelled" }
    ],
    announcements: [
      { id: "ann-1", title: "Room change for Database Management", message: "Database Management will meet in Room 204 this week.", author: "Prof. Maria Santos", authorId: "u-prof", audience: "BSIT-2A", type: "room_change", createdAt: new Date().toISOString() },
      { id: "ann-2", title: "College reminder", message: "Please check your academic calendar daily for sudden class updates.", author: "Admin Reyes", authorId: "u-admin", audience: "all", type: "reminder", createdAt: new Date(Date.now() - 86400000).toISOString() }
    ]
  };

  function readData() {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      localStorage.setItem(storageKey, JSON.stringify(seedData));
      return structuredClone(seedData);
    }
    return JSON.parse(saved);
  }

  function writeData(data) {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  async function syncFromFirebase() {
    if (!window.FirebaseService?.hasConfig()) return readData();
    const remoteData = await window.FirebaseService.loadAllData();
    writeData({ ...seedData, ...remoteData });
    return readData();
  }

  function upsertLocalUser(user) {
    const data = readData();
    const index = data.users.findIndex((item) => item.id === user.id);
    if (index >= 0) {
      data.users[index] = { ...data.users[index], ...user };
    } else {
      data.users.push(user);
    }
    writeData(data);
  }

  function getSession() {
    const id = localStorage.getItem(sessionKey);
    return readData().users.find((user) => user.id === id) || null;
  }

  function setSession(user) {
    localStorage.setItem(sessionKey, user.id);
    upsertLocalUser(user);
  }

  async function logout() {
    if (window.FirebaseService?.hasConfig()) {
      await window.FirebaseService.signOutUser();
    }
    localStorage.removeItem(sessionKey);
    window.location.href = "index.html";
  }

  function requireAuth(roles) {
    const user = getSession();
    if (!user) {
      window.location.href = "index.html";
      return null;
    }
    if (roles && !roles.includes(user.role)) {
      window.location.href = `${user.role}.html`;
      return null;
    }
    return user;
  }

  function navItems(user) {
    const items = [
      ["Dashboard", "dashboard.html", "dashboard"],
      ["Calendar", "calendar.html", "calendar"],
      ["Announcements", "announcements.html", "announcements"],
      ["Profile", "profile.html", "profile"]
    ];
    if (user.role === "student") items.splice(1, 0, ["Student", "student.html", "student"]);
    if (user.role === "professor") items.splice(1, 0, ["Professor", "professor.html", "professor"]);
    if (user.role === "admin") items.splice(1, 0, ["Admin", "admin.html", "admin"]);
    return items;
  }

  function renderShell(activePage) {
    const user = requireAuth();
    if (!user) return;
    const root = document.querySelector("[data-app-shell]");
    const initials = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2);

    root.innerHTML = `
      <div class="mobile-overlay" data-mobile-overlay></div>
      <header class="mobile-appbar">
        <button class="menu-button" type="button" id="mobileMenuButton" aria-label="Open navigation" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <a class="mobile-brand" href="dashboard.html"><span>SA</span><strong>${pageTitle(activePage, user)}</strong></a>
      </header>
      <aside class="sidebar">
        <a class="app-logo" href="dashboard.html"><span>SA</span><strong>Smart Schedule</strong></a>
        <nav>
          ${navItems(user).map(([label, href, key]) => `<a class="${activePage === key ? "active" : ""}" href="${href}">${label}</a>`).join("")}
        </nav>
      </aside>
      <main class="main-panel">
        <header class="topbar">
          <div>
            <p class="eyebrow">${user.role}</p>
            <h1>${pageTitle(activePage, user)}</h1>
          </div>
          <div class="user-chip">
            <span>${initials}</span>
            <div><strong>${user.name}</strong><small>${user.section || user.department || "Academic User"}</small></div>
            <button class="ghost-button" id="logoutButton">Logout</button>
          </div>
        </header>
        <section id="pageMount"></section>
      </main>
    `;
    document.getElementById("logoutButton").addEventListener("click", logout);
    setupShellInteractions(root);
    renderPage(activePage, user);
  }

  function setupShellInteractions(root) {
    const menuButton = root.querySelector("#mobileMenuButton");
    const overlay = root.querySelector("[data-mobile-overlay]");
    const sidebar = root.querySelector(".sidebar");
    const navLinks = root.querySelectorAll(".sidebar nav a");

    function setMenu(open) {
      sidebar.classList.toggle("is-open", open);
      overlay.classList.toggle("is-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
    }

    menuButton.addEventListener("click", () => setMenu(!sidebar.classList.contains("is-open")));
    overlay.addEventListener("click", () => setMenu(false));
    navLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));
  }

  function pageTitle(page, user) {
    const titles = {
      dashboard: "Academic Dashboard",
      student: "Student Dashboard",
      professor: "Professor Workspace",
      admin: "Administration",
      calendar: "Schedule Calendar",
      announcements: "Announcements",
      profile: "Profile and Notifications"
    };
    return titles[page] || `Welcome, ${user.name}`;
  }

  function statusLabel(status) {
    const labels = {
      scheduled: "Scheduled",
      room_changed: "Room Changed",
      cancelled: "Cancelled",
      absent: "Professor Absent"
    };
    return labels[status] || status;
  }

  function getVisibleSchedules(user) {
    const data = readData();
    if (user.role === "student") return data.schedules.filter((item) => item.section === user.section);
    if (user.role === "professor") return data.schedules.filter((item) => item.professorId === user.id);
    return data.schedules;
  }

  function getVisibleAnnouncements(user) {
    const data = readData();
    return data.announcements.filter((item) => item.audience === "all" || item.audience === user.role || item.audience === user.section || (user.sections || []).includes(item.audience));
  }

  function scheduleCard(item) {
    return `
      <article class="item-card status-${item.status}" tabindex="0">
        <div>
          <p class="eyebrow">${item.section} - ${statusLabel(item.status)}</p>
          <h3>${item.subject}</h3>
          <p>${item.professor}</p>
        </div>
        <dl class="mini-list">
          <div><dt>Date</dt><dd>${item.date}</dd></div>
          <div><dt>Time</dt><dd>${item.startTime} - ${item.endTime}</dd></div>
          <div><dt>Room</dt><dd>${item.room}</dd></div>
        </dl>
      </article>
    `;
  }

  function announcementCard(item) {
    return `
      <article class="item-card announcement-card" tabindex="0">
        <p class="eyebrow">${item.type.replace("_", " ")} - ${item.audience}</p>
        <h3>${item.title}</h3>
        <p>${item.message}</p>
        <footer>${item.author} - ${new Date(item.createdAt).toLocaleDateString()}</footer>
      </article>
    `;
  }

  function renderDashboard(mount, user) {
    const schedules = getVisibleSchedules(user);
    const announcements = getVisibleAnnouncements(user);
    const cancelled = schedules.filter((item) => ["cancelled", "absent"].includes(item.status));
    mount.innerHTML = `
      <div class="metric-grid">
        <article class="metric-card"><span>${schedules.length}</span><p>Visible schedules</p></article>
        <article class="metric-card"><span>${announcements.length}</span><p>Announcements</p></article>
        <article class="metric-card alert"><span>${cancelled.length}</span><p>Cancellations or absences</p></article>
      </div>
      <div class="content-grid">
        <section>
          <div class="section-heading"><h2>Upcoming Classes</h2><a href="calendar.html">View calendar</a></div>
          <div class="item-list">${schedules.slice(0, 4).map(scheduleCard).join("") || emptyState("No schedules yet.")}</div>
        </section>
        <section>
          <div class="section-heading"><h2>Latest Announcements</h2><a href="announcements.html">View all</a></div>
          <div class="item-list">${announcements.slice(0, 4).map(announcementCard).join("") || emptyState("No announcements yet.")}</div>
        </section>
      </div>
    `;
  }

  function emptyState(message) {
    return `<div class="empty-state">${message}</div>`;
  }

  function renderCalendar(mount, schedules) {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    mount.innerHTML = `
      <div class="calendar-board">
        ${days.map((day) => `
          <section class="calendar-day">
            <h3>${day}</h3>
            ${schedules.filter((item) => new Date(item.date).toLocaleDateString("en-US", { weekday: "long" }) === day).map((item) => `
              <div class="calendar-event status-${item.status}">
                <strong>${item.subject}</strong>
                <span>${item.startTime} - ${item.endTime}</span>
                <small>${item.section} - ${item.room}</small>
              </div>
            `).join("") || `<p class="muted">No class</p>`}
          </section>
        `).join("")}
      </div>
    `;
  }

  function renderProfile(mount, user) {
    const schedules = getVisibleSchedules(user);
    const alerts = schedules.filter((item) => ["cancelled", "absent", "room_changed"].includes(item.status));
    mount.innerHTML = `
      <div class="content-grid">
        <section class="panel">
          <h2>Account</h2>
          <dl class="detail-list">
            <div><dt>Name</dt><dd>${user.name}</dd></div>
            <div><dt>Email</dt><dd>${user.email}</dd></div>
            <div><dt>Role</dt><dd>${user.role}</dd></div>
            <div><dt>Section</dt><dd>${user.section || (user.sections || []).join(", ") || "All sections"}</dd></div>
          </dl>
        </section>
        <section class="panel">
          <h2>Notifications</h2>
          <div class="item-list">
            ${alerts.map((item) => `<article class="notice"><strong>${statusLabel(item.status)}</strong><span>${item.subject} for ${item.section} on ${item.date}</span></article>`).join("") || emptyState("No urgent notifications.")}
          </div>
        </section>
      </div>
    `;
  }

  function renderPage(activePage, user) {
    const mount = document.getElementById("pageMount");
    if (activePage === "calendar") {
      mount.innerHTML = `<div id="calendarMount"></div>`;
      renderCalendar(document.getElementById("calendarMount"), getVisibleSchedules(user));
      return;
    }
    if (activePage === "profile") {
      renderProfile(mount, user);
      return;
    }
    if (activePage === "announcements") {
      mount.innerHTML = `<div class="section-heading"><h2>Announcement Feed</h2></div><div class="item-list">${getVisibleAnnouncements(user).map(announcementCard).join("") || emptyState("No announcements yet.")}</div>`;
      return;
    }
    renderDashboard(mount, user);
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  window.SmartSchedule = {
    readData,
    writeData,
    syncFromFirebase,
    upsertLocalUser,
    getSession,
    setSession,
    logout,
    requireAuth,
    renderShell,
    renderDashboard,
    renderCalendar,
    getVisibleSchedules,
    getVisibleAnnouncements,
    scheduleCard,
    announcementCard,
    emptyState,
    makeId,
    statusLabel
  };

  // Register Service Worker (PWA)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("SW Registered"))
      .catch((err) => console.warn("SW Registration failed", err));
  }

  window.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-app-shell]");
    if (root && !window.__rolePageRendered) {
      renderShell(root.dataset.page || "dashboard");
    }
  });
})();

