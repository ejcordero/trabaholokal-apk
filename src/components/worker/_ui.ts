import { IonIcon, IonSelect, IonSelectOption, IonSpinner } from '@ionic/vue'
import {
  addOutline,
  alertCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  banOutline,
  barChartOutline,
  briefcaseOutline,
  buildOutline,
  businessOutline,
  calendarOutline,
  callOutline,
  cameraOutline,
  carOutline,
  chatbubbleOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  chevronUpOutline,
  clipboardOutline,
  closeCircleOutline,
  closeOutline,
  cloudUploadOutline,
  codeSlashOutline,
  constructOutline,
  copyOutline,
  documentTextOutline,
  downloadOutline,
  ellipsisHorizontal,
  eyeOffOutline,
  eyeOutline,
  filterOutline,
  flashOutline,
  funnelOutline,
  gitBranchOutline,
  handLeftOutline,
  hammerOutline,
  helpCircleOutline,
  homeOutline,
  idCardOutline,
  imagesOutline,
  informationCircleOutline,
  leafOutline,
  linkOutline,
  locationOutline,
  lockClosedOutline,
  logInOutline,
  logOutOutline,
  mailOutline,
  medkitOutline,
  navigateOutline,
  notificationsOutline,
  pencilOutline,
  peopleOutline,
  personAddOutline,
  personOutline,
  playOutline,
  refreshOutline,
  reloadOutline,
  restaurantOutline,
  ribbonOutline,
  schoolOutline,
  searchOutline,
  sendOutline,
  settingsOutline,
  shareOutline,
  shieldCheckmarkOutline,
  shieldHalfOutline,
  sparklesOutline,
  starOutline,
  storefrontOutline,
  syncOutline,
  thumbsUpOutline,
  timeOutline,
  trashOutline,
  trendingUpOutline,
  walletOutline,
  warningOutline,
} from 'ionicons/icons'
import { defineComponent, h, ref, type Component, type PropType } from 'vue'
import { toastController } from '@ionic/vue'

import { APPLICATION_STATUSES, EMPLOYMENT_STATUSES, EMPLOYMENT_TYPES, JOB_CATEGORIES, SKILL_LEVELS } from './_constants'
import { formatCompensation, formatDate, formatDateTime, formatCurrency, labelFor, relativeTime, initials } from './_formatters'

export {
  formatCompensation,
  formatDate,
  formatDateTime,
  formatCurrency,
  labelFor,
  relativeTime,
  initials,
}

import type { ApplicationDTO, EmploymentDTO, FairPayResult, JobDTO } from './_types'

export const Icons = {
  Add: addOutline,
  AlertCircle: alertCircleOutline,
  AlertTriangle: warningOutline,
  ArrowBack: arrowBackOutline,
  ArrowRight: arrowForwardOutline,
  Award: ribbonOutline,
  Ban: banOutline,
  BarChart: barChartOutline,
  BadgeCheck: ribbonOutline,
  Bell: notificationsOutline,
  BellRing: notificationsOutline,
  Briefcase: briefcaseOutline,
  BriefcaseBusiness: briefcaseOutline,
  Building2: businessOutline,
  Build: buildOutline,
  CalendarDays: calendarOutline,
  Call: callOutline,
  Camera: cameraOutline,
  Car: carOutline,
  Chat: chatbubbleOutline,
  CheckCircle2: checkmarkCircleOutline,
  CheckCircle: checkmarkCircleOutline,
  Check: checkmarkOutline,
  CheckDone: checkmarkDoneOutline,
  ChevronDown: chevronDownOutline,
  ChevronLeft: chevronBackOutline,
  ChevronRight: chevronForwardOutline,
  ChevronUp: chevronUpOutline,
  ClipboardList: clipboardOutline,
  Close: closeOutline,
  CloseCircle: closeCircleOutline,
  CloudUpload: cloudUploadOutline,
  Code: codeSlashOutline,
  Construct: constructOutline,
  Copy: copyOutline,
  Document: documentTextOutline,
  Download: downloadOutline,
  Ellipsis: ellipsisHorizontal,
  Eye: eyeOutline,
  EyeOff: eyeOffOutline,
  FileText: documentTextOutline,
  FileWarning: warningOutline,
  Filter: filterOutline,
  Flash: flashOutline,
  Funnel: funnelOutline,
  Hammer: hammerOutline,
  HeartHandshake: handLeftOutline,
  Help: helpCircleOutline,
  Home: homeOutline,
  IdCard: idCardOutline,
  Images: imagesOutline,
  Info: informationCircleOutline,
  Leaf: leafOutline,
  Link: linkOutline,
  Loader2: syncOutline,
  Location: locationOutline,
  Lock: lockClosedOutline,
  LogIn: logInOutline,
  LogOut: logOutOutline,
  Mail: mailOutline,
  MapPin: locationOutline,
  Medkit: medkitOutline,
  Navigate: navigateOutline,
  Pencil: pencilOutline,
  People: peopleOutline,
  PersonAdd: personAddOutline,
  Play: playOutline,
  Plus: addOutline,
  RefreshCw: refreshOutline,
  Reload: reloadOutline,
  Restaurant: restaurantOutline,
  RotateCw: reloadOutline,
  RouteIcon: gitBranchOutline,
  School: schoolOutline,
  Search: searchOutline,
  Send: sendOutline,
  Settings: settingsOutline,
  Share: shareOutline,
  ShieldAlert: shieldHalfOutline,
  ShieldCheck: shieldCheckmarkOutline,
  Sparkles: sparklesOutline,
  Star: starOutline,
  Storefront: storefrontOutline,
  ThumbsUp: thumbsUpOutline,
  Time: timeOutline,
  Trash2: trashOutline,
  TrendingUp: trendingUpOutline,
  User: personOutline,
  Users: peopleOutline,
  Wallet: walletOutline,
  Zap: flashOutline,

  // Worker Account menu icons
  award: ribbonOutline,
  'document-text': documentTextOutline,
  sparkles: sparklesOutline,
  map: locationOutline,
  notifications: notificationsOutline,
  create: pencilOutline,
  warning: warningOutline,
}

export type IconName = keyof typeof Icons

const STYLE_ID = 'tl-ui-styles'

