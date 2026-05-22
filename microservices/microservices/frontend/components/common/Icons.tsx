import clsx from "clsx";

export type IconName =
  | "activity"
  | "analytics"
  | "arrowUp"
  | "audit"
  | "board"
  | "chat"
  | "check"
  | "checkDouble"
  | "chevronRight"
  | "dashboard"
  | "employee"
  | "flag"
  | "heart"
  | "home"
  | "issue"
  | "logout"
  | "mentor"
  | "plus"
  | "send"
  | "shield"
  | "spark"
  | "user"
  | "trash"
  | "users";

const paths: Record<IconName, React.ReactNode> = {
  activity: (
    <>
      <path d="M22 12h-4l-3 8L9 4l-3 8H2" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-9" />
    </>
  ),
  arrowUp: (
    <>
      <path d="m6 15 6-6 6 6" />
      <path d="M12 9v12" />
    </>
  ),
  audit: (
    <>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path d="M9 5a3 3 0 0 1 6 0v0H9v0Z" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </>
  ),
  board: (
    <>
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
      <path d="M8 5v14" />
      <path d="M16 5v14" />
    </>
  ),
  chat: (
    <>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.8 8.8 0 0 1-3.8-.9L3 20l1.1-4.8A8.4 8.4 0 1 1 21 11.5Z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 4 4L19 6" />
    </>
  ),
  checkDouble: (
    <>
      <path d="m5 12 4 4L19 6" />
      <path d="m9 12 4 4L23 6" />
    </>
  ),
  chevronRight: (
    <>
      <path d="m9 18 6-6-6-6" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  employee: (
    <>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  flag: (
    <>
      <path d="M5 22V4" />
      <path d="M5 4h12l-2 5 2 5H5" />
    </>
  ),
  heart: (
    <>
      <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1Z" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  issue: (
    <>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </>
  ),
  logout: (
    <>
      <path d="M10 17 15 12 10 7" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </>
  ),
  mentor: (
    <>
      <path d="M6 10a4 4 0 1 1 8 0" />
      <path d="M14 10a4 4 0 1 1 8 0" />
      <path d="M2 21a8 8 0 0 1 16 0" />
      <path d="M14 18a7 7 0 0 1 8 3" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
      <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
    </>
  ),
  user: (
    <>
      <path d="M19 21a7 7 0 0 0-14 0" />
      <circle cx="12" cy="8" r="4" />
    </>
  ),
  users: (
    <>
      <path d="M16 21a6 6 0 0 0-12 0" />
      <circle cx="10" cy="8" r="4" />
      <path d="M22 21a5 5 0 0 0-5-5" />
      <path d="M17 4a4 4 0 0 1 0 8" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx("h-5 w-5", className)}
    >
      {paths[name]}
    </svg>
  );
}
