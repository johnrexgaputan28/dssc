window.addEventListener("DOMContentLoaded", () => {
  const app = window.SmartSchedule;
  const user = app.requireAuth(["admin"]);
  if (!user) return;
  window.__rolePageRendered = true;
  app.renderShell("admin");

  function render() {
    const data = app.readData();
    const mount = document.getElementById("pageMount");
    mount.innerHTML = `
      <div class="metric-grid">
        <article class="metric-card"><span>${data.users.length}</span><p>Users</p></article>
        <article class="metric-card"><span>${data.sections.length}</span><p>Sections</p></article>
        <article class="metric-card"><span>${data.schedules.length}</span><p>Schedules</p></article>
      </div>
      <div class="management-grid">
        <section class="panel">
          <h2>Create User</h2>
          <form id="userForm" class="stacked-form compact">
            <label>Name<input name="name" required></label>
            <label>Email<input type="email" name="email" required></label>
            <label>Role<select name="role"><option value="student">Student</option><option value="professor">Professor</option><option value="admin">Admin</option></select></label>
            <label>Section<input name="section" placeholder="Example: BSIT-2A"></label>
            <button class="primary-button" type="submit">Create Account</button>
          </form>
        </section>
        <section class="panel">
          <h2>Add Section</h2>
          <form id="sectionForm" class="stacked-form compact">
            <label>Section Name<input name="name" placeholder="BSIT-2A" required></label>
            <label>Course<input name="course" placeholder="BSIT" required></label>
            <label>Year Level<input name="yearLevel" placeholder="2nd Year" required></label>
            <button class="primary-button" type="submit">Save Section</button>
          </form>
        </section>
      </div>
      <div class="content-grid">
        <section>
          <div class="section-heading"><h2>Users</h2></div>
          <div class="table-wrap">
            <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Section</th></tr></thead>
            <tbody>${data.users.map((item) => `<tr><td data-label="Name">${item.name}</td><td data-label="Email">${item.email}</td><td data-label="Role">${item.role}</td><td data-label="Section">${item.section || (item.sections || []).join(", ") || "All"}</td></tr>`).join("")}</tbody></table>
          </div>
        </section>
        <section>
          <div class="section-heading"><h2>Sections</h2></div>
          <div class="item-list">${data.sections.map((item) => `<article class="item-card"><h3>${item.name}</h3><p>${item.course} - ${item.yearLevel}</p></article>`).join("")}</div>
        </section>
      </div>
    `;

    document.getElementById("userForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      const role = form.get("role");
      const data = app.readData();
      data.users.push({
        id: app.makeId("user"),
        name: form.get("name"),
        email: form.get("email"),
        password: "password123",
        role,
        section: role === "student" ? form.get("section") : "",
        sections: role === "professor" && form.get("section") ? [form.get("section")] : undefined,
        department: role !== "student" ? "College" : undefined
      });
      const createdUser = data.users[data.users.length - 1];
      app.writeData(data);
      if (window.FirebaseService?.hasConfig()) {
        window.FirebaseService.setDocument("users", createdUser.id, createdUser);
      }
      render();
    });

    document.getElementById("sectionForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      const data = app.readData();
      const name = form.get("name");
      const section = { id: name, name, course: form.get("course"), yearLevel: form.get("yearLevel") };
      data.sections.push(section);
      app.writeData(data);
      if (window.FirebaseService?.hasConfig()) {
        window.FirebaseService.setDocument("sections", section.id, section);
      }
      render();
    });
  }

  render();
});