const UI_CSS = `
:root {
  --tl-bg: var(--ion-background-color, #f4f6f8);
  --tl-card: var(--ion-card-background, #ffffff);
  --tl-text: var(--ion-text-color, #1f2937);
  --tl-muted: #6b7280;
  --tl-border: #e5e7eb;
  --tl-primary: var(--ion-color-primary, #0f766e);
  --tl-primary-soft: #ccfbf1;
  --tl-danger: #e11d48;
  --tl-warning: #d97706;
  --tl-success: #059669;
  --tl-radius: 14px;
  --tl-shadow: 0 1px 2px rgba(16, 24, 40, .06), 0 1px 3px rgba(16, 24, 40, .08);
  --tl-safe-bottom: env(safe-area-inset-bottom, 0px);
  --tl-safe-top: env(safe-area-inset-top, 0px);
}
body { background: var(--tl-bg); color: var(--tl-text); }
.tl-shell { display: flex; flex-direction: column; height: 100%; min-height: 0; background: var(--tl-bg); }
.tl-sticky { position: sticky; top: 0; }
.tl-header { z-index: 20; background: color-mix(in srgb, var(--tl-card) 94%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--tl-border); padding-top: var(--tl-safe-top); }
.tl-header-row { display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 0 12px; }
.tl-header-title-wrap { min-width: 0; flex: 1; }
.tl-header-title { margin: 0; font-size: 16px; font-weight: 650; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tl-header-sub { margin: 0; font-size: 12px; color: var(--tl-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tl-header-right { display: flex; align-items: center; gap: 4px; }
.tl-content { flex: 1; min-height: 0; }
.tl-scroll { overflow-y: auto; -webkit-overflow-scrolling: touch; }
.tl-content-inner { padding: 16px 12px 96px; max-width: 720px; margin: 0 auto; }
.tl-footer { border-top: 1px solid var(--tl-border); background: var(--tl-card); padding-bottom: var(--tl-safe-bottom); }
.tl-splash { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 32px; text-align: center; background: radial-gradient(circle at 50% 20%, #ccfbf1 0, transparent 45%), var(--tl-bg); }
.tl-splash-icon { width: 76px; height: 76px; border-radius: 22px; display: grid; place-items: center; color: white; background: linear-gradient(135deg, #0f766e, #0d9488); box-shadow: 0 18px 40px rgba(13, 148, 136, .28); }
.tl-card { background: var(--tl-card); border: 1px solid var(--tl-border); border-radius: var(--tl-radius); box-shadow: var(--tl-shadow); overflow: hidden; }
.tl-card-body { padding: 16px; }
.tl-card.clickable { cursor: pointer; transition: transform .12s ease; }
.tl-card.clickable:active { transform: scale(.99); }
.tl-card-title { margin: 0; font-size: 15px; font-weight: 650; line-height: 1.3; }
.tl-muted { color: var(--tl-muted); }
.tl-primary { color: var(--tl-primary); }
.tl-danger { color: var(--tl-danger); }
.tl-warning { color: var(--tl-warning); }
.tl-success { color: var(--tl-success); }
.tl-divider { height: 1px; background: var(--tl-border); margin: 12px 0; }
.tl-row { display: flex; align-items: center; gap: 8px; }
.tl-between { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.tl-stack { display: flex; flex-direction: column; gap: 8px; }
.tl-wrap { flex-wrap: wrap; }
.tl-avatar { width: 40px; height: 40px; border-radius: 999px; object-fit: cover; background: var(--tl-primary-soft); color: var(--tl-primary); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; flex: none; }
.tl-avatar.sm { width: 32px; height: 32px; font-size: 12px; }
.tl-avatar.lg { width: 64px; height: 64px; font-size: 20px; }
.tl-btn { appearance: none; border: 1px solid transparent; background: var(--tl-primary); color: #fff; border-radius: 10px; min-height: 40px; padding: 0 14px; font: inherit; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; text-decoration: none; }
.tl-btn:disabled { opacity: .55; cursor: default; }
.tl-btn.outline { background: transparent; color: var(--tl-text); border-color: var(--tl-border); }
.tl-btn.ghost { background: transparent; color: var(--tl-text); }
.tl-btn.danger { background: var(--tl-danger); }
.tl-btn.warning { background: var(--tl-warning); }
.tl-btn.success { background: var(--tl-success); }
.tl-btn.sm { min-height: 32px; padding: 0 10px; font-size: 12px; border-radius: 8px; }
.tl-btn.icon { width: 38px; min-height: 38px; padding: 0; border-radius: 999px; }
.tl-btn.sm.icon { width: 30px; min-height: 30px; }
.tl-btn.block { width: 100%; }
.tl-btn .ionicon { font-size: 18px; }
.tl-field { display: flex; flex-direction: column; gap: 6px; }
.tl-label { font-size: 13px; font-weight: 600; }
.tl-input, .tl-textarea, .tl-select-native { width: 100%; box-sizing: border-box; border: 1px solid var(--tl-border); background: var(--tl-card); color: var(--tl-text); border-radius: 10px; padding: 10px 12px; font: inherit; font-size: 14px; min-height: 42px; }
.tl-textarea { min-height: 90px; resize: vertical; }
.tl-input:focus, .tl-textarea:focus { outline: 2px solid color-mix(in srgb, var(--tl-primary) 28%, transparent); border-color: var(--tl-primary); }
.tl-hint { font-size: 11px; color: var(--tl-muted); }
.tl-error { font-size: 11px; color: var(--tl-danger); }
.tl-pill { display: inline-flex; align-items: center; gap: 4px; border-radius: 999px; padding: 2px 9px; font-size: 11px; font-weight: 600; background: #f3f4f6; color: #4b5563; text-transform: capitalize; white-space: nowrap; }
.tl-pill.pending, .tl-pill.pending_start, .tl-pill.open, .tl-pill.flagged { background: #fef3c7; color: #92400e; }
.tl-pill.under_review { background: #dbeafe; color: #1e40af; }
.tl-pill.shortlisted { background: #ede9fe; color: #5b21b6; }
.tl-pill.accepted, .tl-pill.approved, .tl-pill.active, .tl-pill.published, .tl-pill.verified, .tl-pill.resolved, .tl-pill.ok { background: #d1fae5; color: #065f46; }
.tl-pill.completed { background: #e0f2fe; color: #075985; }
.tl-pill.rejected, .tl-pill.terminated, .tl-pill.suspended, .tl-pill.removed, .tl-pill.declined { background: #ffe4e6; color: #9f1239; }
.tl-pill.withdrawn, .tl-pill.dismissed, .tl-pill.expired, .tl-pill.paused, .tl-pill.closed, .tl-pill.archived, .tl-pill.draft, .tl-pill.unverified { background: #f3f4f6; color: #4b5563; }
.tl-urgency { display: inline-flex; align-items: center; gap: 3px; border-radius: 999px; padding: 2px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; background: #e11d48; color: #fff; }
.tl-safety { border: 1px solid #fcd34d; background: #fffbeb; color: #78350f; border-radius: 10px; padding: 10px; font-size: 12px; }
.tl-tabs { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; background: color-mix(in srgb, var(--tl-card) 95%, transparent); backdrop-filter: blur(10px); border-top: 1px solid var(--tl-border); padding-bottom: var(--tl-safe-bottom); }
.tl-tabs-inner { max-width: 720px; margin: 0 auto; display: grid; }
.tl-tab { position: relative; background: transparent; border: 0; color: var(--tl-muted); min-height: 56px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font: inherit; font-size: 11px; font-weight: 600; cursor: pointer; padding: 6px 2px; }
.tl-tab.active { color: var(--tl-primary); }
.tl-tab .ionicon { font-size: 21px; }
.tl-tab-badge { position: absolute; top: 5px; left: calc(50% + 6px); min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: #e11d48; color: #fff; font-size: 10px; line-height: 16px; text-align: center; }
.tl-tab.active::before { content: ''; position: absolute; top: 0; width: 32px; height: 3px; border-radius: 999px; background: var(--tl-primary); }
.tl-section-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 16px 0 8px; }
.tl-section-title h2 { margin: 0; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--tl-muted); }
.tl-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 42px 24px; }
.tl-empty .tl-empty-icon { color: #9ca3af; margin-bottom: 10px; }
.tl-empty h3 { margin: 0; font-size: 15px; font-weight: 650; }
.tl-empty p { margin: 4px 0 0; font-size: 13px; color: var(--tl-muted); max-width: 280px; }
.tl-skeleton { background: linear-gradient(90deg, #eef0f3 25%, #f7f8fa 37%, #eef0f3 63%); background-size: 400% 100%; animation: tl-shimmer 1.4s ease infinite; border-radius: 6px; }
.tl-skel-card { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
@keyframes tl-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
@keyframes tl-spin { to { transform: rotate(360deg); } }
.tl-spin { animation: tl-spin 1s linear infinite; }
.tl-progress { height: 7px; border-radius: 999px; overflow: hidden; background: #e5e7eb; }
.tl-progress > span { display: block; height: 100%; border-radius: inherit; background: var(--tl-primary); }
.tl-stat { display: flex; align-items: center; justify-content: space-between; padding: 14px; }
.tl-stat-label { margin: 0; font-size: 12px; color: var(--tl-muted); }
.tl-stat-value { font-size: 22px; font-weight: 750; margin-top: 2px; }
.tl-sheet-backdrop { position: fixed; inset: 0; z-index: 60; background: rgba(15, 23, 42, .46); display: flex; align-items: flex-end; justify-content: center; padding: 0; }
.tl-sheet { width: 100%; max-width: 720px; max-height: 92dvh; overflow-y: auto; background: var(--tl-card); border-radius: 20px 20px 0 0; box-shadow: 0 -12px 40px rgba(15, 23, 42, .2); padding-bottom: calc(16px + var(--tl-safe-bottom)); }
.tl-sheet-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: var(--tl-card); border-bottom: 1px solid var(--tl-border); }
.tl-sheet-head h2 { flex: 1; margin: 0; font-size: 16px; font-weight: 650; }
.tl-dialog-backdrop { position: fixed; inset: 0; z-index: 70; background: rgba(15, 23, 42, .5); display: flex; align-items: center; justify-content: center; padding: 18px; }
.tl-dialog { width: 100%; max-width: 440px; background: var(--tl-card); border-radius: 18px; padding: 18px; box-shadow: 0 20px 60px rgba(15, 23, 42, .25); }
.tl-dialog h2 { margin: 0 0 6px; font-size: 17px; }
.tl-dialog p { margin: 0; font-size: 13px; color: var(--tl-muted); }
.tl-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.tl-scroll-x { overflow-x: auto; scrollbar-width: none; }
.tl-scroll-x::-webkit-scrollbar { display: none; }
.tl-chip-row { display: flex; gap: 6px; flex-wrap: wrap; }
.tl-chip { border: 1px solid var(--tl-border); background: var(--tl-card); border-radius: 999px; padding: 3px 9px; font-size: 11px; }
.tl-chip.on { border-color: var(--tl-primary); background: var(--tl-primary-soft); color: var(--tl-primary); font-weight: 600; }
.tl-list { display: flex; flex-direction: column; gap: 8px; }
.tl-link { color: var(--tl-primary); text-decoration: none; font-weight: 600; }
.tl-caption { font-size: 11px; color: var(--tl-muted); }
.tl-safe-top { padding-top: var(--tl-safe-top); }
.tl-safe-bottom { padding-bottom: var(--tl-safe-bottom); }
.safe-top { padding-top: var(--tl-safe-top); }
.safe-bottom { padding-bottom: var(--tl-safe-bottom); }
.tl-num { font-variant-numeric: tabular-nums; }

/* compact utility bridge used by ported screens */
.flex{display:flex}.inline-flex{display:inline-flex}.grid{display:grid}.block{display:block}.hidden{display:none}
.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.flex-1{flex:1 1 0%;min-width:0}.shrink-0{flex-shrink:0}
.items-center{align-items:center}.items-start{align-items:flex-start}.items-end{align-items:flex-end}
.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-end{justify-content:flex-end}
.min-w-0{min-width:0}.h-full{height:100%}.w-full{width:100%}.mx-auto{margin-left:auto;margin-right:auto}
.relative{position:relative}.absolute{position:absolute}.overflow-hidden{overflow:hidden}.overflow-x-auto{overflow-x:auto}
.text-center{text-align:center}.text-right{text-align:right}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.capitalize{text-transform:capitalize}.uppercase{text-transform:uppercase}.italic{font-style:italic}
.font-medium{font-weight:500}.font-semibold{font-weight:600}.font-bold{font-weight:700}
.text-\\[10px\\]{font-size:10px}.text-\\[11px\\]{font-size:11px}.text-\\[13px\\]{font-size:13px}
.text-xs{font-size:12px}.text-sm{font-size:13px}.text-base{font-size:15px}.text-lg{font-size:18px}.text-xl{font-size:20px}.text-2xl{font-size:24px}
.text-muted-foreground{color:var(--tl-muted)}.text-primary{color:var(--tl-primary)}.text-white{color:#fff}
.text-rose-600{color:#e11d48}.text-rose-700{color:#be123c}.text-rose-800{color:#9f1239}
.text-amber-500{color:#f59e0b}.text-amber-600{color:#d97706}.text-amber-700{color:#b45309}.text-amber-800{color:#92400e}.text-amber-900{color:#78350f}
.text-emerald-600{color:#059669}.text-emerald-700{color:#047857}.text-emerald-800{color:#065f46}
.text-sky-600{color:#0284c7}.text-violet-600{color:#7c3aed}
.rounded{border-radius:4px}.rounded-md{border-radius:8px}.rounded-lg{border-radius:12px}.rounded-xl{border-radius:16px}.rounded-full{border-radius:999px}
.border{border:1px solid var(--tl-border)}.border-t{border-top:1px solid var(--tl-border)}.border-b{border-bottom:1px solid var(--tl-border)}.border-dashed{border-style:dashed}
.border-rose-300{border-color:#fda4af}.border-amber-300{border-color:#fcd34d}.border-emerald-300{border-color:#6ee7b7}
.bg-card{background:var(--tl-card)}.bg-muted{background:#f3f4f6}.bg-primary{background:var(--tl-primary)}
.bg-rose-50{background:#fff1f2}.bg-amber-50{background:#fffbeb}.bg-emerald-50{background:#ecfdf5}.bg-emerald-100{background:#d1fae5}.bg-rose-600{background:#e11d48}.bg-emerald-600{background:#059669}
.gap-0\\.5{gap:2px}.gap-1{gap:4px}.gap-1\\.5{gap:6px}.gap-2{gap:8px}.gap-3{gap:12px}.gap-4{gap:16px}
.gap-x-3{column-gap:12px}.gap-x-4{column-gap:16px}.gap-y-1{row-gap:4px}
.p-1{padding:4px}.p-1\\.5{padding:6px}.p-2{padding:8px}.p-3{padding:12px}.p-4{padding:16px}
.px-1\\.5{padding-left:6px;padding-right:6px}.px-2{padding-left:8px;padding-right:8px}.px-2\\.5{padding-left:10px;padding-right:10px}.px-3{padding-left:12px;padding-right:12px}.px-4{padding-left:16px;padding-right:16px}.px-6{padding-left:24px;padding-right:24px}
.py-0\\.5{padding-top:2px;padding-bottom:2px}.py-1{padding-top:4px;padding-bottom:4px}.py-2{padding-top:8px;padding-bottom:8px}.py-3{padding-top:12px;padding-bottom:12px}.py-4{padding-top:16px;padding-bottom:16px}
.pt-1{padding-top:4px}.pt-2{padding-top:8px}.pb-1{padding-bottom:4px}.pb-2{padding-bottom:8px}.pb-3{padding-bottom:12px}
.mb-0\\.5{margin-bottom:2px}.mb-1{margin-bottom:4px}.mb-2{margin-bottom:8px}.mb-3{margin-bottom:12px}
.mt-0\\.5{margin-top:2px}.mt-1{margin-top:4px}.mt-1\\.5{margin-top:6px}.mt-2{margin-top:8px}.mt-3{margin-top:12px}.mt-4{margin-top:16px}
.mr-1{margin-right:4px}.mr-1\\.5{margin-right:6px}.mr-2{margin-right:8px}.ml-1{margin-left:4px}.ml-auto{margin-left:auto}
.space-y-0\\.5> *+*{margin-top:2px}.space-y-1> *+*{margin-top:4px}.space-y-1\\.5> *+*{margin-top:6px}.space-y-2> *+*{margin-top:8px}.space-y-3> *+*{margin-top:12px}.space-y-4> *+*{margin-top:16px}
.h-1\\.5{height:6px}.h-2{height:8px}.h-3{height:12px}.h-3\\.5{height:14px}.h-4{height:16px}.h-5{height:20px}.h-6{height:24px}.h-8{height:32px}.h-9{height:36px}.h-10{height:40px}.h-14{height:56px}
.w-3{width:12px}.w-3\\.5{width:14px}.w-4{width:16px}.w-5{width:20px}.w-6{width:24px}.w-8{width:32px}.w-9{width:36px}.w-10{width:40px}.w-14{width:56px}.w-16{width:64px}
.size-3{width:12px;height:12px}.size-3\\.5{width:14px;height:14px}.size-4{width:16px;height:16px}
.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.col-span-2{grid-column:span 2/span 2}
.animate-spin{animation:tl-spin 1s linear infinite}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tl-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch}
@media (prefers-color-scheme: dark) {
  :root { --tl-bg:#0b1220; --tl-card:#111827; --tl-text:#f3f4f6; --tl-muted:#9ca3af; --tl-border:#253041; --tl-primary:#2dd4bf; --tl-primary-soft:#0f3f3a; }
  .bg-muted{background:#1f2937}.bg-white{background:#111827}
  .bg-rose-50{background:#2a1118}.bg-amber-50{background:#291d0b}.bg-emerald-50{background:#0c241c}.bg-emerald-100{background:#0f3f3a}
  .tl-input,.tl-textarea,.tl-select-native{background:#0f172a}
  .tl-skeleton{background:linear-gradient(90deg,#172033 25%,#1f2a40 37%,#172033 63%);background-size:400% 100%}
  .tl-progress{background:#253041}
}
`

