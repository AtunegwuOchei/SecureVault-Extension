import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import SetupModal from "./components/SetupModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    const loadAuth = async () => {
      await checkAuthStatus();
      setIsLoading(false);
    };
    loadAuth();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowSetupModal(true);
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center pulse">
          <span className="material-icons text-white text-sm">lock</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Router />
      {showSetupModal && <SetupModal onClose={() => setShowSetupModal(false)} />}
    </TooltipProvider>
  );
}

export default App;
