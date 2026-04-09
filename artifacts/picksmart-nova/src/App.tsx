import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { SubscriptionRoute } from "@/components/SubscriptionRoute";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import ModulesPage from "@/pages/modules";
import LessonSessionPage from "@/pages/lesson-session";
import ModuleDetailPage from "@/pages/module-detail";
import CommonMistakesPage from "@/pages/mistakes";
import MistakeCoachingPage from "@/pages/mistake-coaching";
import ProgressPage from "@/pages/progress";
import LeaderboardPage from "@/pages/leaderboard";
import PricingPage from "@/pages/pricing";
import SelectorNationPage from "@/pages/selector-nation";
import SelectorBreakingNewsPage from "@/pages/app/SelectorBreakingNewsPage";

import MyAssignmentsPage from "@/pages/nova/my-assignments";
import AssignmentDetailPage from "@/pages/nova/assignment-detail";
import VoiceSessionPage from "@/pages/nova/voice-session";
import AssignmentControlPage from "@/pages/nova/assignment-control";
import WarehouseReferencePage from "@/pages/nova/warehouse";
import SlotMasterPage from "@/pages/nova/slot-master";
import VoiceCommandsPage from "@/pages/nova/voice-commands";
import LiveTrackingPage from "@/pages/nova/tracking";

import NovaTrainerPage from "@/pages/nova/NovaTrainerPage";
import NovaHelpPage from "@/pages/nova-help";
import TrainerPortalPage from "@/pages/trainer-portal";
import SupervisorPage from "@/pages/supervisor";
import ChoosePlanPage from "@/pages/choose-plan";
import PersonalCheckoutPage from "@/pages/checkout-personal";
import CompanyCheckoutPage from "@/pages/checkout-company";
import OwnerPage from "@/pages/owner";
import OwnerAccessPage from "@/pages/owner-access";

import SelectorPortalPage from "@/pages/selector-portal";
import LoginPage from "@/pages/login";
import InvitePage from "@/pages/invite";
import LockScreen from "@/components/LockScreen";
import { useAuthStore } from "@/lib/authStore";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import WarehouseEntryPage from "@/pages/warehouse-entry";

function RedirectToOwner() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/owner", { replace: true }); }, [navigate]);
  return null;
}

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* ── Fully public — no login or subscription needed ── */}
      <Route path="/owner-access">
        <OwnerAccessPage />
      </Route>
      <Route path="/login">
        <LoginPage />
      </Route>
      <Route path="/invite/:token">
        <InvitePage />
      </Route>
      <Route path="/">
        <Layout><HomePage /></Layout>
      </Route>
      <Route path="/pricing">
        <Layout><PricingPage /></Layout>
      </Route>
      <Route path="/choose-plan">
        <Layout><ChoosePlanPage /></Layout>
      </Route>
      <Route path="/checkout/personal">
        <Layout><PersonalCheckoutPage /></Layout>
      </Route>
      <Route path="/checkout/company">
        <Layout><CompanyCheckoutPage /></Layout>
      </Route>

      {/* ── Publicly viewable — premium actions gated inside each page ── */}
      <Route path="/training">
        <Layout><ModulesPage /></Layout>
      </Route>
      <Route path="/training/lesson/:id">
        <LessonSessionPage />
      </Route>
      <Route path="/training/:id">
        <Layout><ModuleDetailPage /></Layout>
      </Route>
      <Route path="/mistakes">
        <Layout><CommonMistakesPage /></Layout>
      </Route>
      <Route path="/mistakes/coaching/:id">
        <MistakeCoachingPage />
      </Route>
      <Route path="/progress">
        <Layout><ProgressPage /></Layout>
      </Route>
      <Route path="/leaderboard">
        <Layout><LeaderboardPage /></Layout>
      </Route>
      <Route path="/selector-nation">
        <Layout><SelectorNationPage /></Layout>
      </Route>
      <Route path="/selector-breaking-news">
        <Layout><SelectorBreakingNewsPage /></Layout>
      </Route>
      <Route path="/nova-help">
        <Layout><NovaHelpPage /></Layout>
      </Route>
      <Route path="/nova-trainer">
        <NovaTrainerPage />
      </Route>
      <Route path="/selector">
        <Layout><SelectorPortalPage /></Layout>
      </Route>

      {/* NOVA assignment pages */}
      <Route path="/nova">
        <Layout><MyAssignmentsPage /></Layout>
      </Route>
      <Route path="/nova/assignments/:id">
        <Layout><AssignmentDetailPage /></Layout>
      </Route>
      <Route path="/nova/voice/:id">
        <VoiceSessionPage />
      </Route>

      {/* Trainer tools */}
      <Route path="/nova/control">
        <Layout>
          <SubscriptionRoute path="/nova/control" requiredRole="trainer">
            <AssignmentControlPage />
          </SubscriptionRoute>
        </Layout>
      </Route>
      <Route path="/nova/warehouse">
        <Layout>
          <SubscriptionRoute path="/nova/warehouse" requiredRole="trainer">
            <WarehouseReferencePage />
          </SubscriptionRoute>
        </Layout>
      </Route>
      <Route path="/nova/slots">
        <Layout>
          <SubscriptionRoute path="/nova/slots" requiredRole="trainer">
            <SlotMasterPage />
          </SubscriptionRoute>
        </Layout>
      </Route>
      <Route path="/nova/voice-commands">
        <Layout>
          <SubscriptionRoute path="/nova/voice-commands" requiredRole="trainer">
            <VoiceCommandsPage />
          </SubscriptionRoute>
        </Layout>
      </Route>
      <Route path="/trainer-portal">
        <Layout>
          <SubscriptionRoute path="/trainer-portal" requiredRole="trainer">
            <TrainerPortalPage />
          </SubscriptionRoute>
        </Layout>
      </Route>

      {/* Supervisor tools */}
      <Route path="/nova/tracking">
        <Layout>
          <SubscriptionRoute path="/nova/tracking" requiredRole="supervisor">
            <LiveTrackingPage />
          </SubscriptionRoute>
        </Layout>
      </Route>
      <Route path="/supervisor">
        <Layout>
          <SubscriptionRoute path="/supervisor" requiredRole="supervisor">
            <SupervisorPage />
          </SubscriptionRoute>
        </Layout>
      </Route>

      {/* /users-access redirects to Control Center (Users & Access is now a tab there) */}
      <Route path="/users-access">
        <RedirectToOwner />
      </Route>
      <Route path="/owner">
        <Layout>
          <SubscriptionRoute path="/owner" requiredRole="owner">
            <OwnerPage />
          </SubscriptionRoute>
        </Layout>
      </Route>

      {/* ── Public legal / policy pages ── */}
      <Route path="/privacy">
        <PrivacyPage />
      </Route>
      <Route path="/terms">
        <TermsPage />
      </Route>

      {/* ── Warehouse deep-link entry ── */}
      <Route path="/w/:slug">
        <WarehouseEntryPage />
      </Route>

      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function AppInner() {
  const { locked, currentUser } = useAuthStore();
  return (
    <>
      <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
        <Router />
      </WouterRouter>
      <Toaster />
      {locked && currentUser && <LockScreen />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppInner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