export function injectUiStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = UI_CSS
  document.head.appendChild(el)
}

injectUiStyles()

function iconNode(icon: string | Component | undefined, size?: number) {
  const src = typeof icon === 'string' ? (Icons as Record<string, string>)[icon] ?? Icons.Info : icon ?? Icons.Info
  return h(IonIcon, { icon: src, style: size ? { fontSize: `${size}px` } : undefined })
}

export const AppShell = defineComponent({
  name: 'AppShell',
  props: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    back: { type: Boolean, default: false },
    scroll: { type: Boolean, default: true },
    sticky: { type: Boolean, default: true },
    padded: { type: Boolean, default: true },
  },
  emits: ['back'],
  setup(props, { slots, emit }) {
    return () => {
      const header =
        props.title || slots.right
          ? h(
              'header',
              { class: ['tl-header', props.sticky ? 'tl-sticky' : ''] },
              h('div', { class: 'tl-header-row' }, [
                props.back
                  ? h(
                      'button',
                      {
                        type: 'button',
                        class: 'tl-btn ghost icon',
                        'aria-label': 'Back',
                        onClick: () => emit('back'),
                      },
                      [iconNode(Icons.ChevronLeft)]
                    )
                  : null,
                h('div', { class: 'tl-header-title-wrap' }, [
                  h('h1', { class: 'tl-header-title' }, props.title),
                  props.subtitle ? h('p', { class: 'tl-header-sub' }, props.subtitle) : null,
                ]),
                slots.right ? h('div', { class: 'tl-header-right' }, slots.right()) : null,
              ])
            )
          : null
      return h('div', { class: 'tl-shell' }, [
        header,
        h('div', { class: ['tl-content', props.scroll ? 'tl-scroll' : ''] }, [
          h(
            'div',
            { class: 'tl-content-inner', style: props.padded ? undefined : { padding: '0 0 96px' } },
            slots.default ? slots.default() : []
          ),
        ]),
        slots.footer ? h('div', { class: 'tl-footer' }, slots.footer()) : null,
      ])
    }
  },
})

