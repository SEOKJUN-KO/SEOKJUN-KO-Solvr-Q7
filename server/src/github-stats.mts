import { Octokit } from 'octokit';
import { createObjectCsvWriter } from 'csv-writer';
import { differenceInDays, isWeekend, parseISO, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import env from './config/env.js';
import { Release, ReleaseStats, PackageStats, RawRelease } from './types/github.js';

const octokit = new Octokit({
  auth: env.GITHUB_TOKEN
});

async function getAllReleases(owner: string, repo: string): Promise<Release[]> {
  const releases: Release[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await octokit.rest.repos.listReleases({
      owner,
      repo,
      per_page: 100,
      page
    });

    if (response.data.length === 0) {
      hasMore = false;
    } else {
      releases.push(...response.data);
      page++;
    }
  }

  return releases;
}

function calculateStats(releases: Release[]): ReleaseStats {
  const publishedReleases = releases.filter(release => !release.draft && release.published_at);
  const releaseDates = publishedReleases.map(release => parseISO(release.published_at!));
  const weekendReleases = releaseDates.filter(date => isWeekend(date));
  const firstRelease = new Date(Math.min(...releaseDates.map(date => date.getTime())));
  const latestRelease = new Date(Math.max(...releaseDates.map(date => date.getTime())));
  const totalDays = differenceInDays(latestRelease, firstRelease);
  const businessDays = Math.floor(totalDays * 5 / 7);

  const now = new Date();
  const oneDayAgo = subDays(now, 1);
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);
  const oneYearAgo = subYears(now, 1);

  const lastDayReleases = releaseDates.filter(date => date >= oneDayAgo).length;
  const lastWeekReleases = releaseDates.filter(date => date >= oneWeekAgo).length;
  const lastMonthReleases = releaseDates.filter(date => date >= oneMonthAgo).length;
  const lastYearReleases = releaseDates.filter(date => date >= oneYearAgo).length;

  const avgReleaseInterval = businessDays / publishedReleases.length;

  return {
    repository: '',
    total_releases: publishedReleases.length,
    avgReleaseIntervalDays: Number(avgReleaseInterval.toFixed(2)),
    pre_release_ratio: Number((publishedReleases.filter(release => release.prerelease).length / publishedReleases.length * 100).toFixed(2)),
    weekend_release_ratio: Number(((weekendReleases.length / publishedReleases.length) * 100).toFixed(2)),
    last_day_releases: lastDayReleases,
    last_week_releases: lastWeekReleases,
    last_month_releases: lastMonthReleases,
    last_year_releases: lastYearReleases,
    latest_release_date: latestRelease.toISOString(),
    first_release_date: firstRelease.toISOString(),
    release_period_days: totalDays,
    business_days: businessDays,
    weekday_releases: publishedReleases.length - weekendReleases.length,
    weekend_releases: weekendReleases.length
  };
}

function extractPackageInfo(tagName: string): { packageName: string; version: string } | null {
  const match = tagName.match(/^@([^/]+)\/([^@]+)@(.+)$/);
  if (!match) return null;
  return {
    packageName: `@${match[1]}/${match[2]}`,
    version: match[3]
  };
}

function analyzePackageReleases(releases: Release[]): PackageStats[] {
  const packageMap = new Map<string, Release[]>();

  releases.forEach(release => {
    if (!release.published_at) return;
    const packageInfo = extractPackageInfo(release.tag_name);
    if (!packageInfo) return;

    const packageReleases = packageMap.get(packageInfo.packageName) || [];
    packageReleases.push(release);
    packageMap.set(packageInfo.packageName, packageReleases);
  });

  return Array.from(packageMap.entries()).map(([packageName, packageReleases]) => {
    const releaseDates = packageReleases.map(release => parseISO(release.published_at!));
    const weekendReleases = releaseDates.filter(date => isWeekend(date));
    const firstRelease = new Date(Math.min(...releaseDates.map(date => date.getTime())));
    const latestRelease = new Date(Math.max(...releaseDates.map(date => date.getTime())));
    const totalDays = differenceInDays(latestRelease, firstRelease);
    const businessDays = Math.floor(totalDays * 5 / 7);

    const now = new Date();
    const oneDayAgo = subDays(now, 1);
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);
    const oneYearAgo = subYears(now, 1);

    const lastDayReleases = releaseDates.filter(date => date >= oneDayAgo).length;
    const lastWeekReleases = releaseDates.filter(date => date >= oneWeekAgo).length;
    const lastMonthReleases = releaseDates.filter(date => date >= oneMonthAgo).length;
    const lastYearReleases = releaseDates.filter(date => date >= oneYearAgo).length;

    const latestVersion = packageReleases
      .sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime())[0]
      .tag_name.split('@').pop() || '';

    return {
      packageName,
      totalReleases: packageReleases.length,
      weekdayReleases: packageReleases.length - weekendReleases.length,
      weekendReleases: weekendReleases.length,
      weekendReleaseRatio: Number(((weekendReleases.length / packageReleases.length) * 100).toFixed(2)),
      latestVersion,
      firstReleaseDate: firstRelease.toISOString(),
      latestReleaseDate: latestRelease.toISOString(),
      releasePeriodDays: totalDays,
      businessDays,
      avgReleaseIntervalDays: Number((businessDays / packageReleases.length).toFixed(2)),
      prereleaseRatio: Number((packageReleases.filter(release => release.prerelease).length / packageReleases.length * 100).toFixed(2)),
      lastDayReleases: lastDayReleases,
      lastWeekReleases: lastWeekReleases,
      lastMonthReleases: lastMonthReleases,
      lastYearReleases: lastYearReleases
    };
  });
}

