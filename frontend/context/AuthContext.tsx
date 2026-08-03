'use client';
import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {LoginResponse, User} from '@/types';
import {useRouter} from '@/navigation';
import {usePathname} from 'next/navigation';
import {apiGet, apiPost} from '@/lib/api';   // ← direct imports, no useApi

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Get current user on mount
    useEffect(() => {
        const fetchUser = async () => {
            const token = sessionStorage.getItem('token');
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }
            try {
                const userData = await apiGet<User>('/auth/me');   // direct API call
                if (userData && userData.id) {
                    setUser(userData);
                } else {
                    setUser(null);
                    sessionStorage.removeItem('token');
                }
            } catch {
                setUser(null);
                sessionStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    // Redirect logic (unchanged)
    useEffect(() => {
        if (loading) return;
        const publicRoutes = ['/login', '/setup'];
        const isPublic = publicRoutes.some(
            (route) => pathname.endsWith(route) || pathname.includes(`/${route}`)
        );
        if (!user && !isPublic) {
            router.replace('/login');
        } else if (user && isPublic) {
            router.replace('/dashboard');
        }
    }, [user, loading, pathname, router]);

    const login = async (email: string, password: string) => {
        const res = await apiPost<LoginResponse>('/auth/login', {email, password});

        if (res) {
            sessionStorage.setItem('token', res.token);
            setUser(res.employee);
            router.push('/dashboard');
        }
    };

    const logout = async () => {
        try {
            await apiPost('/auth/logout');
        } catch {
            // silent
        }
        sessionStorage.removeItem('token');
        setUser(null);
        // Hard reload to avoid hook mismatch
        window.location.replace('/login');
    };

    return (
        <AuthContext.Provider value={{user, loading, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