export interface TabItem {
  key: string
  label: string
  icon?: string | Component
  badge?: number
}

export const BottomTabs = defineComponent({
  name: 'BottomTabs',
  props: {
    items: { type: Array as PropType<TabItem[]>, required: true },
    active: { type: String, required: true },
  },
  emits: ['change'],
  setup(props, { emit }) {
    return () =>
      h('nav', { class: 'tl-tabs', 'aria-label': 'Primary' }, [
        h(
          'div',
          {
            class: 'tl-tabs-inner',
            style: { gridTemplateColumns: `repeat(${props.items.length}, minmax(0, 1fr))` },
          },
          props.items.map((it) =>
            h(
              'button',
              {
                type: 'button',
                key: it.key,
                class: ['tl-tab', it.key === props.active ? 'active' : ''],
                'aria-current': it.key === props.active ? 'page' : undefined,
                onClick: () => emit('change', it.key),
              },
              [
                h('span', { class: 'relative' }, [
                  iconNode(it.icon, 21),
                  it.badge
                    ? h('span', { class: 'tl-tab-badge' }, it.badge > 9 ? '9+' : String(it.badge))
                    : null,
                ]),
                h('span', it.label),
              ]
            )
          )
        ),
      ])
  },
})

export const SectionTitle = defineComponent({
  name: 'SectionTitle',
  setup(_, { slots }) {
    return () =>
      h('div', { class: 'tl-section-title' }, [
        h('h2', slots.default ? slots.default() : []),
        slots.action ? h('div', slots.action()) : null,
      ])
  },
})

