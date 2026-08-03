declare namespace Express {
    export interface Request {
        user: {
            userId: string;
            role: string;
            branchId: string;
            sessionId: string;
        };
    }
}
