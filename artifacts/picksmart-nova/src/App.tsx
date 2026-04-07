import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import ModulesPage from "@/pages/modules";
import LessonSessionPage from "@/pages/lesson-session";
import ModuleDetailPage from "@/pages/module-detail";
import CommonMistakesPage from "@/pages/mistakes";
import ProgressPage from "@/pages/progress";
import LeaderboardPage from "@/pages/leaderboard";
import PricingPage from "@/pages/pricing";
import SelectorNationPage from "@/pages/selector-nation";

import MyAssignmentsPage from "@/pages/nova/my-assignments";
import AssignmentDetailPage from "@/pages/nova/assignment-detail";
import VoiceSessionPage from "@/pages/nova/voice-session";
import AssignmentControlPage from "@/pages/nova/assignment-control";
import WarehouseReferencePage from "@/pages/nova/warehouse";
import SlotMasterPage from "@/pages/nova/slot-master";
import VoiceCommandsPage from "@/pages/nova/voice-commands";
import LiveTrackingPage from "@/pages/nova/tracking";

import NovaTrainerPage from "@/pages/nova-trainer";
import NovaHelpPage from "@/pages/nova-help";
import TrainerPortalPage from "@/pages/trainer-portal";
import SupervisorPage from "@/pages/supervisor";
import UsersAccessPage from "@/pages/users-access";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/">
        <Layout><HomePage /></Layout>
      </Route>
      <Route path="/training">
        <Layout><ModulesPage /></Layout>
      </Route>
      {/* Lesson session is full-screen — no layout wrapper */}
      <Route path="/training/lesson/:id">
        <LessonSessionPage />
      </Route>
      <Route path="/training/:id">
        <Layout><ModuleDetailPage /></Layout>
      </Route>
      <Route path="/mistakes">
        <Layout><CommonMistakesPage /></Layout>
      </Route>
      <Route path="/progress">
        <Layout><ProgressPage /></Layout>
      </Route>
      <Route path="/leaderboard">
        <Layout><LeaderboardPage /></Layout>
      </Route>
      <Route path="/pricing">
        <Layout><PricingPage /></Layout>
      </Route>
      <Route path="/selector-nation">
        <Layout><SelectorNationPage /></Layout>
      </Route>

      {/* NOVA — selector+ */}
      <Route path="/nova">
        <Layout><MyAssignmentsPage /></Layout>
      </Route>
      <Route path="/nova/assignments/:id">
        <Layout><AssignmentDetailPage /></Layout>
      </Route>
      {/* Voice session is full-screen — no layout wrapper */}
      <Route path="/nova/voice/:id">
        <VoiceSessionPage />
      </Route>
      <Route path="/nova-trainer">
        <Layout><NovaTrainerPage /></Layout>
      </Route>
      <Route path="/nova-help">
        <Layout><NovaHelpPage /></Layout>
      </Route>

      {/* Trainer+ */}
      <Route path="/nova/control">
        <Layout><AssignmentControlPage /></Layout>
      </Route>
      <Route path="/nova/warehouse">
        <Layout><WarehouseReferencePage /></Layout>
      </Route>
      <Route path="/nova/slots">
        <Layout><SlotMasterPage /></Layout>
      </Route>
      <Route path="/nova/voice-commands">
        <Layout><VoiceCommandsPage /></Layout>
      </Route>
      <Route path="/trainer-portal">
        <Layout><TrainerPortalPage /></Layout>
      </Route>

      {/* Supervisor+ */}
      <Route path="/nova/tracking">
        <Layout><LiveTrackingPage /></Layout>
      </Route>
      <Route path="/supervisor">
        <Layout><SupervisorPage /></Layout>
      </Route>

      {/* Owner */}
      <Route path="/users-access">
        <Layout><UsersAccessPage /></Layout>
      </Route>

      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