export const LinkRow = defineComponent({
  name: 'LinkRow',
  props: {
    icon: { type: String, default: 'Info' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    badge: { type: [String, Number], default: undefined },
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          class: 'w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
          style: {
            background: 'var(--tl-card)',
            borderColor: 'var(--tl-border)',
            color: 'var(--tl-text)',
          },
          onClick: () => emit('click'),
        },
        [
          h(
            'div',
            {
              class: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              style: {
                background: 'var(--tl-primary-soft)',
                color: 'var(--tl-primary)',
              },
            },
            [iconNode(props.icon, 21)]
          ),
          h('div', { class: 'min-w-0 flex-1' }, [
            h('div', { class: 'flex items-center gap-2' }, [
              h('span', { class: 'text-sm font-semibold' }, props.title),
              props.badge !== undefined
                ? h(
                    'span',
                    {
                      class: 'rounded-full px-2 py-0.5 text-xs font-semibold',
                      style: {
                        background: 'var(--tl-primary-soft)',
                        color: 'var(--tl-primary)',
                      },
                    },
                    String(props.badge)
                  )
                : null,
            ]),
            props.description
              ? h(
                  'p',
                  { class: 'mt-0.5 text-xs', style: { color: 'var(--tl-muted)' } },
                  props.description
                )
              : null,
          ]),
          h('span', { class: 'shrink-0 text-lg', style: { color: 'var(--tl-muted)' } }, '›'),
        ]
      )
  },
})

export const LoadingCards = defineComponent({
  name: 'LoadingCards',
  props: { count: { type: Number, default: 3 } },
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'tl-list' },
        Array.from({ length: props.count }).map(() =>
          h('div', { class: 'tl-card' }, [
            h('div', { class: 'tl-skel-card' }, [
              h('div', { class: 'tl-skeleton', style: { height: '15px', width: '62%' } }),
              h('div', { class: 'tl-skeleton', style: { height: '12px', width: '48%' } }),
              h('div', { class: 'tl-skeleton', style: { height: '24px', width: '36%' } }),
              h('div', { class: 'tl-skeleton', style: { height: '34px', width: '100%' } }),
            ]),
          ])
        )
      )
  },
})

export const EmptyState = defineComponent({
  name: 'EmptyState',
  props: {
    icon: { type: [String, Object] as PropType<string | Component>, default: 'Info' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'tl-empty' }, [
        h('div', { class: 'tl-empty-icon' }, [iconNode(props.icon, 38)]),
        h('h3', props.title),
        props.description ? h('p', props.description) : null,
        slots.action ? h('div', { class: 'mt-4' }, slots.action()) : null,
      ])
  },
})

export const ErrorRetry = defineComponent({
  name: 'ErrorRetry',
  props: { message: { type: String, default: '' } },
  emits: ['retry'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'tl-empty' }, [
        h('div', { class: 'tl-empty-icon', style: { color: '#d97706' } }, [iconNode('AlertTriangle', 38)]),
        h('h3', 'Something went wrong'),
        h('p', props.message || 'Please try again.'),
        h(
          'button',
          { type: 'button', class: 'tl-btn outline sm mt-3', onClick: () => emit('retry') },
          [iconNode('RefreshCw', 15), h('span', 'Retry')]
        ),
      ])
  },
})

export const PullRefresh = defineComponent({
  name: 'PullRefresh',
  props: { refreshing: { type: Boolean, default: false } },
  emits: ['refresh'],
  setup(props, { slots, emit }) {
    const pull = ref(0)
    let startY = 0
    let pulling = false
    return () =>
      h(
        'div',
        {
          class: 'relative',
          onTouchstart: (e: TouchEvent) => {
            const el = e.currentTarget as HTMLElement
            pulling = el.scrollTop <= 0
            if (pulling) startY = e.touches[0].clientY
          },
          onTouchmove: (e: TouchEvent) => {
            if (!pulling) return
            const d = e.touches[0].clientY - startY
            if (d > 0) pull.value = Math.min(80, d * 0.5)
          },
          onTouchend: () => {
            if (pull.value > 50) emit('refresh')
            pull.value = 0
            pulling = false
          },
        },
        [
          h(
            'div',
            {
              class: 'flex items-center justify-center overflow-hidden',
              style: {
                height: `${pull.value}px`,
                transition: 'height .2s ease',
              },
            },
            [
              pull.value > 10 || props.refreshing
                ? h(IonSpinner, { name: 'crescent', style: { width: '20px', height: '20px' } })
                : null,
            ]
          ),
          slots.default ? slots.default() : null,
        ]
      )
  },
})

export const RefreshHeader = defineComponent({
  name: 'RefreshHeader',
  props: { refreshing: { type: Boolean, default: false } },
  emits: ['refresh'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          type: 'button',
          class: 'tl-btn ghost icon',
          'aria-label': 'Refresh',
          onClick: () => emit('refresh'),
        },
        [h(IonIcon, { icon: Icons.RefreshCw, class: props.refreshing ? 'tl-spin' : '' })]
      )
  },
})