async function generateStats() {
  const repositories = [
    { owner: 'daangn', repo: 'seed-design' },
    { owner: 'daangn', repo: 'stackflow' }
  ];

  const allStats: ReleaseStats[] = [];
  const allPackageStats: PackageStats[] = [];
  const allRawReleases: RawRelease[] = [];

  for (const { owner, repo } of repositories) {
    const releases = await getAllReleases(owner, repo);
    allRawReleases.push(...releases.map(release => ({
      repository: `${owner}/${repo}`,
      release_id: release.id,
      release_tag: release.tag_name,
      release_name: release.name,
      release_notes: release.body || null,
      release_url: release.html_url,
      is_draft: release.draft,
      is_prerelease: release.prerelease,
      created_at: release.created_at,
      published_at: release.published_at,
      author_name: release.author?.login || null,
      author_url: release.author?.html_url || null,
      target_branch: release.target_commitish,
      download_count: release.assets.reduce((sum, asset) => sum + asset.download_count, 0),
      asset_count: release.assets.length
    })));
    
    const stats = calculateStats(releases);
    stats.repository = `${owner}/${repo}`;
    allStats.push(stats);

    const packageStats = analyzePackageReleases(releases);
    allPackageStats.push(...packageStats);
  }

  // 원본 릴리즈 데이터 CSV
  const rawReleasesWriter = createObjectCsvWriter({
    path: 'data/raw-releases.csv',
    header: [
      { id: 'repository', title: '저장소' },
      { id: 'release_id', title: '릴리즈 ID' },
      { id: 'release_tag', title: '릴리즈 태그' },
      { id: 'release_name', title: '릴리즈 이름' },
      { id: 'release_notes', title: '릴리즈 노트' },
      { id: 'release_url', title: '릴리즈 페이지 URL' },
      { id: 'is_draft', title: '초안 여부' },
      { id: 'is_prerelease', title: '프리릴리즈 여부' },
      { id: 'created_at', title: '생성일시' },
      { id: 'published_at', title: '발행일시' },
      { id: 'author_name', title: '작성자 이름' },
      { id: 'author_url', title: '작성자 프로필 URL' },
      { id: 'target_branch', title: '대상 브랜치' },
      { id: 'download_count', title: '다운로드 수' },
      { id: 'asset_count', title: '에셋 수' }
    ]
  });

  // 전체 릴리즈 통계 CSV (팀 모니터링 중심 구조)
  const releaseStatsWriter = createObjectCsvWriter({
    path: 'data/release-stats.csv',
    header: [
      { id: 'repository', title: '저장소' },
      { id: 'total_releases', title: '총 릴리즈 수' },
      { id: 'avgReleaseIntervalDays', title: '평균 릴리즈 주기(근무일 기준)' },
      { id: 'pre_release_ratio', title: '프리릴리즈 비율(%)' },
      { id: 'weekend_release_ratio', title: '주말 릴리즈 비율(%)' },

      { id: 'last_day_releases', title: '어제 릴리즈 수' },
      { id: 'last_week_releases', title: '지난주 릴리즈 수' },
      { id: 'last_month_releases', title: '지난달 릴리즈 수' },
      { id: 'last_year_releases', title: '지난해 릴리즈 수' },

      { id: 'latest_release_date', title: '최근 릴리즈 날짜' },
      { id: 'first_release_date', title: '첫 릴리즈 날짜' },
      { id: 'release_period_days', title: '릴리즈 기간(일)' },
      { id: 'business_days', title: '근무일 수' },

      { id: 'weekday_releases', title: '평일 릴리즈 수' },
      { id: 'weekend_releases', title: '주말 릴리즈 수' }
    ]
  });

  // 패키지별 통계 CSV (모니터링 중심 구조)
  const packageStatsWriter = createObjectCsvWriter({
    path: 'data/package-stats.csv',
    header: [
      { id: 'packageName', title: '패키지명' },
      { id: 'totalReleases', title: '총 릴리즈 수' },
      { id: 'avgReleaseIntervalDays', title: '평균 릴리즈 주기(근무일 기준)' },
      { id: 'prereleaseRatio', title: '프리릴리즈 비율(%)' },
      { id: 'weekendReleaseRatio', title: '주말 릴리즈 비율(%)' },

      { id: 'lastDayReleases', title: '어제 릴리즈 수' },
      { id: 'lastWeekReleases', title: '지난주 릴리즈 수' },
      { id: 'lastMonthReleases', title: '지난달 릴리즈 수' },
      { id: 'lastYearReleases', title: '지난해 릴리즈 수' },

      { id: 'latestVersion', title: '최신 버전' },
      { id: 'latestReleaseDate', title: '최근 릴리즈 날짜' },
      { id: 'firstReleaseDate', title: '첫 릴리즈 날짜' },
      { id: 'releasePeriodDays', title: '릴리즈 기간(일)' },
      { id: 'businessDays', title: '근무일 수' },

      { id: 'weekdayReleases', title: '평일 릴리즈 수' },
      { id: 'weekendReleases', title: '주말 릴리즈 수' }
    ]
  });

  await rawReleasesWriter.writeRecords(allRawReleases);
  await releaseStatsWriter.writeRecords(allStats);
  await packageStatsWriter.writeRecords(allPackageStats);
  console.log('CSV files have been written successfully');
}

generateStats().catch(console.error);