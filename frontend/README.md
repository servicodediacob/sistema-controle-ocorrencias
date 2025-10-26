# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Offline Functionality

The application has been optimized to work offline. The following features have been implemented:

- **Offline Data Storage:** Pending "lançamentos" are stored in IndexedDB using `localforage`.
- **Synchronization with the Server:** A `syncPendingLancamentos` function in the `offlineSyncService` synchronizes the pending data with the server when the application is online.
- **User Interface Feedback:** An `OfflineIndicator` component shows the online/offline status, the number of pending items, and the status of the last synchronization.
- **Association with User:** Pending items are associated with the active user by storing the `userId`. The synchronization process only syncs the data for the current user, and the pending items are cleared on logout.
  - **Centralized Synchronization:** The online event handling is centralized in the `App.tsx` component to avoid duplicated synchronization calls.

**Validation:** The offline functionality has been successfully implemented and validated through manual testing in online/offline scenarios, including user switching and reconnection.
