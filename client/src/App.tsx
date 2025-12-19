import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/Dashboard";
import ImportPage from "@/pages/Import";
import TrendsPage from "@/pages/Trends";
import SettingsPage from "@/pages/Settings";
// Placeholders for now
const CorrelationsPage = () => <div className="p-10">Coming soon</div>;
const TagsPage = () => <div className="p-10">Coming soon</div>;

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/import" component={ImportPage} />
      <Route path="/trends" component={TrendsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/correlations" component={CorrelationsPage} />
      <Route path="/tags" component={TagsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
