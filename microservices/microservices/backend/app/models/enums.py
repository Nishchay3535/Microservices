import enum


class UserRole(str, enum.Enum):
    employee = "employee"
    authority = "authority"
    mentor = "mentor"
    admin = "admin"


class IssueStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class IssueCategory(str, enum.Enum):
    wellbeing = "wellbeing"
    workload = "workload"
    discrimination = "discrimination"
    career = "career"
    other = "other"


class RoomType(str, enum.Enum):
    authority = "authority"
    mentor = "mentor"


class ReactionType(str, enum.Enum):
    support = "support"
    like = "like"
    flag = "flag"


class MentorshipStatus(str, enum.Enum):
    requested = "requested"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class AuditAction(str, enum.Enum):
    login = "login"
    logout = "logout"
    register = "register"
    issue_create = "issue_create"
    issue_status = "issue_status"
    role_change = "role_change"
    gdpr_soft_delete = "gdpr_soft_delete"
    gdpr_hard_delete = "gdpr_hard_delete"
    message_send = "message_send"
    post_create = "post_create"
    reaction = "reaction"
