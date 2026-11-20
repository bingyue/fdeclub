export type City = {
  id?: string;
  slug: string;
  name: string;
  region: string;
  focus: string;
  status: string;
  description?: string;
  leader_name?: string | null;
  leader_consent?: boolean;
};
export const plannedCities: City[] = [
  {
    slug: "beijing",
    name: "北京",
    region: "华北",
    focus: "AI产业 · 专业服务",
    status: "recruiting",
  },
  {
    slug: "shanghai",
    name: "上海",
    region: "华东",
    focus: "产业创新 · 企业数字化",
    status: "recruiting",
  },
  {
    slug: "hangzhou",
    name: "杭州",
    region: "华东",
    focus: "电商科技 · 智能应用",
    status: "recruiting",
  },
  {
    slug: "shenzhen",
    name: "深圳",
    region: "华南",
    focus: "硬件创新 · 供应链",
    status: "recruiting",
  },
  {
    slug: "chengdu",
    name: "成都",
    region: "西南",
    focus: "软件服务 · 人才共建",
    status: "recruiting",
  },
  {
    slug: "qingdao",
    name: "青岛",
    region: "华北",
    focus: "智能制造 · 工业互联网",
    status: "recruiting",
  },
];
export const navItems = [
  ["/cities", "城市共建"],
  ["/enterprise", "企业需求"],
  ["/events", "产业活动"],
  ["/partners", "产业合作"],
  ["/experts", "专家网络"],
  ["/book", "FDE图书"],
] as const;
export const cityStatuses: Record<string, string> = {
  recruiting: "招募中",
  preparing: "筹备中",
  active: "共建中",
  paused: "暂停共建",
};
export const labels: Record<string, string> = {
  new: "新需求",
  triaged: "已初筛",
  contacted: "已联系",
  qualified: "已明确需求",
  poc_proposed: "PoC建议",
  project_handoff: "项目转交",
  won: "已合作",
  lost: "已关闭",
  submitted: "待审核",
  review: "审核中",
  interview: "访谈中",
  approved: "已批准",
  rejected: "未通过",
  active: "有效",
  paused: "已暂停",
  cooperating: "合作中",
  closed: "已关闭",
  draft: "草稿",
  published: "已发布",
  cancelled: "已取消",
  pending: "待审核",
  confirmed: "已确认",
  attended: "已签到",
  intent: "已登记",
  expired: "已到期",
  super_admin: "超级管理员",
  operations: "运营",
  city_manager: "城市负责人",
  member: "会员",
  enterprise_contact: "企业联系人",
  disabled: "已停用",
  public: "公开",
  private: "私有",
  sent: "已发送",
  failed: "待重试",
  processing: "发送中",
};
export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  event_type: string;
  city_id: string;
  location: string;
  organizer: string;
  audience: string;
  starts_at: string;
  ends_at: string;
  registration_deadline: string;
  capacity: number;
  requires_approval: boolean;
  poster_url: string | null;
  status: string;
  reserved: number;
};
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
export function eventState(e: PublicEvent) {
  if (e.status === "cancelled") return "已取消";
  if (new Date(e.ends_at) < new Date()) return "已结束";
  if (new Date(e.starts_at) < new Date()) return "进行中";
  if (new Date(e.registration_deadline) < new Date()) return "报名已截止";
  if (e.reserved >= e.capacity) return "名额已满";
  return "开放报名";
}
