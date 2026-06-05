window.AnnouncementModule = {
  create(announcement) {
    const app = window.SmartSchedule;
    const data = app.readData();
    const record = {
      ...announcement,
      id: app.makeId("ann"),
      createdAt: new Date().toISOString()
    };
    data.announcements.unshift(record);
    app.writeData(data);
    if (window.FirebaseService?.hasConfig()) {
      window.FirebaseService.setDocument("announcements", record.id, record);
    }
  }
};
