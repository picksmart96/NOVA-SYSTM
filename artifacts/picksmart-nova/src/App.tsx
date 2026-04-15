import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { SubscriptionRoute } from "@/components/SubscriptionRoute";
import SubscribePromptModal from "@/components/paywall/SubscribePromptModal";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import ModulesPage from "@/pages/modules";
import LessonSessionPage from "@/pages/lesson-session";
import ModuleDetailPage from "@/pages/module-detail";
import BeginnerBasicsLessonPage from "@/pages/BeginnerBasicsLessonPage";
import WarehouseSafetyLessonPage from "@/pages/WarehouseSafetyLessonPage";
import PalletBuildingLessonPage from "@/pages/PalletBuildingLessonPage";
import PickPathOptimizationLessonPage from "@/pages/PickPathOptimizationLessonPage";
import PerformancePaceLessonPage from "@/pages/PerformancePaceLessonPage";
import RealShiftSimulationLessonPage from "@/pages/RealShiftSimulationLessonPage";
import CommonMistakesPage from "@/pages/mistakes";
import MistakeCoachingPage from "@/pages/mistake-coaching";
import ProgressPage from "@/pages/progress";
import LeaderboardPage from "@/pages/leaderboard";
import PricingPage from "@/pages/pricing";
import CompanyRequestPage from "@/pages/company-request";
import SelectorNationPage from "@/pages/selector-nation";
import ReferPage from "@/pages/refer";
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

import ControlPanelPage from "@/pages/control-panel";
import ManagerPage from "@/pages/manager";
import SelectorPortalPage from "@/pages/selector-portal";
import LoginPage from "@/pages/login";
import InvitePage from "@/pages/invite";
import DownloadPage from "@/pages/download";
import CommandPage from "@/pages/command";
import ForgotPage from "@/pages/forgot";
import LockScreen from "@/components/LockScreen";
import OwnerGate from "@/components/OwnerGate";
import { useAuthStore } from "@/lib/authStore";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import WarehouseEntryPage from "@/pages/warehouse-entry";

import CompanyOnboardPage from "@/pages/company-onboard";
import NovaDemoAgentPage from "@/pages/demo/NovaDemoAgentPage";
import DemoLandingPage from "@/pages/demo/DemoLandingPage";
import DemoTrainingPage from "@/pages/demo/DemoTrainingPage";
import DemoLeaderboardPage from "@/pages/demo/DemoLeaderboardPage";
import DemoTrainerDashboard from "@/pages/demo/DemoTrainerDashboard";
import DemoSupervisorDashboard from "@/pages/demo/DemoSupervisorDashboard";
import DemoNovaTrainerPage from "@/pages/demo/DemoNovaTrainerPage";
import DemoNovaGatePage from "@/pages/demo/DemoNovaGatePage";
import DemoNovaHelpPage from "@/pages/demo/DemoNovaHelpPage";
import RequestAccessPage from "@/pages/RequestAccessPage";
import DealDetailPage from "@/pages/deal-detail";
import DealSignPage from "@/pages/deal-sign";
import DealSignDirectPage from "@/pages/deal-sign-direct";
import NovaSalesVoiceAgent from "@/pages/NovaSalesVoiceAgent";
import PaymentSuccessPage from "@/pages/payment-success";
import PaymentCancelPage from "@/pages/payment-cancel";
import RegisterPage from "@/pages/register";

function RedirectToOwner() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/owner", { replace: true }); }, [navigate]);
  return null;
}

// Map real page paths to NOVA Gate page names for demo users
const DEMO_GATE_NAMES: Record<string, string> = {
  "/training":              "Training",
  "/nova-help":             "NOVA Help",
  "/mistakes":              "Common Mistakes",
  "/progress":              "My Progress",
  "/leaderboard":           "Leaderboard",
  "/selector-breaking-news":"Selector Breaking News",
  "/selector-nation":       "Selector Breaking News",
  "/owner":                 "Users & Access",
  "/nova":                  "NOVA Help",
  "/trainer-portal":        "Training",
  "/supervisor":            "Training",
};

function demoGateName(path: string) {
  for (const [prefix, name] of Object.entries(DEMO_GATE_NAMES)) {
    if (path === prefix || path.startsWith(prefix + "/")) return name;
  }
  return null;
}

/**
 * GatedRoute — blocks unsubscribed / not-logged-in visitors from viewing any
 * content page. Demo users are redirected to the NOVA Gate page instead of
 * seeing the real content. Closing the modal sends the visitor back to home.
 */
function GatedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(true);

  const isOwner = currentUser?.role === "owner";
  const isSubscribed = isOwner || !!currentUser?.isSubscribed;
  const isDemoUser = !!currentUser?.isDemoUser;

  // Demo users get redirected to NOVA Gate for all locked pages
  useEffect(() => {
    if (isDemoUser) {
      const name = demoGateName(location);
      navigate(`/demo/nova-gate?page=${encodeURIComponent(name ?? "This Page")}`, { replace: true });
    }
  }, [isDemoUser, location]);

  if (isDemoUser) return null;
  if (isSubscribed) return <>{children}</>;

  return (
    <SubscribePromptModal
      open={open}
      onClose={() => { setOpen(false); navigate("/"); }}
    />
  );
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
      <Route path="/forgot">
        <ForgotPage />
      </Route>
      <Route path="/download">
        <DownloadPage />
      </Route>
      <Route path="/command">
        <SubscriptionRoute path="/command" requiredRole="owner">
          <CommandPage />
        </SubscriptionRoute>
      </Route>
      <Route path="/">
        <Layout><HomePage /></Layout>
      </Route>
      <Route path="/pricing">
        <Layout><PricingPage /></Layout>
      </Route>
      <Route path="/company-request">
        <CompanyRequestPage />
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
      <Route path="/checkout/company/onboard">
        <CompanyOnboardPage />
      </Route>
      <Route path="/deal/:id">
        <DealDetailPage />
      </Route>
      <Route path="/deal-sign/:id">
        <DealSignPage />
      </Route>
      <Route path="/deal-sign">
        <DealSignDirectPage />
      </Route>
      <Route path="/meet-nova">
        <NovaSalesVoiceAgent />
      </Route>
      <Route path="/payment-success">
        <PaymentSuccessPage />
      </Route>
      <Route path="/payment-cancel">
        <PaymentCancelPage />
      </Route>
      <Route path="/register">
        <RegisterPage />
      </Route>

      {/* ── Gated — requires active subscription to view any content ── */}
      <Route path="/training">
        <Layout><GatedRoute><ModulesPage /></GatedRoute></Layout>
      </Route>
      <Route path="/training/module-1">
        <GatedRoute><BeginnerBasicsLessonPage /></GatedRoute>
      </Route>
      <Route path="/training/module-2">
        <GatedRoute><WarehouseSafetyLessonPage /></GatedRoute>
      </Route>
      <Route path="/training/module-3">
        <GatedRoute><PalletBuildingLessonPage /></GatedRoute>
      </Route>
      <Route path="/training/module-4">
        <GatedRoute><PickPathOptimizationLessonPage /></GatedRoute>
      </Route>
      <Route path="/training/module-5">
        <GatedRoute><PerformancePaceLessonPage /></GatedRoute>
      </Route>
      <Route path="/training/module-6">
        <GatedRoute><RealShiftSimulationLessonPage /></GatedRoute>
      </Route>
      <Route path="/training/lesson/:id">
        <GatedRoute><LessonSessionPage /></GatedRoute>
      </Route>
      <Route path="/training/:id">
        <Layout><GatedRoute><ModuleDetailPage /></GatedRoute></Layout>
      </Route>
      <Route path="/mistakes">
        <Layout><GatedRoute><CommonMistakesPage /></GatedRoute></Layout>
      </Route>
      <Route path="/mistakes/coaching/:id">
        <GatedRoute><MistakeCoachingPage /></GatedRoute>
      </Route>
      <Route path="/progress">
        <Layout><GatedRoute><ProgressPage /></GatedRoute></Layout>
      </Route>
      <Route path="/leaderboard">
        <Layout><GatedRoute><LeaderboardPage /></GatedRoute></Layout>
      </Route>
      <Route path="/selector-nation">
        <Layout><SelectorNationPage /></Layout>
      </Route>
      <Route path="/refer">
        <Layout><GatedRoute><ReferPage /></GatedRoute></Layout>
      </Route>
      <Route path="/selector-breaking-news">
        <Layout><GatedRoute><SelectorBreakingNewsPage /></GatedRoute></Layout>
      </Route>
      <Route path="/nova-help">
        <Layout><GatedRoute><NovaHelpPage /></GatedRoute></Layout>
      </Route>
      <Route path="/nova-trainer">
        <GatedRoute><NovaTrainerPage /></GatedRoute>
      </Route>
      <Route path="/selector">
        <Layout><GatedRoute><SelectorPortalPage /></GatedRoute></Layout>
      </Route>

      {/* NOVA assignment pages */}
      <Route path="/nova">
        <Layout><GatedRoute><MyAssignmentsPage /></GatedRoute></Layout>
      </Route>
      <Route path="/nova/assignments/:id">
        <Layout><GatedRoute><AssignmentDetailPage /></GatedRoute></Layout>
      </Route>
      <Route path="/nova/voice/:id">
        <GatedRoute><VoiceSessionPage /></GatedRoute>
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

      {/* Manager tools */}
      <Route path="/manager">
        <Layout>
          <SubscriptionRoute path="/manager" requiredRole="manager">
            <ManagerPage />
          </SubscriptionRoute>
        </Layout>
      </Route>

      {/* Director Control Panel */}
      <Route path="/control-panel">
        <Layout>
          <SubscriptionRoute path="/control-panel" requiredRole="director">
            <ControlPanelPage />
          </SubscriptionRoute>
        </Layout>
      </Route>

      {/* /users-access goes to the same Owner Control Center gate */}
      <Route path="/users-access">
        <Layout>
          <OwnerGate>
            <OwnerPage />
          </OwnerGate>
        </Layout>
      </Route>
      <Route path="/owner">
        <Layout>
          <OwnerGate>
            <OwnerPage />
          </OwnerGate>
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

      {/* ── Public pages — no login required ── */}
      <Route path="/request-access">
        <Layout><RequestAccessPage /></Layout>
      </Route>

      {/* ── Public demo — no login or subscription required ── */}
      <Route path="/demo">
        <Layout><DemoLandingPage /></Layout>
      </Route>
      <Route path="/demo/training">
        <Layout><DemoTrainingPage /></Layout>
      </Route>
      <Route path="/demo/leaderboard">
        <Layout><DemoLeaderboardPage /></Layout>
      </Route>
      <Route path="/demo/nova-trainer">
        <DemoNovaTrainerPage />
      </Route>
      <Route path="/demo/nova-agent">
        <NovaDemoAgentPage />
      </Route>
      <Route path="/demo/nova-help">
        <DemoNovaHelpPage />
      </Route>
      <Route path="/demo/trainer-dashboard">
        <Layout><DemoTrainerDashboard /></Layout>
      </Route>
      <Route path="/demo/supervisor-dashboard">
        <Layout><DemoSupervisorDashboard /></Layout>
      </Route>
      <Route path="/demo/nova-gate">
        <DemoNovaGatePage />
      </Route>

      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function AppInner() {
  const { locked, currentUser, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

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
