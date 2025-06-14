import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm"; // Existing sign-in form
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import React, { useState } from "react";

// Placeholder Pages
const HomePage = React.lazy(() => import("./pages/HomePage"));
const RegisterVoterProfilePage = React.lazy(() => import("./pages/RegisterVoterProfilePage"));
const VotingPage = React.lazy(() => import("./pages/VotingPage"));
const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const NotFoundPage = () => <div className="text-center p-8"><h1 className="text-2xl font-bold">404 - Page Not Found</h1></div>;


export type Page = "home" | "registerProfile" | "vote" | "admin";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const voterProfile = useQuery(api.users.getCurrentVoterProfile);
  const isUserAdmin = useQuery(api.users.isAdmin) ?? false;

  const navigate = (page: Page) => setCurrentPage(page);

  let content;

  if (loggedInUser === undefined || voterProfile === undefined) {
    content = (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  } else {
    switch (currentPage) {
      case "home":
        content = <HomePage navigate={navigate} />;
        break;
      case "registerProfile":
        content = <RegisterVoterProfilePage navigate={navigate} />;
        break;
      case "vote":
        content = <VotingPage navigate={navigate} />;
        break;
      case "admin":
        content = isUserAdmin ? <AdminPage navigate={navigate} /> : <div className="text-center p-4 text-red-500">Access Denied. Admins only.</div>;
        break;
      default:
        content = <NotFoundPage />;
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-md">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <h2 
            className="text-2xl font-bold text-primary cursor-pointer"
            onClick={() => navigate("home")}
          >
            Online Voting
          </h2>
          <nav className="flex items-center gap-4">
            <Authenticated>
              <button onClick={() => navigate("home")} className="text-gray-700 hover:text-primary transition-colors">Home</button>
              {voterProfile && (
                <>
                  <button onClick={() => navigate("vote")} className="text-gray-700 hover:text-primary transition-colors">Vote</button>
                  {isUserAdmin && (
                    <button onClick={() => navigate("admin")} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium">Admin Panel</button>
                  )}
                </>
              )}
              {!voterProfile && loggedInUser && (
                 <button onClick={() => navigate("registerProfile")} className="px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium">Complete Profile</button>
              )}
              <SignOutButton />
            </Authenticated>
            <Unauthenticated>
              {/* Content for unauthenticated users, like a prompt to sign in, can go here if needed outside of HomePage */}
              {/* For now, SignInForm is primarily on HomePage */}
              <></> 
            </Unauthenticated>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        <React.Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700"></div></div>}>
          {content}
        </React.Suspense>
      </main>
      <Toaster richColors />
      <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} Online Voting Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

// The original Content component from the template is no longer directly used here,
// as App.tsx now handles routing and main content display.
// We'll build specific page components.
