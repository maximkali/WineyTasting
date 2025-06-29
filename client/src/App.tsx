import { Switch, Route } from "wouter";
import { queryClient } from "./common/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/common/not-found";
import Home from "@/home/home";
import Join from "@/home/join";
import Setup from "@/setup/setup";
import Lobby from "@/setup/lobby";
import WineList from "@/wine-rounds/wine-list";
import Rounds from "@/wine-rounds/rounds";
import Gambit from "@/gameplay/gambit";
import Final from "@/gameplay/final";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/setup/:gameId" component={Setup} />
      <Route path="/setup" component={Setup} />
      <Route path="/wine-list/:gameId" component={WineList} />
      <Route path="/rounds/:gameId" component={Rounds} />
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
