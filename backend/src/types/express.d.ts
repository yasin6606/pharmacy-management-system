declare namespace Express {
    export interface Request {
        user: {
            userId: string;
            role: string;
            branchId?: string | null;
            sessionId: string;
        };
    }
}
