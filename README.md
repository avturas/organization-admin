# 🏛️ Political Party Management Platform

**Role-based management system for political organizations**  
Built with Angular 20 and Firebase, this platform supports structured document sharing, announcements, and organizational workflows with secure, scalable access control.

---

## 🚀 Features

- 🔐 Firebase Phone Authentication with custom claims
- 🧾 Role-based access control for users (headquarters, city, district)
- 📢 Announcements with audience-based visibility (`everyone`, `city`, `district`, etc.)
- 🗂️ Document storage and permission-based access
- 📅 Event and committee management
- 🌐 Built with Angular 20 + Angular Material UI

---

## 🧱 Tech Stack

| Layer    | Tech                                            |
| -------- | ----------------------------------------------- |
| Frontend | Angular 20, Angular Material                    |
| Backend  | Firebase (Firestore, Storage, Functions)        |
| Auth     | Firebase Authentication (Phone + Custom Claims) |
| Hosting  | Not deployed yet                                |

---

## 📂 Folder Structure

```
firebase/
  rules/
    firestore.rules     # Firestore access logic
    storage.rules       # Cloud Storage access logic
src/
  app/
    ...                 # Angular application code
.gitignore
LICENSE
README.md
.firebaserc.example
firebase.json.example
```

---

## 🛠️ Getting Started

### 1. Clone the Repo and Install Dependencies

```bash
git clone https://github.com/avturas/parti-admin.git
cd parti-admin
npm install
```

### 2. Setup Firebase Config

```bash
cp .firebaserc.example .firebaserc
cp firebase.json.example firebase.json
```

Then update `.firebaserc` with your Firebase project ID.

### 3. Start the App

```bash
npm start
```

---

## 🔐 Firebase Rules

All Firebase rules are located under the `/firebase/rules/` folder:

- `firestore.rules`: Document-based security model with hierarchical access
- `storage.rules`: File access control using metadata (`audienceType`, `city`, `district`, etc.)

These rules enforce strict role-based access for all operations.

---

## 🧾 License

This project is licensed under the **MIT License**.  
See the [LICENSE](./LICENSE) file for full license text.

---

## 🌐 Maintained by

**AVTURAS** – open political infrastructure for the future.
