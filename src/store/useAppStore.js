import { create } from 'zustand'

const useAppStore = create((set) => ({
  user: null,
  userDoc: null,
  sidebarOpen: true,
  addTxOpen: false,
  setUser: (user) => set({ user }),
  setUserDoc: (userDoc) => set({ userDoc }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openAddTx: () => set({ addTxOpen: true }),
  closeAddTx: () => set({ addTxOpen: false }),
}))

export default useAppStore
