import { create } from 'zustand';
import { RunState, FileEntry, JobContract, SwarmAgentState, SwarmEventPayload } from '../types';

interface AppState {
    // Global Project State
    rootDir: string;
    activeFile: string | null;
    files: FileEntry[];

    // Execution State
    runState: RunState;
    log: string[];
    currentJob: JobContract | null;
    lastResult: any | null;

    // Graph Overlays & Toggles
    showTrafficPreview: boolean;
    layers: { code: boolean, symbols: boolean, runs: boolean, timeLens: boolean, heatLens: boolean };
    edgeFilter: { connections: boolean, calls: boolean };

    // AI Context
    aiContextLoading: boolean;
    aiContextText: string | null;

    // Swarm Context
    swarmAgents: Record<string, SwarmAgentState>;

    // Actions
    setRootDir: (dir: string) => void;
    setActiveFile: (file: string | null) => void;
    setFiles: (files: FileEntry[]) => void;
    setRunState: (state: RunState) => void;
    pushLog: (logLine: string) => void;
    clearLog: () => void;
    setCurrentJob: (job: JobContract | null) => void;
    setLastResult: (result: any | null) => void;
    setShowTrafficPreview: (show: boolean) => void;
    setLayers: (layers: { code: boolean, symbols: boolean, runs: boolean, timeLens: boolean, heatLens: boolean }) => void;
    setEdgeFilter: (filters: { connections: boolean, calls: boolean }) => void;
    setAiContextLoading: (l: boolean) => void;
    setAiContextText: (t: string | null) => void;
    upsertSwarmEvent: (event: SwarmEventPayload) => void;
}

export const useAppStore = create<AppState>((set) => ({
    rootDir: '',
    activeFile: null,
    files: [],
    runState: 'Idle',
    log: [],
    currentJob: null,
    lastResult: null,
    showTrafficPreview: false,
    layers: { code: true, symbols: true, runs: true, timeLens: false, heatLens: false },
    edgeFilter: { connections: true, calls: true },
    aiContextLoading: false,
    aiContextText: null,
    swarmAgents: {},

    setRootDir: (dir) => set({ rootDir: dir }),
    setActiveFile: (file) => set({ activeFile: file }),
    setFiles: (files) => set({ files }),
    setRunState: (state) => set({ runState: state }),
    pushLog: (logLine) => set((state) => ({ log: [...state.log, logLine] })),
    clearLog: () => set({ log: [] }),
    setCurrentJob: (job) => set({ currentJob: job }),
    setLastResult: (result) => set({ lastResult: result }),
    setShowTrafficPreview: (show) => set({ showTrafficPreview: show }),
    setLayers: (layers) => set({ layers }),
    setEdgeFilter: (filters) => set({ edgeFilter: filters }),
    setAiContextLoading: (l) => set({ aiContextLoading: l }),
    setAiContextText: (t) => set({ aiContextText: t }),
    upsertSwarmEvent: (event) => set((state) => {
        const ag = state.swarmAgents[event.job_id] || { job_id: event.job_id, status: 'Pending', log: [] };
        return {
            swarmAgents: {
                ...state.swarmAgents,
                [event.job_id]: {
                    ...ag,
                    status: event.status,
                    log: [...ag.log, event.output]
                }
            }
        };
    }),
}));
