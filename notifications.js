window.addEventListener("DOMContentLoaded", () => {
  const app = window.SmartSchedule;
  const root = document.querySelector("[data-app-shell][data-page='profile']");
  if (!root) return;
  const user = app.requireAuth();
  if (!user) return;
  app.renderShell("profile");
});
