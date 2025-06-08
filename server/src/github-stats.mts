import { Octokit } from 'octokit';
import { createObjectCsvWriter } from 'csv-writer';
import { format, subYears, subWeeks, subDays, isWithinInterval, isWeekend, differenceInBusinessDays } from 'date-fns';
import env from './config/env.js';

interface Release {
  tag_name: string;
  published_at: string | null;
  name: string;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  author: {
    login: string;
    avatar_url: string;
  } | null;
  assets: {
    name: string;
    size: number;
    download_count: number;
  }[];
  html_url: string;
  reactions?: {
    total_count: number;
    "+1": number;
    "-1": number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

interface ReleaseStats {
  repository: string;
  total_releases: number;
  weekday_releases: number;
  weekend_releases: number;
  weekend_release_ratio: string;
  yearly_releases: number;
  weekly_releases: number;
  daily_releases: number;
  avg_releases_per_month: string;
  latest_release_date: string;
  first_release_date: string;
  release_period_days: number;
  business_days: number;
  pre_release_ratio: string;
}

interface PackageRelease {
  packageName: string;
  version: string;
  publishedAt: string;
  isPrerelease: boolean;
  isDraft: boolean;
  isWeekend: boolean;
}

interface PackageStats {
  packageName: string;
  totalReleases: number;
  weekdayReleases: number;
  weekendReleases: number;
  weekendReleaseRatio: string;
  latestVersion: string;
  firstReleaseDate: string;
  latestReleaseDate: string;
  releasePeriodDays: number;
  businessDays: number;
  avgReleaseIntervalDays: string;
  prereleaseRatio: string;
  yearlyReleases: number;
  weeklyReleases: number;
  dailyReleases: number;
}

const octokit = new Octokit({
  auth: env.GITHUB_TOKEN,
});

const repositories = [
  { owner: 'daangn', repo: 'stackflow' },
  { owner: 'daangn', repo: 'seed-design' },
];

async function getAllReleases(owner: string, repo: string): Promise<Release[]> {
  const releases: Release[] = [];
  let page = 1;
  
  while (true) {
    const response = await octokit.rest.repos.listReleases({
      owner,
      repo,
      per_page: 100,
      page,
    });

    if (response.data.length === 0) break;
    
    releases.push(...response.data.map(release => ({
      tag_name: release.tag_name,
      published_at: release.published_at,
      name: release.name || release.tag_name,
      body: release.body,
      draft: release.draft,
      prerelease: release.prerelease,
      author: release.author,
      assets: release.assets.map(asset => ({
        name: asset.name,
        size: asset.size,
        download_count: asset.download_count
      })),
      html_url: release.html_url
    })));
    page++;
  }

  return releases;
}

function calculateStats(releases: Release[]): ReleaseStats {
  const now = new Date();
  const oneYearAgo = subYears(now, 1);
  const oneWeekAgo = subWeeks(now, 1);
  const oneDayAgo = subDays(now, 1);

  const validReleases = releases.filter(r => r.published_at !== null);
  const releaseDates = validReleases.map(r => new Date(r.published_at!));
  
  // 주말 릴리즈와 평일 릴리즈 분리
  const weekendReleases = validReleases.filter(r => isWeekend(new Date(r.published_at!)));
  const weekdayReleases = validReleases.filter(r => !isWeekend(new Date(r.published_at!)));
  
  const yearlyReleases = validReleases.filter(r => 
    isWithinInterval(new Date(r.published_at!), { start: oneYearAgo, end: now })
  ).length;

  const weeklyReleases = validReleases.filter(r => 
    isWithinInterval(new Date(r.published_at!), { start: oneWeekAgo, end: now })
  ).length;

  const dailyReleases = validReleases.filter(r => 
    isWithinInterval(new Date(r.published_at!), { start: oneDayAgo, end: now })
  ).length;

  const firstReleaseDate = new Date(Math.min(...releaseDates.map(d => d.getTime())));
  const latestReleaseDate = new Date(Math.max(...releaseDates.map(d => d.getTime())));
  
  // 주말을 제외한 근무일 수 계산 (평균 계산용)
  const businessDays = differenceInBusinessDays(latestReleaseDate, firstReleaseDate) + 1;
  const totalDays = Math.ceil((latestReleaseDate.getTime() - firstReleaseDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    repository: validReleases[0]?.name?.split('@')[0] || '',
    total_releases: validReleases.length,
    weekday_releases: weekdayReleases.length,
    weekend_releases: weekendReleases.length,
    weekend_release_ratio: (weekendReleases.length / validReleases.length * 100).toFixed(2),
    yearly_releases: yearlyReleases,
    weekly_releases: weeklyReleases,
    daily_releases: dailyReleases,
    avg_releases_per_month: (validReleases.length / (businessDays / 30)).toFixed(2),
    latest_release_date: format(latestReleaseDate, 'yyyy-MM-dd'),
    first_release_date: format(firstReleaseDate, 'yyyy-MM-dd'),
    release_period_days: totalDays,
    business_days: businessDays,
    pre_release_ratio: (validReleases.filter(r => r.prerelease).length / validReleases.length * 100).toFixed(2)
  };
}

function extractPackageInfo(tagName: string): { packageName: string; version: string } | null {
  const match = tagName.match(/^@([^@]+)@(.+)$/);
  if (!match) return null;
  return {
    packageName: match[1],
    version: match[2]
  };
}

function analyzePackageReleases(releases: Release[]): PackageStats[] {
  const packageReleases = new Map<string, PackageRelease[]>();
  const now = new Date();
  const oneYearAgo = subYears(now, 1);
  const oneWeekAgo = subWeeks(now, 1);
  const oneDayAgo = subDays(now, 1);

  // 릴리즈를 패키지별로 분류
  releases.forEach(release => {
    if (!release.published_at) return;
    
    const packageInfo = extractPackageInfo(release.tag_name);
    if (!packageInfo) return;

    const packageRelease: PackageRelease = {
      packageName: packageInfo.packageName,
      version: packageInfo.version,
      publishedAt: release.published_at,
      isPrerelease: release.prerelease,
      isDraft: release.draft,
      isWeekend: isWeekend(new Date(release.published_at))
    };

    const existing = packageReleases.get(packageInfo.packageName) || [];
    packageReleases.set(packageInfo.packageName, [...existing, packageRelease]);
  });

  // 각 패키지별 통계 계산
  return Array.from(packageReleases.entries()).map(([packageName, releases]) => {
    const sortedReleases = releases.sort((a, b) => 
      new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );

    const firstReleaseDate = new Date(sortedReleases[0].publishedAt);
    const latestReleaseDate = new Date(sortedReleases[sortedReleases.length - 1].publishedAt);
    
    // 주말을 제외한 근무일 수 계산 (평균 계산용)
    const businessDays = differenceInBusinessDays(latestReleaseDate, firstReleaseDate) + 1;
    const totalDays = Math.ceil((latestReleaseDate.getTime() - firstReleaseDate.getTime()) / (1000 * 60 * 60 * 24));

    // 주말 릴리즈와 평일 릴리즈 분리
    const weekendReleases = releases.filter(r => r.isWeekend);
    const weekdayReleases = releases.filter(r => !r.isWeekend);

    // 릴리즈 간격 계산 (주말 제외)
    const releaseIntervals = [];
    for (let i = 1; i < sortedReleases.length; i++) {
      const interval = differenceInBusinessDays(
        new Date(sortedReleases[i].publishedAt),
        new Date(sortedReleases[i-1].publishedAt)
      );
      releaseIntervals.push(interval);
    }

    const avgReleaseInterval = releaseIntervals.length > 0
      ? releaseIntervals.reduce((a, b) => a + b, 0) / releaseIntervals.length
      : 0;

    // 기간별 릴리즈 수 계산
    const yearlyReleases = sortedReleases.filter(r => 
      isWithinInterval(new Date(r.publishedAt), { start: oneYearAgo, end: now })
    ).length;

    const weeklyReleases = sortedReleases.filter(r => 
      isWithinInterval(new Date(r.publishedAt), { start: oneWeekAgo, end: now })
    ).length;

    const dailyReleases = sortedReleases.filter(r => 
      isWithinInterval(new Date(r.publishedAt), { start: oneDayAgo, end: now })
    ).length;

    return {
      packageName,
      totalReleases: releases.length,
      weekdayReleases: weekdayReleases.length,
      weekendReleases: weekendReleases.length,
      weekendReleaseRatio: (weekendReleases.length / releases.length * 100).toFixed(2),
      latestVersion: sortedReleases[sortedReleases.length - 1].version,
      firstReleaseDate: format(firstReleaseDate, 'yyyy-MM-dd'),
      latestReleaseDate: format(latestReleaseDate, 'yyyy-MM-dd'),
      releasePeriodDays: totalDays,
      businessDays: businessDays,
      avgReleaseIntervalDays: avgReleaseInterval.toFixed(2),
      prereleaseRatio: (releases.filter(r => r.isPrerelease).length / releases.length * 100).toFixed(2),
      yearlyReleases,
      weeklyReleases,
      dailyReleases
    };
  });
}

async function generateStats() {
  const allStats: ReleaseStats[] = [];
  const allPackageStats: PackageStats[] = [];

  for (const { owner, repo } of repositories) {
    console.log(`Fetching releases for ${owner}/${repo}...`);
    const releases = await getAllReleases(owner, repo);
    const stats = calculateStats(releases);
    stats.repository = `${owner}/${repo}`;
    allStats.push(stats);

    // 패키지별 통계 분석
    const packageStats = analyzePackageReleases(releases);
    allPackageStats.push(...packageStats);
  }

  // 전체 릴리즈 통계 CSV
  const releaseStatsWriter = createObjectCsvWriter({
    path: 'data/release-stats.csv',
    header: [
      { id: 'repository', title: '저장소' },
      { id: 'total_releases', title: '총 릴리즈 수' },
      { id: 'weekday_releases', title: '평일 릴리즈 수' },
      { id: 'weekend_releases', title: '주말 릴리즈 수' },
      { id: 'weekend_release_ratio', title: '주말 릴리즈 비율(%)' },
      { id: 'yearly_releases', title: '연간 릴리즈 수' },
      { id: 'weekly_releases', title: '주간 릴리즈 수' },
      { id: 'daily_releases', title: '일간 릴리즈 수' },
      { id: 'avg_releases_per_month', title: '월간 평균 릴리즈 수(근무일 기준)' },
      { id: 'latest_release_date', title: '최근 릴리즈 날짜' },
      { id: 'first_release_date', title: '첫 릴리즈 날짜' },
      { id: 'release_period_days', title: '릴리즈 기간(일)' },
      { id: 'business_days', title: '근무일 수' },
      { id: 'pre_release_ratio', title: '프리릴리즈 비율(%)' }
    ]
  });

  // 패키지별 통계 CSV
  const packageStatsWriter = createObjectCsvWriter({
    path: 'data/package-stats.csv',
    header: [
      { id: 'packageName', title: '패키지명' },
      { id: 'totalReleases', title: '총 릴리즈 수' },
      { id: 'weekdayReleases', title: '평일 릴리즈 수' },
      { id: 'weekendReleases', title: '주말 릴리즈 수' },
      { id: 'weekendReleaseRatio', title: '주말 릴리즈 비율(%)' },
      { id: 'latestVersion', title: '최신 버전' },
      { id: 'firstReleaseDate', title: '첫 릴리즈 날짜' },
      { id: 'latestReleaseDate', title: '최근 릴리즈 날짜' },
      { id: 'releasePeriodDays', title: '릴리즈 기간(일)' },
      { id: 'businessDays', title: '근무일 수' },
      { id: 'avgReleaseIntervalDays', title: '평균 릴리즈 주기(근무일 기준)' },
      { id: 'prereleaseRatio', title: '프리릴리즈 비율(%)' },
      { id: 'yearlyReleases', title: '연간 릴리즈 수' },
      { id: 'weeklyReleases', title: '주간 릴리즈 수' },
      { id: 'dailyReleases', title: '일간 릴리즈 수' }
    ]
  });

  await releaseStatsWriter.writeRecords(allStats);
  await packageStatsWriter.writeRecords(allPackageStats);
  console.log('CSV files have been written successfully');
}

generateStats().catch(console.error); 