export const Field = defineComponent({
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Field',
  props: {
    label: { type: String, default: '' },
    error: { type: String, default: '' },
    hint: { type: String, default: '' },
    required: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'tl-field' }, [
        props.label
          ? h('label', { class: 'tl-label' }, [
              props.label,
              props.required ? h('span', { style: { color: '#e11d48' } }, ' *') : null,
            ])
          : null,
        slots.default ? slots.default() : null,
        props.hint && !props.error ? h('p', { class: 'tl-hint' }, props.hint) : null,
        props.error ? h('p', { class: 'tl-error' }, props.error) : null,
      ])
  },
})

export const FormSelect = defineComponent({
  name: 'FormSelect',
  props: {
    modelValue: { type: String, default: '' },
    options: {
      type: Array as PropType<{ value: string; label: string }[]>,
      default: () => [],
    },
    placeholder: { type: String, default: 'Select...' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(
        IonSelect,
        {
          value: props.modelValue,
          placeholder: props.placeholder,
          disabled: props.disabled,
          interface: 'popover',
          class: 'tl-input',
          style: { minHeight: '42px' },
          onIonChange: (e: any) => emit('update:modelValue', e.detail.value),
        },
        () => props.options.map((o) => h(IonSelectOption, { value: o.value }, () => o.label))
      )
  },
})

export const StatusPill = defineComponent({
  name: 'StatusPill',
  props: {
    status: { type: String, required: true },
    list: {
      type: Array as PropType<readonly { value: string; label: string }[] | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    return () =>
      h(
        'span',
        { class: ['tl-pill', props.status] },
        props.list ? labelFor(props.status, props.list) : props.status.replace(/_/g, ' ')
      )
  },
})

export const VerifiedBadge = defineComponent({
  name: 'VerifiedBadge',
  props: {
    verification: { type: String, default: 'unverified' },
    size: { type: String, default: 'sm' },
  },
  setup(props) {
    return () => {
      const map: Record<string, { cls: string; icon: string; label: string }> = {
        verified: { cls: 'tl-pill verified', icon: 'ShieldCheck', label: 'Verified' },
        pending: { cls: 'tl-pill pending', icon: 'ShieldAlert', label: 'Pending' },
        suspended: { cls: 'tl-pill suspended', icon: 'Ban', label: 'Suspended' },
        unverified: { cls: 'tl-pill unverified', icon: 'Info', label: 'Unverified' },
      }
      const d = map[props.verification] ?? map.unverified
      return h('span', { class: d.cls, style: props.size === 'md' ? { fontSize: '12px' } : undefined }, [
        iconNode(d.icon, 13),
        h('span', d.label),
      ])
    }
  },
})

export const UrgencyTag = defineComponent({
  name: 'UrgencyTag',
  props: { level: { type: String, default: 'normal' } },
  setup(props) {
    return () =>
      props.level === 'urgent' || props.level === 'critical'
        ? h('span', { class: 'tl-urgency' }, [iconNode('Zap', 11), h('span', props.level)])
        : null
  },
})

export const FairPayChip = defineComponent({
  name: 'FairPayChip',
  props: { fair: { type: Object as PropType<FairPayResult | null | undefined>, default: null } },
  setup(props) {
    return () => {
      const fair = props.fair
      if (!fair) return null
      const map: Record<string, string> = {
        within_reference: 'tl-pill approved',
        above_reference: 'tl-pill under_review',
        below_reference: 'tl-pill pending',
        insufficient_data: 'tl-pill unverified',
      }
      const icon =
        fair.classification === 'within_reference'
          ? 'CheckCircle2'
          : fair.classification === 'insufficient_data'
            ? 'Info'
            : 'AlertTriangle'
      const title =
        fair.classification === 'insufficient_data'
          ? 'No reference rate is available. Estimate only.'
          : fair.minRate != null
            ? `Reference: ${formatCurrency(fair.minRate)} - ${formatCurrency(fair.maxRate ?? fair.minRate)} (estimate)`
            : fair.label
      return h('span', { class: map[fair.classification] ?? 'tl-pill', title }, [
        iconNode(icon, 13),
        h('span', fair.label),
      ])
    }
  },
})

export const ScamFlags = defineComponent({
  name: 'ScamFlags',
  props: { flags: { type: Array as PropType<string[]>, default: () => [] } },
  setup(props) {
    return () => {
      if (!props.flags.length) return null
      return h('div', { class: 'tl-safety' }, [
        h('div', { class: 'flex items-center gap-2 font-semibold mb-1' }, [
          iconNode('FileWarning', 15),
          h('span', 'Safety notice - please verify'),
        ]),
        h(
          'ul',
          { style: { margin: '4px 0 0', paddingLeft: '18px' } },
          props.flags.map((f, i) => h('li', { key: i }, f))
        ),
        h(
          'p',
          { class: 'tl-caption', style: { marginTop: '4px' } },
          'Never pay fees to apply. Report suspicious listings.'
        ),
      ])
    }
  },
})

export const MatchRing = defineComponent({
  name: 'MatchRing',
  props: {
    score: { type: Number, required: true },
    size: { type: Number, default: 48 },
  },
  setup(props) {
    return () => {
      const size = props.size
      const r = (size - 6) / 2
      const c = 2 * Math.PI * r
      const color =
        props.score >= 85 ? '#16a34a' : props.score >= 70 ? '#65a30d' : props.score >= 50 ? '#d97706' : '#dc2626'
      return h('div', { class: 'relative inline-flex items-center justify-center', style: { width: `${size}px`, height: `${size}px` } }, [
        h(
          'svg',
          { width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { transform: 'rotate(-90deg)' } },
          [
            h('circle', {
              cx: size / 2,
              cy: size / 2,
              r,
              fill: 'none',
              stroke: '#e5e7eb',
              'stroke-width': 4,
            }),
            h('circle', {
              cx: size / 2,
              cy: size / 2,
              r,
              fill: 'none',
              stroke: color,
              'stroke-width': 4,
              'stroke-dasharray': c,
              'stroke-dashoffset': c - (props.score / 100) * c,
              'stroke-linecap': 'round',
            }),
          ]
        ),
        h(
          'div',
          {
            class: 'absolute inset-0 flex items-center justify-center',
            style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
          },
          [h('span', { style: { fontSize: '11px', fontWeight: 700, color } }, `${props.score}%`)]
        ),
      ])
    }
  },
})

export const SkillLevelBadge = defineComponent({
  name: 'SkillLevelBadge',
  props: { level: { type: String, default: 'self_declared' } },
  setup(props) {
    return () => {
      const def = SKILL_LEVELS.find((l) => l.value === props.level)
      const cls: Record<string, string> = {
        self_declared: 'tl-pill unverified',
        verified_experience: 'tl-pill approved',
        repeatedly_demonstrated: 'tl-pill under_review',
        highly_rated: 'tl-pill shortlisted',
      }
      const icon =
        props.level === 'highly_rated'
          ? 'Star'
          : props.level === 'verified_experience'
            ? 'BadgeCheck'
            : props.level === 'repeatedly_demonstrated'
              ? 'Award'
              : 'Info'
      return h('span', { class: cls[props.level] ?? cls.self_declared, title: def?.desc ?? props.level }, [
        iconNode(icon, 12),
        h('span', def?.label ?? props.level),
      ])
    }
  },
})

export const Avatar = defineComponent({
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Avatar',
  props: {
    name: { type: String, default: '' },
    src: { type: String, default: '' },
    size: { type: String, default: 'md' },
  },
  setup(props) {
    return () => {
      const cls = ['tl-avatar', props.size === 'sm' ? 'sm' : props.size === 'lg' ? 'lg' : '']
      if (props.src) return h('img', { src: props.src, alt: props.name, class: cls })
      return h('span', { class: cls }, initials(props.name))
    }
  },
})

export const StatCard = defineComponent({
  name: 'StatCard',
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number] as PropType<string | number>, default: '' },
    icon: { type: [String, Object] as PropType<string | Component>, default: 'Info' },
  },
  setup(props) {
    return () =>
      h('div', { class: 'tl-card' }, [
        h('div', { class: 'tl-stat' }, [
          h('div', { class: 'min-w-0' }, [
            h('p', { class: 'tl-stat-label' }, props.label),
            h('div', { class: 'tl-stat-value' }, props.value),
          ]),
          h('div', { class: 'tl-primary' }, [iconNode(props.icon, 22)]),
        ]),
      ])
  },
})

