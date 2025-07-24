# 📋 Join - Task Management Application

> Eine moderne Kanban-Board-Anwendung für effizientes Projektmanagement und Teamzusammenarbeit

![Angular](https://img.shields.io/badge/Angular-19.2.15-red?style=flat-square&logo=angular)
![Firebase](https://img.shields.io/badge/Firebase-11.10.0-orange?style=flat-square&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🌟 Überblick

**Join** ist eine umfassende Task-Management-Anwendung, die auf Angular 19.2.15 basiert und modernste Drag & Drop-Funktionalität, Firebase-Integration und ein interaktives Onboarding-System bietet. Die Anwendung stellt ein Kanban-Style Board für die Verwaltung von Aufgaben mit Echtzeit-Kollaborationsfunktionen bereit.

### 🎯 Hauptfunktionen

- **📊 Kanban Board**: Drag & Drop Task-Management über mehrere Spalten
- **🔄 Echtzeit-Kollaboration**: Firebase-powered Backend mit Live-Updates
- **📱 Mobile-First Design**: Responsive Design mit Touch-Support
- **🔐 Erweiterte Authentifizierung**: Sicheres Login-System mit Gast-Zugang
- **🎓 Interaktives Onboarding**: Geführte Tour für neue Benutzer
- **👥 Kontakt-Management**: Integriertes Kontaktsystem für Task-Zuweisungen

---

## 🚀 Live Demo

**Production URL:** `https://m-chinahkash.de/join/`

---

## 📋 Funktionen im Detail

### 🎯 Dashboard (Summary)
- **Task-Statistiken**: Übersicht über alle Aufgaben nach Status
- **Urgent Tasks**: Anzeige dringender Aufgaben mit Deadline
- **Navigation**: Schneller Zugang zu verschiedenen Board-Bereichen
- **Begrüßung**: Zeitbasierte Begrüßungsnachrichten

### 📊 Kanban Board
- **4 Spalten**: To-Do, In Progress, Awaiting Feedback, Done
- **Drag & Drop**: Intuitive Task-Verschiebung zwischen Spalten
- **Touch Support**: Optimiert für mobile Geräte
- **Suchfunktion**: Filtern von Tasks nach Titel/Beschreibung
- **Priority System**: Niedrig, Mittel, Hoch mit visuellen Indikatoren

### ✏️ Task-Management
- **Task Creation**: Umfassende Formulare mit Validierung
- **Subtasks**: Hierarchische Aufgabengliederung mit Fortschrittsanzeige
- **Contact Assignment**: Zuweisung von Kontakten zu Tasks
- **Due Dates**: Deadline-Management mit Datepicker
- **Categories**: Technical Task oder User Story
- **Edit/Delete**: Vollständige CRUD-Operationen

### 👥 Kontakt-Verwaltung
- **Contact Management**: Hinzufügen, Bearbeiten, Löschen von Kontakten
- **Avatar System**: Automatische Initialen-Generierung mit Farben
- **Contact Assignment**: Zuweisung zu Tasks mit visueller Darstellung
- **Search & Filter**: Kontakte nach Namen filtern
- **Gruppierung**: Alphabetische Sortierung

### 🔐 Authentifizierung & Sicherheit
- **Email/Password Login**: Sichere Benutzeranmeldung
- **Registrierung**: Vollständiger Registrierungsprozess
- **Guest Access**: Anonymous Login für Demo-Zwecke
- **Session Management**: Automatische Session-Verlängerung
- **Firebase Auth**: Enterprise-grade Sicherheit

### 🎓 Onboarding System
- **Guided Tour**: Schritt-für-Schritt Einführung
- **Interactive Elements**: Highlight wichtiger Funktionen
- **Progress Tracking**: Fortschrittsanzeige
- **Skip Option**: Flexibles Überspringen der Tour

---

## 🛠️ Technologie-Stack

### Frontend
- **Framework**: Angular 19.2.15
- **Language**: TypeScript 5.7.2
- **Styling**: SCSS mit modularem Design
- **Animations**: Angular Animations API
- **Forms**: Reactive Forms mit Validierung

### Backend & Services
- **Authentication**: Firebase Authentication
- **Database**: Firestore (NoSQL)
- **Hosting**: Firebase Hosting
- **Real-time**: Firebase Real-time Database

### Development Tools
- **Build System**: Angular CLI
- **Testing**: Jasmine + Karma
- **Package Manager**: NPM
- **Linting**: ESLint + Prettier

### External Libraries
- **Date Picker**: Flatpickr 4.6.13
- **Drag & Drop**: Custom Implementation
- **Icons**: SVG Icon System
- **Fonts**: Inter Variable Font

---

## 📁 Projektstruktur

```
src/app/
├── 🔐 auth/                          # Authentifizierung
│   ├── auth.component.ts              # Login/Registrierung
│   └── styles/                        # Auth-spezifische Styles
├── 📊 summary/                        # Dashboard
│   ├── summary.component.ts           # Übersichts-Komponente
│   └── services/                      # Summary-Services
├── 📋 board/                          # Kanban Board (Hauptfunktion)
│   ├── board.component.ts             # Haupt-Board-Komponente
│   ├── task-details-overlay/          # Task-Details Modal
│   ├── task-edit-overlay/             # Task-Bearbeitung
│   ├── add-task-overlay/              # Task-Erstellung
│   └── services/                      # Board-Services
│       ├── board-drag-drop.service.ts # Drag & Drop Logic
│       ├── board-form.service.ts      # Formular-Management
│       ├── board-utils.service.ts     # Utility-Funktionen
│       └── mobile-task-move.service.ts # Mobile Touch-Handling
├── ➕ add-task/                       # Task-Erstellung
│   ├── add-task.component.ts          # Standalone Task-Erstellung
│   └── services/                      # Add-Task Services
├── 👥 contacts/                       # Kontakt-Management
│   ├── contacts.component.ts          # Kontakt-Verwaltung
│   └── services/                      # Kontakt-Services
├── 🎓 onboarding-overlay/             # Benutzer-Onboarding
│   └── onboarding-overlay.component.ts
├── 🔧 shared/                         # Geteilte Komponenten
│   ├── services/                      # Core Services
│   │   ├── auth.service.ts            # Authentifizierung
│   │   ├── task.service.ts            # Task-Datenmanagement
│   │   └── onboarding.service.ts      # Onboarding-Logic
│   └── interfaces/                    # TypeScript Interfaces
├── 🎨 assets/                         # Statische Dateien
│   ├── icons/                         # SVG Icons
│   ├── img/                           # Bilder
│   └── fonts/                         # Schriftarten
└── 🌍 environments/                   # Umgebungskonfiguration
    ├── environment.ts                 # Development
    └── environment.prod.ts            # Production
```

---

## ⚙️ Installation & Setup

### Voraussetzungen
- Node.js (>= 18.x)
- NPM (>= 9.x)
- Angular CLI (>= 19.x)
- Firebase Account

### 1. Repository klonen
```bash
git clone https://github.com/YOUR_USERNAME/Join.git
cd Join
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Firebase konfigurieren

#### 3.1 Firebase Projekt erstellen
1. Gehe zur [Firebase Console](https://console.firebase.google.com/)
2. Erstelle ein neues Projekt
3. Aktiviere Authentication (Email/Password + Anonymous)
4. Aktiviere Firestore Database
5. Kopiere die Firebase-Konfiguration

#### 3.2 Environment konfigurieren
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  }
};
```

### 4. Development Server starten

```bash
ng serve
```

Die Anwendung ist unter `http://localhost:4200` verfügbar.

---

## 🔧 Build & Deployment

### Development Build
```bash
ng build
```

### Production Build
```bash
ng build --configuration production
```

### Firebase Deployment
```bash
# Firebase CLI installieren
npm install -g firebase-tools

# Firebase initialisieren
firebase init hosting

# Deployen
firebase deploy
```

### Custom Domain (Subdirectory)
```bash
# Build für Subdirectory
ng build --base-href /join/

# .htaccess für Apache Server konfigurieren
# (bereits vorbereitet in src/.htaccess)
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Mobile Features
- Touch-optimierte Drag & Drop
- Mobile-spezifische Navigation
- Optimierte Formulare
- Angepasste Overlay-Größen

---

## 🔒 Sicherheit & Datenschutz

### Firebase Security Rules
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Datenschutz
- DSGVO-konforme Datenverarbeitung
- Minimale Datensammlung
- Sichere Firebase-Authentifizierung
- Verschlüsselte Datenübertragung (HTTPS)

---

## 🧪 Testing

### Unit Tests
```bash
ng test
```

### E2E Tests
```bash
ng e2e
```

### Test Coverage
```bash
ng test --code-coverage
```

### Manual Testing Checklist
- [ ] Benutzer-Authentifizierung (Email/Password & Guest)
- [ ] Task-Erstellung und -Bearbeitung
- [ ] Drag & Drop Funktionalität (Desktop & Mobile)
- [ ] Kontakt-Management
- [ ] Onboarding-Ablauf
- [ ] Responsive Design
- [ ] Firebase Echtzeit-Updates

---

## 🚀 Performance

### Optimierungen
- **Lazy Loading**: Komponentenbasiertes Lazy Loading
- **OnPush Strategy**: Change Detection Optimierung
- **Tree Shaking**: Unused Code Elimination
- **Bundle Splitting**: Optimierte Chunk-Größen
- **Image Optimization**: WebP-Format für Bilder
- **Service Workers**: Offline-Funktionalität (optional)

### Lighthouse Scores
- **Performance**: 95+
- **Accessibility**: 90+
- **Best Practices**: 95+
- **SEO**: 90+

---

## 🔮 Zukunftige Features

### Geplante Erweiterungen
- **Team Workspaces**: Multi-Team-Support
- **Advanced Notifications**: Email/Push-Benachrichtigungen
- **Time Tracking**: Zeiterfassung für Tasks
- **Reporting**: Erweiterte Analytics und Reports
- **API Integration**: REST API für externe Tools
- **Dark Mode**: Alternative Farbschemas
- **Offline Support**: PWA-Funktionalität

---

## 👥 Entwickler-Team

### Autoren
- **Daniel Grabowski** - Lead Developer
- **Gary Angelone** - Frontend Developer  
- **Joshua Brunke** - Backend Integration
- **Morteza Chinahkash** - UI/UX Design & Implementation

### Version History
- **v1.0.0**: Initial Release mit Core-Funktionalität
- **v1.1.0**: Firebase Integration und Authentifizierung
- **v1.2.0**: Onboarding-System Implementation
- **v1.3.0**: Summary Component Enhancements
- **v1.4.0**: Drag & Drop Optimierung (experimental)

---

## 📞 Support & Wartung

### Bug Reports
Issues können über GitHub Issues gemeldet werden.

### Feature Requests
Neue Features können als GitHub Issues mit dem Label "feature request" eingereicht werden.

### Documentation
Ausführliche Dokumentation verfügbar in:
- `COMPLETE_AUTH_SYSTEM_README.md`
- `COMPREHENSIVE_PROJECT_DOCUMENTATION.md`
- `JSDOC_README.md`

---

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE.md](LICENSE.md) für Details.

---

## 🙏 Danksagungen

- **Angular Team** für das großartige Framework
- **Firebase Team** für die Backend-Services
- **Material Design** für die Designprinzipien
- **Open Source Community** für Tools und Libraries

---

## 📬 Kontakt

Für Fragen oder Anregungen:
- **Website**: [m-chinahkash.de/join](https://m-chinahkash.de/join/)
- **GitHub**: [Join Repository](https://github.com/FrontendWookiee187/Join)

---

<div align="center">

**⭐ Wenn dir dieses Projekt gefällt, gib ihm einen Stern auf GitHub! ⭐**

</div>
