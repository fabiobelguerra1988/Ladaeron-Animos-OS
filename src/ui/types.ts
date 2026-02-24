export type TabKey = 'dashboard' | 'code' | 'graph' | 'preview';

export type FileEntry = { path: string; kind: 'file' | 'dir' };

export type RunState = 'Idle' | 'Running' | 'Succeeded' | 'Failed' | 'GovernanceRejected';

export type JobAction = {
    name: string;
    kind: 'test' | 'build' | 'lint' | 'preview_start' | 'preview_stop' | 'preview_status' | 'command' | 'journal' | 'memory';
    cmd?: string;
    preview?: { port: number; allow_host?: boolean };
};

export type JobContract = {
    job_id: string;
    workspace: string;
    network: 'off' | 'allow';
    actions: JobAction[];
    container?: { image: string };
};

export interface SwarmAgentState {
    job_id: string;
    status: 'Pending' | 'STARTED' | 'STREAMING' | 'COMPLETED' | 'FAILED';
    log: string[];
}

export interface SwarmEventPayload {
    job_id: string;
    status: 'Pending' | 'STARTED' | 'STREAMING' | 'COMPLETED' | 'FAILED';
    output: string;
}