export const ProgressBar = defineComponent({
  name: 'ProgressBar',
  props: { value: { type: Number, default: 0 } },
  setup(props) {
    return () =>
      h('div', { class: 'tl-progress' }, [
        h('span', { style: { width: `${Math.max(0, Math.min(100, props.value))}%` } }),
      ])
  },
})

export const JobCard = defineComponent({
  name: 'JobCard',
  props: {
    job: { type: Object as PropType<JobDTO>, required: true },
    match: { type: Object as PropType<{ score: number; grade?: string } | null>, default: null },
  },
  emits: ['open'],
  setup(props, { emit }) {
    return () => {
      const job = props.job
      return h('div', { class: 'tl-card clickable', onClick: () => emit('open', job.id) }, [
        h('div', { class: 'tl-card-body' }, [
          h('div', { class: 'flex items-start justify-between gap-2' }, [
            h('div', { class: 'min-w-0 flex-1' }, [
              h('div', { class: 'flex items-center gap-1.5 flex-wrap' }, [
                h(UrgencyTag, { level: job.urgencyLevel }),
                h('span', { class: 'text-[11px] uppercase text-muted-foreground' },
                  labelFor(job.category, JOB_CATEGORIES)),
                job.preferredCategoryMatch
                  ? h('span', {
                      class: 'text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5'
                    }, 'Preferred category')
                  : null,
              ]),
              h('h3', { class: 'tl-card-title truncate mt-1' }, job.title),
              h('p', { class: 'text-xs text-muted-foreground flex items-center gap-1 mt-0.5' }, [
                iconNode('Building2', 14),
                h('span', { class: 'truncate' }, job.employerName),
                h(VerifiedBadge, { verification: job.employerVerification }),
              ]),
            ]),
            props.match ? h(MatchRing, { score: props.match.score, size: 46 }) : null,
          ]),
          h('div', { class: 'flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2' }, [
            h('span', { class: 'inline-flex items-center gap-1' }, [
              h(IonIcon, { icon: Icons.Wallet, style: { color: '#059669' } }),
              h('span', formatCompensation(job.compensation, job.compensationType)),
            ]),
            h('span', { class: 'inline-flex items-center gap-1' }, [
              iconNode('MapPin', 14),
              h('span', `${job.municipalityName ?? job.barangay ?? 'Location N/A'}${job.distanceKm != null ? ` - ${job.distanceKm} km` : ''}`),
            ]),
            h('span', { class: 'inline-flex items-center gap-1' }, [
              iconNode('Clock', 14),
              h('span', labelFor(job.employmentType, EMPLOYMENT_TYPES)),
            ]),
          ]),
          job.scamFlags.length
            ? h('div', { class: 'text-xs text-amber-700 flex items-center gap-1 mt-2' }, [
                iconNode('FileWarning', 14),
                h('span', 'Safety notice - review before applying'),
              ])
            : null,
          h('div', { class: 'tl-chip-row mt-2' }, [
            ...job.requiredSkills.slice(0, 3).map((s) => h('span', { key: s.id, class: 'tl-chip' }, s.skillName)),
            job.requiredSkills.length > 3
              ? h('span', { class: 'tl-caption' }, `+${job.requiredSkills.length - 3} more`)
              : null,
          ]),
        ]),
      ])
    }
  },
})

export const ApplicationCard = defineComponent({
  name: 'ApplicationCard',
  props: { app: { type: Object as PropType<ApplicationDTO>, required: true } },
  emits: ['open'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'tl-card clickable', onClick: () => emit('open', props.app.id) }, [
        h('div', { class: 'tl-card-body' }, [
          h('div', { class: 'flex items-start justify-between gap-2' }, [
            h('div', { class: 'min-w-0' }, [
              h('h3', { class: 'tl-card-title truncate' }, props.app.workerName || props.app.jobTitle),
              h('p', { class: 'text-xs text-muted-foreground truncate mt-0.5' }, props.app.workerName ? props.app.jobTitle : props.app.employerName),
            ]),
            h(StatusPill, { status: props.app.status, list: APPLICATION_STATUSES }),
          ]),
          h('div', { class: 'flex items-center justify-between mt-2' }, [
            h('span', { class: 'tl-caption' }, relativeTime(props.app.createdAt)),
            props.app.matchScore > 0
              ? h('span', { class: 'text-xs font-semibold text-emerald-700' }, `${props.app.matchScore}% match`)
              : null,
          ]),
        ]),
      ])
  },
})

