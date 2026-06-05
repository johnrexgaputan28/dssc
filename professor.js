window.addEventListener("DOMContentLoaded", () => {
  const app = window.SmartSchedule;
  const user = app.requireAuth(["professor"]);
  if (!user) return;
  window.__rolePageRendered = true;
  app.renderShell("professor");

  function render() {
    const data = app.readData();
    const schedules = app.getVisibleSchedules(user);
    const sections = user.sections || [];
    const mount = document.getElementById("pageMount");
    mount.innerHTML = `
      <div class="management-grid">
        <section class="panel">
          <h2>Create Schedule</h2>
          <form id="scheduleForm" class="stacked-form compact">
            <label>Subject<input name="subject" required></label>
            <label>Section<select name="section">${sections.map((section) => `<option>${section}</option>`).join("")}</select></label>
            <label>Date<input type="date" name="date" required></label>
            <div class="form-row">
              <label>Start<input type="time" name="startTime" required></label>
              <label>End<input type="time" name="endTime" required></label>
            </div>
            <label>Room<input name="room" required></label>
            <button class="primary-button" type="submit">Save Schedule</button>
          </form>
        </section>
        <section class="panel">
          <h2>Post Announcement</h2>
          <form id="announcementForm" class="stacked-form compact">
            <label>Title<input name="title" required></label>
            <label>Audience<select name="audience">${sections.map((section) => `<option>${section}</option>`).join("")}<option value="all">All</option></select></label>
            <label>Type<select name="type"><option value="reminder">Reminder</option><option value="room_change">Room Change</option><option value="absence">Absence</option><option value="schedule_update">Schedule Update</option></select></label>
            <label>Message<textarea name="message" rows="4" required></textarea></label>
            <button class="primary-button" type="submit">Post Announcement</button>
          </form>
        </section>
      </div>
      <section>
        <div class="section-heading"><h2>My Classes</h2></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Subject</th><th>Section</th><th>Date</th><th>Time</th><th>Room</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>${schedules.map((item) => `
              <tr>
                <td data-label="Subject">${item.subject}</td>
                <td data-label="Section">${item.section}</td>
                <td data-label="Date">${item.date}</td>
                <td data-label="Time">${item.startTime} - ${item.endTime}</td>
                <td data-label="Room">${item.room}</td>
                <td data-label="Status">${app.statusLabel(item.status)}</td>
                <td data-label="Action">
                  <select data-status="${item.id}">
                    <option value="scheduled">Scheduled</option>
                    <option value="room_changed">Room Changed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="absent">Professor Absent</option>
                  </select>
                </td>
              </tr>
            `).join("") || `<tr><td colspan="7">No schedules yet.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    `;

    document.getElementById("scheduleForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      window.ScheduleModule.create({
        subject: form.get("subject"),
        professor: user.name,
        professorId: user.id,
        section: form.get("section"),
        date: form.get("date"),
        startTime: form.get("startTime"),
        endTime: form.get("endTime"),
        room: form.get("room"),
        status: "scheduled"
      });
      render();
    });

    document.getElementById("announcementForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      window.AnnouncementModule.create({
        title: form.get("title"),
        message: form.get("message"),
        author: user.name,
        authorId: user.id,
        audience: form.get("audience"),
        type: form.get("type")
      });
      render();
    });

    document.querySelectorAll("[data-status]").forEach((select) => {
      const schedule = data.schedules.find((item) => item.id === select.dataset.status);
      select.value = schedule.status;
      select.addEventListener("change", () => {
        window.ScheduleModule.updateStatus(select.dataset.status, select.value);
        render();
      });
    });
  }

  render();
});
