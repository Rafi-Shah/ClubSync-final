import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import MemberLayout from './components/member/MemberLayout';
import AdminLayout from './components/admin/AdminLayout';
import RequirePermission from './components/admin/RequirePermission';
import { LoadingState } from './components/States';

// Public Website
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Committee = lazy(() => import('./pages/Committee'));
const Departments = lazy(() => import('./pages/Departments'));
const Events = lazy(() => import('./pages/Events'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Recruitment = lazy(() => import('./pages/Recruitment'));
const Sponsors = lazy(() => import('./pages/Sponsors'));
const Contact = lazy(() => import('./pages/Contact'));
const Faq = lazy(() => import('./pages/Faq'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Member Portal
const Login = lazy(() => import('./pages/member/Login'));
const MemberDashboard = lazy(() => import('./pages/member/Dashboard'));
const MyProfile = lazy(() => import('./pages/member/MyProfile'));
const Routine = lazy(() => import('./pages/member/Routine'));
const RoutineCSVImport = lazy(() => import('./pages/member/RoutineCSVImport'));
const CalendarPage = lazy(() => import('./pages/member/Calendar'));
const Tasks = lazy(() => import('./pages/member/Tasks'));
const Attendance = lazy(() => import('./pages/member/Attendance'));
const MemberEvents = lazy(() => import('./pages/member/MemberEvents'));
const MeetingSchedule = lazy(() => import('./pages/member/MeetingSchedule'));
const Notifications = lazy(() => import('./pages/member/Notifications'));
const Certificates = lazy(() => import('./pages/member/Certificates'));
const Performance = lazy(() => import('./pages/member/Performance'));
const VolunteerHours = lazy(() => import('./pages/member/VolunteerHours'));
const IdeaSubmission = lazy(() => import('./pages/member/IdeaSubmission'));
const Feedback = lazy(() => import('./pages/member/Feedback'));
const Settings = lazy(() => import('./pages/member/Settings'));
const Chat = lazy(() => import('./pages/member/Chat'));

// Admin Portal
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const MemberManagement = lazy(() => import('./pages/admin/MemberManagement'));
const ExecutiveManagement = lazy(() => import('./pages/admin/ExecutiveManagement'));
const RecruitmentAdmin = lazy(() => import('./pages/admin/Recruitment'));
const DepartmentsAdmin = lazy(() => import('./pages/admin/Departments'));
const TeamsAdmin = lazy(() => import('./pages/admin/Teams'));
const RoutineManagement = lazy(() => import('./pages/admin/RoutineManagement'));
const AvailabilityChecker = lazy(() => import('./pages/admin/AvailabilityChecker'));
const TaskAssignment = lazy(() => import('./pages/admin/TaskAssignment'));
const MeetingManagement = lazy(() => import('./pages/admin/MeetingManagement'));
const AttendanceAdmin = lazy(() => import('./pages/admin/AttendanceAdmin'));
const PerformanceAdmin = lazy(() => import('./pages/admin/Performance'));
const EventsAdmin = lazy(() => import('./pages/admin/EventsAdmin'));
const Budgets = lazy(() => import('./pages/admin/Budgets'));
const Inventory = lazy(() => import('./pages/admin/Inventory'));
const ResourceBooking = lazy(() => import('./pages/admin/ResourceBooking'));
const CertificateGenerator = lazy(() => import('./pages/admin/CertificateGenerator'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const GalleryCMS = lazy(() => import('./pages/admin/GalleryCMS'));
const WebsiteCMS = lazy(() => import('./pages/admin/WebsiteCMS'));
const RoleManagement = lazy(() => import('./pages/admin/RoleManagement'));
const ImportExport = lazy(() => import('./pages/admin/ImportExport'));
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'));
const LiveChat = lazy(() => import('./pages/admin/LiveChat'));
const Broadcast = lazy(() => import('./pages/admin/Broadcast'));
const GroupChat = lazy(() => import('./pages/admin/GroupChat'));
const AIAssistant = lazy(() => import('./pages/admin/AIAssistant'));

// Full-viewport fallback shown only on the very first chunk load of a route;
// once a chunk is cached the browser won't re-fetch it, so this rarely repeats.
function RouteFallback() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <LoadingState />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public Website */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="committee" element={<Committee />} />
          <Route path="departments" element={<Departments />} />
          <Route path="events" element={<Events />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="recruitment" element={<Recruitment />} />
          <Route path="sponsors" element={<Sponsors />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<Faq />} />
        </Route>

        {/* Member Portal */}
        <Route path="/login" element={<Login />} />
        <Route path="/portal" element={<MemberLayout />}>
          <Route index element={<MemberDashboard />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="routine" element={<Routine />} />
          <Route path="routine/import" element={<RoutineCSVImport />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="events" element={<MemberEvents />} />
          <Route path="meetings" element={<MeetingSchedule />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="performance" element={<Performance />} />
          <Route path="volunteer-hours" element={<VolunteerHours />} />
          <Route path="ideas" element={<IdeaSubmission />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="settings" element={<Settings />} />
          <Route path="chat" element={<Chat />} />
        </Route>

        {/* Admin Portal */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="ai" element={<RequirePermission slug="ai.use"><AIAssistant /></RequirePermission>} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<RequirePermission slug="reports.view"><Reports /></RequirePermission>} />
          <Route path="activity-logs" element={<RequirePermission slug="logs.view"><ActivityLogs /></RequirePermission>} />
          <Route path="users" element={<RequirePermission slug="users.manage"><UserManagement /></RequirePermission>} />
          <Route path="members" element={<RequirePermission slug="members.view"><MemberManagement /></RequirePermission>} />
          <Route path="executives" element={<RequirePermission slug="executives.view"><ExecutiveManagement /></RequirePermission>} />
          <Route path="recruitment" element={<RequirePermission slug="recruitment.view"><RecruitmentAdmin /></RequirePermission>} />
          <Route path="roles" element={<RequirePermission slug="roles.manage"><RoleManagement /></RequirePermission>} />
          <Route path="departments" element={<RequirePermission slug="departments.view"><DepartmentsAdmin /></RequirePermission>} />
          <Route path="teams" element={<RequirePermission slug="teams.view"><TeamsAdmin /></RequirePermission>} />
          <Route path="routines" element={<RoutineManagement />} />
          <Route path="availability" element={<AvailabilityChecker />} />
          <Route path="tasks" element={<RequirePermission slug="tasks.view"><TaskAssignment /></RequirePermission>} />
          <Route path="meetings" element={<RequirePermission slug="meetings.view"><MeetingManagement /></RequirePermission>} />
          <Route path="attendance" element={<RequirePermission slug="attendance.view"><AttendanceAdmin /></RequirePermission>} />
          <Route path="performance" element={<PerformanceAdmin />} />
          <Route path="events" element={<RequirePermission slug="events.view"><EventsAdmin /></RequirePermission>} />
          <Route path="budgets" element={<RequirePermission slug="budgets.view"><Budgets /></RequirePermission>} />
          <Route path="inventory" element={<RequirePermission slug="inventory.view"><Inventory /></RequirePermission>} />
          <Route path="bookings" element={<ResourceBooking />} />
          <Route path="certificates" element={<RequirePermission slug="certificates.manage"><CertificateGenerator /></RequirePermission>} />
          <Route path="gallery" element={<RequirePermission slug="cms.manage"><GalleryCMS /></RequirePermission>} />
          <Route path="cms" element={<RequirePermission slug="cms.manage"><WebsiteCMS /></RequirePermission>} />
          <Route path="import-export" element={<ImportExport />} />
          <Route path="chat" element={<LiveChat />} />
          <Route path="broadcast" element={<RequirePermission slug="broadcasts.send"><Broadcast /></RequirePermission>} />
          <Route path="groups" element={<GroupChat />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}