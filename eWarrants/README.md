# eWarrants: Frontend Architecture

![eWarrants Banner](https://res.cloudinary.com/djni7gwm4/image/upload/v1756023613/EWarrants_white_jntxui.png)

**Version**: 1.0.1
**Status**: Active Development
**Primary Contact**: [cnitheesh7@gmail.com](mailto:cnitheesh7@gmail.com)
* **Frontend Repository**: `choppanitheesh/eWarrants/tree/main/eWarrants`

---

## 1. Architectural Philosophy & Core Principles

The eWarrants mobile application is engineered with a primary focus on **resilience, reactivity, and maintainability**. Our core architectural philosophy is **offline-first**, ensuring that the user experience is seamless and fully functional, irrespective of network connectivity. This is achieved through a robust local database strategy and a clear separation of concerns throughout the codebase.

### Key Principles:

* **Local-First Data Operations**: All data mutations (Creations, Reads, Updates, Deletes) are executed against a local on-device database first. This guarantees instantaneous UI updates and a consistently fast user experience.
* **Reactive UI Layer**: The UI is designed to be a direct reflection of the local data state. We leverage observable queries that automatically push changes to the UI, eliminating the need for manual state management and ensuring data consistency.
* **Separation of Concerns**: The architecture strictly separates routing, state management, business logic, and UI presentation. This is primarily achieved through a combination of **Expo Router** for navigation and a suite of custom **React Hooks** for encapsulating logic.
* **Centralized API Management**: All communication with the backend is handled through a single, configurable API client, which centralizes logic for authentication and error handling.

---

## 2. Data Flow Architecture

The data flow within the application is unidirectional and reactive, ensuring predictability and ease of debugging. The central pillar of this architecture is the **WatermelonDB** local database, which acts as the single source of truth for the application's UI.

### 2.1. The Data Lifecycle

Here is a step-by-step breakdown of the data flow, from user interaction to data synchronization:

**1. User Interaction & View Layer (`/app` routes):**
* A user interacts with a UI component, for example, pressing the "Add Warranty" button in `home.js`.
* This action triggers an event handler, which in turn calls a function provided by a custom hook (e.g., `handleStartAddFlow` from `useWarrantyForm`).

**2. Logic Encapsulation (Custom Hooks in `/src/hooks`):**
* The triggered function resides within a custom hook, such as `useWarrantyForm.js`. This hook contains all the business logic for the feature, including state management (form inputs, loading states) and side effects (API calls, database operations).
* For data creation, the hook prepares a new warranty record.

**3. Local Database Mutation (WatermelonDB):**
* The hook accesses the WatermelonDB instance, which is made available globally through the `DatabaseProvider` and `useDatabase` context.
* A write operation is performed. For example, `database.collections.get('warranties').create(...)` is called to insert a new record. Crucially, at this stage, the record is marked with `syncStatus: 'created'`. The operation is atomic and immediately persists the data on the device's SQLite database.

**4. Reactive UI Update:**
* The `useWarranties` hook on the home screen has an active subscription to the `warranties` collection using `observeWithColumns`.
* The moment the new record is created in WatermelonDB, the observable query emits the updated list of warranties.
* React detects the state change in the `useWarranties` hook and automatically re-renders the `SectionList` in `home.js` with the new warranty, providing an instantaneous UI update to the user.

**5. Asynchronous Data Synchronization (`/src/sync.js`):**
* Independently of the UI, the `SyncManager` component (found in the root and tab layouts) monitors the application's state and network connectivity.
* When the app comes to the foreground or on initial load with an active internet connection, it triggers the synchronization process defined in `sync.js`.

### 2.2. The Synchronization Algorithm (`sync.js`)

The synchronization process is a two-phase operation designed to be efficient and conflict-free.

#### Phase 1: Push Local Changes

The `pushChangesToServer` function is responsible for sending locally-committed changes to the remote server.

1.  **Query for Unsynced Records**: The function queries the local WatermelonDB for all records where the `sync_status` is not `'synced'`. These are separated into three arrays: `createdToSync`, `updatedToSync`, and `deletedToSync`.
2.  **Process Creations**: It iterates over `createdToSync`, sending a `POST` request to the `/api/warranties` endpoint for each record. Upon a successful response, it receives the `serverId` from the backend. It then performs a local update on the record, setting its `serverId` and changing its `syncStatus` to `'synced'`.
3.  **Process Updates**: It iterates over `updatedToSync`, sending a `PUT` request to `/api/warranties/:id` (using the stored `serverId`). On success, it updates the local `syncStatus` to `'synced'`.
4.  **Process Deletions**: It iterates over `deletedToSync`, sending a `DELETE` request to `/api/warranties/:id`. On success, it **permanently destroys** the record from the local database.

#### Phase 2: Pull Remote Changes

The `pullChangesFromServer` function fetches updates from the server.

1.  **Retrieve Last Sync Timestamp**: The function first reads the `lastPulledAt` timestamp from `AsyncStorage`.
2.  **Delta Sync Request**: It makes a `GET` request to `/api/warranties`, appending the `lastPulledAt` timestamp as a query parameter. The backend uses this to return only records that have been modified since the last sync, minimizing the payload size.
3.  **Reconciliation**: The function iterates through the received server records.
    * For each record, it queries the local database by `serverId` to see if a local version already exists.
    * If a local record exists, it is **updated** with the data from the server.
    * If no local record exists, a **new record is created** in the local database.
    * All records created or updated during this pull phase are marked with `syncStatus: 'synced'`.
4.  **Update Timestamp**: After successfully processing all changes, the current time (`Date.now()`) is saved back to `AsyncStorage` as the new `lastPulledAt` timestamp, ensuring the next sync will only fetch newer changes.

---

## 5. Key Implementation Technologies & Patterns

### 5.1. WatermelonDB (`/src/db`)

We chose **WatermelonDB** as our local database for its high performance and its first-class support for reactive applications.

* **Lazy Loading**: WatermelonDB only loads data from the SQLite database when it is requested, ensuring the app starts quickly and remains responsive even with a large dataset.
* **Observables**: The ability to `observe` changes to queries is fundamental to our reactive UI. This pattern, seen in `useWarranties.js`, simplifies state management by making the database the single source of truth that drives UI updates.

### 5.2. Custom Hooks (`/src/hooks`)

Custom hooks are the primary pattern for code reuse and logic encapsulation.

* **`useWarranties.js`**: This hook contains a complex algorithm for processing the raw warranty data from the database. It applies sequential filtering (based on search query), status filtering (active/expired), and then sorts the results based on user preferences. Finally, it groups the data by category if the user has enabled this option. This entire pipeline is re-evaluated efficiently whenever the raw data or any of the preference states change.
* **`useWarrantyForm.js`**: This hook demonstrates the management of complex, asynchronous user flows. It handles permissions for `ImagePicker`, makes an API call to the backend for receipt processing, and manages multiple loading states (`isProcessing`, `isUploading`), providing a clean interface to the `AddWarrantySheet` component.

### 5.3. Theming and UI (`/src/theme`)

The application is fully themeable, supporting light, dark, and system-default modes.

* **`ThemeProvider`**: This context provider, defined in `ThemeProvider.js`, determines the active theme (light or dark) based on user preference and the system's color scheme. It then provides the corresponding color palette to all child components.
* **`useTheme` Hook**: Components access the current theme's colors and name via this simple hook, allowing them to adapt their styles dynamically.
* **Component Styles**: A centralized `getComponentStyles` function in `componentStyles.js` generates a stylesheet for common components (like inputs and buttons) based on the active theme's colors. This ensures UI consistency and reduces style duplication.

This robust and thoughtfully designed architecture ensures that the eWarrants mobile application is not only feature-rich but also scalable, maintainable, and provides a superior, resilient user experience.
