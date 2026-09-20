export interface LinkItem {
  id: string;
  slug: string;
  destination_url: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  expires_at: string | null;
}

export interface LinkClick {
  id: string;
  link_id: string;
  clicked_at: string;
  user_agent: string | null;
  referer: string | null;
  ip_hash: string | null;
  country: string | null;
  device_type: string | null;
}

export interface LinkStats {
  totalLinks: number;
  activeLinks: number;
  disabledLinks: number;
  totalClicks: number;
  clicksToday: number;
}

export interface LinkAnalyticsSummary {
  link: LinkItem;
  totalClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
    other: number;
  };
  clicksOverTime: { date: string; count: number }[];
  topReferrers: { referer: string; count: number }[];
  topCountries: { country: string; count: number }[];
}
