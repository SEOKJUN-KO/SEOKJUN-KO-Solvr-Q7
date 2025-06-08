import { Octokit } from 'octokit';
import { createObjectCsvWriter } from 'csv-writer';
import { format, subYears, subWeeks, subDays, isWithinInterval } from 'date-fns';
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
  target_commitish: string;
}

interface CommitStats {
  feat: number;
  fix: number;
  docs: number;
  style: number;
  refactor: number;
  test: number;
  chore: number;
  other: number;
  total: number;
}

interface ReleaseStats {
  repository: string;
  tag_name: string;
  name: string;
  published_at: string;
  author: string;
  is_prerelease: boolean;
  is_draft: boolean;
  release_url: string;
  assets_count: number;
  total_downloads: number;
  body_length: number;
  assets: string;
  commit_stats: CommitStats;
}

const octokit = new Octokit({
  auth: env.GITHUB_TOKEN,
});

const repositories = [
  { owner: 'daangn', repo: 'stackflow' },
  { owner: 'daangn', repo: 'seed-design' },
];

async function getCommitMessage(owner: string, repo: string, tagName: string): Promise<string[]> {
  try {
    // 1. 태그의 ref 정보 가져오기
    const refResponse = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `tags/${tagName}`,
    });
    const tagSha = refResponse.data.object.sha;

    // 2. 태그의 상세 정보 가져오기
    const tagResponse = await octokit.rest.git.getTag({
      owner,
      repo,
      tag_sha: tagSha,
    });
    const commitSha = tagResponse.data.object.sha;

    // 3. 커밋 정보 가져오기
    const commitResponse = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: commitSha,
    });

    return [commitResponse.data.commit.message];
  } catch (error) {
    console.error(`Error getting commit message for tag ${tagName}:`, error);
    return [];
  }
}

function analyzeCommitMessages(messages: string[]): CommitStats {
  const stats: CommitStats = {
    feat: 0,
    fix: 0,
    docs: 0,
    style: 0,
    refactor: 0,
    test: 0,
    chore: 0,
    other: 0,
    total: messages.length
  };

  const typePattern = /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:/i;

  messages.forEach(message => {
    const match = message.match(typePattern);
    if (match) {
      const type = match[1].toLowerCase();
      if (type in stats) {
        stats[type as keyof CommitStats]++;
      }
    } else {
      stats.other++;
    }
  });

  return stats;
}

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
      html_url: release.html_url,
      target_commitish: release.target_commitish
    })));
    page++;
  }

  return releases;
}

async function calculateStats(releases: Release[], owner: string, repo: string): Promise<ReleaseStats[]> {
  const stats: ReleaseStats[] = [];
  
  for (const release of releases) {
    if (!release.published_at) continue;

    const commitMessages = await getCommitMessage(owner, repo, release.tag_name);
    const commitStats = analyzeCommitMessages(commitMessages);

    stats.push({
      repository: release.name,
      tag_name: release.tag_name,
      name: release.name,
      published_at: release.published_at,
      author: release.author?.login || 'Unknown',
      is_prerelease: release.prerelease,
      is_draft: release.draft,
      release_url: release.html_url,
      assets_count: release.assets.length,
      total_downloads: release.assets.reduce((sum, asset) => sum + asset.download_count, 0),
      body_length: release.body?.length || 0,
      assets: release.assets.map(a => `${a.name}(${a.download_count} downloads)`).join('; '),
      commit_stats: commitStats
    });
  }

  return stats;
}

async function generateStats() {
  const allStats: ReleaseStats[] = [];

  for (const { owner, repo } of repositories) {
    console.log(`Fetching releases for ${owner}/${repo}...`);
    const releases = await getAllReleases(owner, repo);
    const stats = await calculateStats(releases, owner, repo);
    allStats.push(...stats);
  }

  const csvWriter = createObjectCsvWriter({
    path: 'data/release-stats.csv',
    header: [
      { id: 'repository', title: 'Repository' },
      { id: 'tag_name', title: 'Tag Name' },
      { id: 'name', title: 'Release Name' },
      { id: 'published_at', title: 'Published At' },
      { id: 'author', title: 'Author' },
      { id: 'is_prerelease', title: 'Is Pre-release' },
      { id: 'is_draft', title: 'Is Draft' },
      { id: 'release_url', title: 'Release URL' },
      { id: 'assets_count', title: 'Assets Count' },
      { id: 'total_downloads', title: 'Total Downloads' },
      { id: 'body_length', title: 'Release Notes Length' },
      { id: 'assets', title: 'Assets Details' },
      { id: 'commit_stats.feat', title: 'Feature Commits' },
      { id: 'commit_stats.fix', title: 'Fix Commits' },
      { id: 'commit_stats.docs', title: 'Docs Commits' },
      { id: 'commit_stats.style', title: 'Style Commits' },
      { id: 'commit_stats.refactor', title: 'Refactor Commits' },
      { id: 'commit_stats.test', title: 'Test Commits' },
      { id: 'commit_stats.chore', title: 'Chore Commits' },
      { id: 'commit_stats.other', title: 'Other Commits' },
      { id: 'commit_stats.total', title: 'Total Commits' }
    ],
  });

  await csvWriter.writeRecords(allStats);
  console.log('CSV file has been written successfully');
}

generateStats().catch(console.error); 