export const EmploymentCard = defineComponent({
  name: 'EmploymentCard',
  props: {
    emp: { type: Object as PropType<EmploymentDTO>, required: true },
    showWorker: { type: Boolean, default: false },
  },
  emits: ['open'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'tl-card clickable', onClick: () => emit('open', props.emp.id) }, [
        h('div', { class: 'tl-card-body' }, [
          h('div', { class: 'flex items-start justify-between gap-2' }, [
            h('div', { class: 'min-w-0' }, [
              h('h3', { class: 'tl-card-title truncate' }, props.emp.jobTitle),
              h('p', { class: 'text-xs text-muted-foreground truncate mt-0.5' }, props.showWorker ? props.emp.workerName : props.emp.employerName),
            ]),
            h(StatusPill, { status: props.emp.status, list: EMPLOYMENT_STATUSES }),
          ]),
          h('div', { class: 'flex items-center gap-3 text-xs text-muted-foreground mt-2' }, [
            h('span', { class: 'inline-flex items-center gap-1' }, [
              h(IonIcon, { icon: Icons.Wallet, style: { color: '#059669' } }),
              h('span', formatCompensation(props.emp.agreedCompensation, props.emp.compensationType)),
            ]),
            h('span', { class: 'inline-flex items-center gap-1' }, [
              iconNode('CalendarDays', 14),
              h('span', formatDate(props.emp.startDate)),
            ]),
          ]),
          h('div', { class: 'mt-2' }, [
            h('div', { class: 'flex items-center justify-between text-xs' }, [
              h('span', { class: 'text-muted-foreground' }, 'Progress'),
              h('span', { class: 'font-medium' }, `${props.emp.approvedWorkdays}/${props.emp.targetWorkdays} workdays - ${props.emp.progressPercent}%`),
            ]),
            h('div', { class: 'mt-1' }, [h(ProgressBar, { value: props.emp.progressPercent })]),
            props.emp.pendingReports > 0
              ? h('p', { class: 'text-[11px] text-amber-700 mt-1' }, `${props.emp.pendingReports} pending report${props.emp.pendingReports > 1 ? 's' : ''}`)
              : null,
          ]),
        ]),
      ])
  },
})

/** Simple bottom sheet used by many screens. */
export const BottomSheet = defineComponent({
  name: 'BottomSheet',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: '' },
  },
  emits: ['close'],
  setup(props, { slots, emit }) {
    return () =>
      props.open
        ? h('div', { class: 'tl-sheet-backdrop', onClick: () => emit('close') }, [
            h(
              'div',
              {
                class: 'tl-sheet',
                onClick: (e: Event) => e.stopPropagation(),
              },
              [
                h('div', { class: 'tl-sheet-head' }, [
                  h('h2', props.title),
                  h('button', { type: 'button', class: 'tl-btn ghost icon', 'aria-label': 'Close', onClick: () => emit('close') }, [
                    iconNode('Close'),
                  ]),
                ]),
                h('div', { style: { padding: '14px 16px' } }, slots.default ? slots.default() : []),
                slots.footer ? h('div', { style: { padding: '0 16px' } }, slots.footer()) : null,
              ]
            ),
          ])
        : null
  },
})

export const ConfirmDialog = defineComponent({
  name: 'ConfirmDialog',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: 'Are you sure?' },
    message: { type: String, default: '' },
    confirmLabel: { type: String, default: 'Confirm' },
    cancelLabel: { type: String, default: 'Cancel' },
    danger: { type: Boolean, default: false },
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    return () =>
      props.open
        ? h('div', { class: 'tl-dialog-backdrop', onClick: () => emit('cancel') }, [
            h('div', { class: 'tl-dialog', onClick: (e: Event) => e.stopPropagation() }, [
              h('h2', props.title),
              props.message ? h('p', props.message) : null,
              h('div', { class: 'tl-actions' }, [
                h('button', { type: 'button', class: 'tl-btn outline', onClick: () => emit('cancel') }, props.cancelLabel),
                h('button', { type: 'button', class: ['tl-btn', props.danger ? 'danger' : ''], onClick: () => emit('confirm') }, props.confirmLabel),
              ]),
            ]),
          ])
        : null
  },
})



export function statusLabel(status: string, list: readonly { value: string; label: string }[]): string {
  return labelFor(status, list)
}

// Basic components
export const Card = defineComponent({
  name: 'Card',
  setup(_, { slots }) {
    return () => h('div', { class: 'tl-card' }, slots.default?.())
  }
})

export const CardContent = defineComponent({
  name: 'CardContent',
  setup(_, { slots }) {
    return () => h('div', { class: 'tl-card-content' }, slots.default?.())
  }
})

export const Separator = defineComponent({
  name: 'Separator',
  setup(_, { slots }) {
    return () => h('div', { class: 'tl-separator' }, slots.default?.())
  }
})

// Job detail sheet component
export const JobDetailSheet = defineComponent({
  name: 'JobDetailSheet',
  props: {
    jobId: { type: String, default: null },
    job: { type: Object as () => JobDTO | null, default: null },
    open: { type: Boolean, default: false }
  },
  emits: ['open-change', 'applied'],
  setup(props, { emit }) {
    return () =>
      props.open
        ? h('div', { class: 'tl-sheet-backdrop', onClick: () => emit('open-change', null) }, [
            h('div', { class: 'tl-sheet', onClick: (e: Event) => e.stopPropagation() }, [
              h('div', { class: 'tl-sheet-head' }, [
                h('h2', props.job?.title || 'Job details'),
                h('button', { type: 'button', class: 'tl-btn ghost icon', 'aria-label': 'Close', onClick: () => emit('open-change', null) }, [
                  iconNode('Close'),
                ]),
              ]),
              h('div', { style: { padding: '14px 16px' } }, [
                // Job details content would go here
                h('p', 'Job details content')
              ]),
              h('div', { style: { padding: '0 16px' } }, [
                h('button', { type: 'button', class: 'tl-btn', onClick: () => emit('applied') }, 'Apply now')
              ]),
            ]),
          ])
        : null
  }
})


export function useToast() {
  async function toast(
    messageOrOptions:
      | string
      | {
          message: string
          color?: 'success' | 'danger' | 'warning' | 'medium' | 'primary'
          duration?: number
          position?: 'top' | 'middle' | 'bottom'
        },
    color: 'success' | 'danger' | 'warning' | 'medium' | 'primary' = 'success'
  ) {
    const options =
      typeof messageOrOptions === 'string'
        ? {
            message: messageOrOptions,
            color,
            duration: 2500,
            position: 'bottom' as const,
          }
        : {
            message: messageOrOptions.message,
            color: messageOrOptions.color ?? 'success',
            duration: messageOrOptions.duration ?? 2500,
            position: messageOrOptions.position ?? 'bottom',
          }

    const toastElement = await toastController.create({
      ...options,
    })

    await toastElement.present()
  }

  return {
    toast,
    showToast: toast,
    success: (message: string) => toast(message, 'success'),
    error: (message: string) => toast(message, 'danger'),
    warning: (message: string) => toast(message, 'warning'),
  }
}


