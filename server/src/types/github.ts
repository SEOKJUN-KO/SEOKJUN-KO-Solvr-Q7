export interface Release {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  author: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string | null;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  } | null;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  assets: Array<{
    url: string;
    id: number;
    node_id: string;
    name: string;
    label: string | null;
    uploader: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string | null;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
    } | null;
    content_type: string;
    state: string;
    size: number;
    download_count: number;
    created_at: string;
    updated_at: string;
    browser_download_url: string;
  }>;
  tarball_url: string | null;
  zipball_url: string | null;
  body?: string | null;
}

export interface ReleaseStats {
  repository: string;
  total_releases: number;
  avgReleaseIntervalDays: number;
  pre_release_ratio: number;
  weekend_release_ratio: number;
  last_day_releases: number;
  last_week_releases: number;
  last_month_releases: number;
  last_year_releases: number;
  latest_release_date: string;
  first_release_date: string;
  release_period_days: number;
  business_days: number;
  weekday_releases: number;
  weekend_releases: number;
}

export interface PackageStats {
  packageName: string;
  totalReleases: number;
  weekdayReleases: number;
  weekendReleases: number;
  weekendReleaseRatio: number;
  latestVersion: string;
  firstReleaseDate: string;
  latestReleaseDate: string;
  releasePeriodDays: number;
  businessDays: number;
  avgReleaseIntervalDays: number;
  prereleaseRatio: number;
  lastDayReleases: number;
  lastWeekReleases: number;
  lastMonthReleases: number;
  lastYearReleases: number;
}

export interface RawRelease {
  repository: string;
  release_id: number;
  release_tag: string;
  release_name: string | null;
  release_notes: string | null;
  release_url: string;
  is_draft: boolean;
  is_prerelease: boolean;
  created_at: string;
  published_at: string | null;
  author_name: string | null;
  author_url: string | null;
  target_branch: string;
  download_count: number;
  asset_count: number;
} 