
/** 
 * Signal in the Dark:
 * Route shell keeps Landing, Public, and Authenticated
 * backgrounds isolated.
 */

import { Route, Switch, Redirect } from 'wouter';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

import {
    AuthenticatedLayout,
    Customers,
    Dashboard,
    Landing,
    Login,
    NotFound,
    Predict,
    PublicLayout,
    Settings,
    SignUp,
} from '@/pages/Pages';


function Protected({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();

    return isAuthenticated ? (
        <AuthenticatedLayout>
            {children}
        </AuthenticatedLayout>
    ) : (
        <Redirect to="/login" />
    );
}


function Router() {
    return (
        <Switch>
            <Route path="/">
                <Landing />
            </Route>

            <Route path="/signup">
                <PublicLayout>
                    <SignUp />
                </PublicLayout>
            </Route>

            <Route path="/login">
                <PublicLayout dimmed>
                    <Login />
                </PublicLayout>
            </Route>

            <Route path="/dashboard">
                <Protected>
                    <Dashboard />
                </Protected>
            </Route>

            <Route path="/predict">
                <Protected>
                    <Predict />
                </Protected>
            </Route>

            <Route path="/customers">
                <Protected>
                    <Customers />
                </Protected>
            </Route>

            <Route path="/settings">
                <Protected>
                    <Settings />
                </Protected>
            </Route>

            <Route>
                <NotFound />
            </Route>
        </Switch>
    );
}


export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router />
            </AuthProvider>
        </ThemeProvider>
    );
}

