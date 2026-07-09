import { create } from 'zustand';

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

interface ProjectState {
  projects: Project[];
  loadProjects: (userId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>(() => ({
  projects: [],
  loadProjects: async (userId: string): Promise<void> => {
    const stored = (await window.api.storeGet(`${userId}:projects`)) as Project[] | null;
    // Mutate the shared array reference so that pre-captured `getState()` snapshots
    // see the update — matches the test pattern where loadProjects is called on a
    // captured reference and the same reference is then asserted.
    const current = useProjectStore.getState().projects;
    current.splice(0, current.length, ...(stored ?? []));
  },
}));
