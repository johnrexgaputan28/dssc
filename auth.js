window.addEventListener("DOMContentLoaded", async () => {
  const app = window.SmartSchedule;
  const form = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const message = document.getElementById("loginMessage");

  function setMessage(text, type = "error") {
    message.textContent = text;
    message.dataset.type = type;
  }

  function showPanel(panelName) {
    document.querySelectorAll("[data-auth-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.authPanel !== panelName;
    });
    document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.authTab === panelName);
    });
    setMessage("", "info");
  }

  document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    tab.addEventListener("click", () => showPanel(tab.dataset.authTab));
  });

  document.querySelectorAll("[data-demo-login]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("email").value = button.dataset.demoLogin;
      document.getElementById("password").value = "password123";
    });
  });

  if (!form) return;

  if (window.FirebaseService?.hasConfig()) {
    setMessage("Firebase mode enabled. You can sign in or create a new student/professor account.", "info");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    let user = null;

    setMessage("Signing in...", "info");

    if (window.FirebaseService?.hasConfig()) {
      try {
        const firebaseUser = await window.FirebaseService.signIn(email, password);
        const profile = await window.FirebaseService.getUserProfile(firebaseUser.uid);

        if (!profile) {
          setMessage("Login works, but no Firestore user profile exists for this account.");
          return;
        }

        await app.syncFromFirebase();
        user = { ...profile, email: firebaseUser.email };
      } catch (error) {
        setMessage(error.message.replace("Firebase: ", ""));
        return;
      }
    } else {
      user = app.readData().users.find((item) => item.email === email && item.password === password);
    }

    if (!user) {
      setMessage("Invalid email or password.");
      return;
    }

    app.setSession(user);
    window.location.href = `${user.role}.html`;
  });

  if (!registerForm) return;

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;
    const role = document.getElementById("registerRole").value;
    const section = document.getElementById("registerSection").value.trim().toUpperCase();

    if (!name || !email || !password || !section) {
      setMessage("Please complete all account fields.");
      return;
    }

    setMessage("Creating account...", "info");

    if (window.FirebaseService?.hasConfig()) {
      try {
        const firebaseUser = await window.FirebaseService.createAccount(email, password);
        const profile = {
          id: firebaseUser.uid,
          name,
          email,
          role,
          section: role === "student" ? section : "",
          sections: role === "professor" ? [section] : [],
          course: role === "student" ? section.split("-")[0] : "",
          department: role === "professor" ? "College" : ""
        };

        await window.FirebaseService.setDocument("users", firebaseUser.uid, profile);
        app.setSession(profile);
        window.location.href = `${role}.html`;
      } catch (error) {
        setMessage(error.message.replace("Firebase: ", ""));
      }
      return;
    }

    const data = app.readData();
    if (data.users.some((user) => user.email === email)) {
      setMessage("An account already exists with this email.");
      return;
    }

    const profile = {
      id: app.makeId("user"),
      name,
      email,
      password,
      role,
      section: role === "student" ? section : "",
      sections: role === "professor" ? [section] : [],
      course: role === "student" ? section.split("-")[0] : "",
      department: role === "professor" ? "College" : ""
    };
    data.users.push(profile);
    app.writeData(data);
    app.setSession(profile);
    window.location.href = `${role}.html`;
  });
});
