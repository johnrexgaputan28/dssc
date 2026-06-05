window.addEventListener("DOMContentLoaded", () => {
  const app = window.SmartSchedule;
  const user = app.requireAuth();
  if (!user) return;

  app.renderShell("calendar");
  const schedules = app.getVisibleSchedules(user);
  app.renderCalendar(document.getElementById("calendarMount"), schedules);
});
