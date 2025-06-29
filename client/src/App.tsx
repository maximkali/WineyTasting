import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TestInputs from "@/pages/test-inputs";
import Setup from "@/pages/setup";
import Organize from "@/pages/organize";
import Lobby from "@/pages/lobby";
import Round from "@/pages/round";
import Reveal from "@/pages/reveal";
import Gambit from "@/pages/gambit";
import Final from "@/pages/final";
import Join from "@/pages/join";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TestInputs} />
      <Route path="/home" component={Home} />
      <Route path="/setup/:gameId" component={Setup} />
      <Route path="/organize/:gameId" component={Organize} />
      <Route path="/lobby/:gameId" component={Lobby} />
      <Route path="/round/:gameId/:roundIndex" component={Round} />
      <Route path="/reveal/:gameId/:roundIndex" component={Reveal} />
      <Route path="/gambit/:gameId" component={Gambit} />
      <Route path="/final/:gameId" component={Final} />
      <Route path="/join/:gameId" component={Join} />
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
