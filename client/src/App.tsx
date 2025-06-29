import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Setup from "@/pages/setup";
import Organize from "@/pages/organize";
import Join from "@/pages/join";
import Lobby from "@/pages/lobby";
import Gambit from "@/pages/gambit";
import Final from "@/pages/final";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/setup" component={Setup} />
      <Route path="/setup/:gameId" component={Setup} />
      <Route path="/organize/:gameId" component={Organize} />
      <Route path="/join/:gameCode" component={Join} />
      <Route path="/lobby/:gameId" component={Lobby} />
      <Route path="/gambit/:gameId" component={Gambit} />
      <Route path="/final/:gameId" component={Final} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
