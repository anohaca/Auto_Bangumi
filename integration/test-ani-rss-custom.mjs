import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(
  new URL('./ani-rss-custom.js', import.meta.url),
  'utf8'
);

const ani = (id, title, weekLabel) => ({
  sort: id,
  id: String(id),
  mikanTitle: '',
  url: `https://example.test/${id}`,
  standbyRssList: [],
  title,
  jpTitle: '',
  offset: 0,
  releaseDate: '2026-07-20',
  weekLabel,
  season: 1,
  cover: '',
  image: '',
  subgroup: 'Fixture',
  match: [],
  exclude: [],
  globalExclude: true,
  ova: false,
  pinyin: title,
  pinyinInitials: title,
  enable: true,
  currentEpisodeNumber: 1,
  totalEpisodeNumber: 12,
  themoviedbName: '',
  type: 'mikan',
  bgmUrl: '',
  score: 7,
  lastDownloadTime: 0,
});

const rules = [
  {
    id: 101,
    official_title: 'Shared Anime',
    title_raw: 'Shared Anime',
    year: '2026',
    season: 1,
    group_name: 'AB Group',
    eps_collect: false,
    offset: 0,
    filter: '720',
    rss_link: 'https://example.test/shared.xml',
    poster_link: 'posters/shared.jpg',
    added: true,
    rule_name: 'Shared Anime',
    save_path: '/downloads/Shared Anime',
    deleted: false,
  },
  {
    id: 102,
    official_title: 'AB Unique',
    title_raw: 'AB Unique',
    year: '2026',
    season: 1,
    group_name: 'AB Group',
    eps_collect: false,
    offset: 0,
    filter: '720',
    rss_link: 'https://example.test/unique.xml',
    poster_link: 'posters/unique.jpg',
    added: true,
    rule_name: 'AB Unique',
    save_path: '/downloads/AB Unique',
    deleted: false,
  },
];

const listResult = () => ({
  code: 200,
  message: 'success',
  data: {
    releaseDateList: ['2026-07'],
    weekList: [
      { weekLabel: '\u661f\u671f\u4e00', items: [ani(1, 'ANI Only', '\u661f\u671f\u4e00')] },
      { weekLabel: '\u661f\u671f\u4e8c', items: [ani(2, 'Shared Anime', '\u661f\u671f\u4e8c')] },
    ],
    total: 2,
  },
});

const run = async (withToken) => {
  const storage = new Map([
    ['authorization', 'ani-token'],
    ...(withToken ? [['autobangumi_access_token', 'ab-token']] : []),
  ]);
  const calls = [];
  const nativeFetch = async (input, options = {}) => {
    const url = new URL(
      typeof input === 'string' ? input : input.url,
      'http://127.0.0.1:7789/'
    );
    calls.push(`${options.method || 'GET'} ${url.pathname}${url.search}`);
    const json = (value) =>
      new Response(JSON.stringify(value), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    if (url.pathname === '/api/listAni') return json(listResult());
    if (url.pathname === '/api/v1/bangumi/get/all') return json(rules);
    if (url.pathname === '/api/searchBgm') {
      return json({
        code: 200,
        message: 'success',
        data: [
          {
            id: '999',
            name: 'AB Unique',
            nameCn: 'AB Unique',
            date: '2026-07-23',
            season: 1,
            images: { large: 'https://example.test/unique.jpg' },
            rating: { score: 8.2 },
          },
        ],
      });
    }
    if (url.pathname === '/api/getAniBySubjectId') {
      return json({
        code: 200,
        message: 'success',
        data: {
          title: 'AB Unique',
          jpTitle: 'AB Unique',
          releaseDate: '2026-07-23',
          season: 1,
          image: 'https://example.test/unique.jpg',
          score: 8.2,
        },
      });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  const document = {
    body: {},
    head: { appendChild() {} },
    getElementById() {
      return {};
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
  const window = {
    fetch: nativeFetch,
    location: {
      href: 'http://127.0.0.1:7789/',
      origin: 'http://127.0.0.1:7789',
      hostname: '127.0.0.1',
    },
    addEventListener() {},
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
  };
  const context = vm.createContext({
    window,
    document,
    localStorage: {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
      removeItem(key) {
        storage.delete(key);
      },
    },
    MutationObserver: class {
      observe() {}
    },
    HTMLElement: class {},
    Headers,
    Response,
    URL,
    URLSearchParams,
    Event,
    fetch: nativeFetch,
    console,
    structuredClone,
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
  });
  vm.runInContext(source, context);
  const response = await window.fetch('/api/listAni', { method: 'POST' });
  return { result: await response.json(), calls };
};

const authenticated = await run(true);
const weeks = authenticated.result.data.weekList;
const items = weeks.flatMap((week) => week.items);

assert.equal(authenticated.result.data.total, 3);
assert.deepEqual(
  items.map((item) => item.title).sort(),
  ['AB Unique', 'ANI Only', 'Shared Anime']
);
assert.equal(items.filter((item) => item.title === 'Shared Anime').length, 1);
assert.equal(
  items.find((item) => item.title === 'Shared Anime')._abSource,
  'ANI-RSS + AutoBangumi'
);
assert.equal(
  items.find((item) => item.title === 'ANI Only')._abSource,
  'ANI-RSS'
);

const unique = items.find((item) => item.title === 'AB Unique');
assert.equal(unique._abSource, 'AutoBangumi');
assert.equal(unique.id, 'autobangumi-102');
assert.equal(unique.weekLabel, '\u661f\u671f\u56db');
assert.equal(unique.score, 8.2);
assert.equal(Array.isArray(unique.standbyRssList), true);
assert.equal(
  weeks.find((week) => week.weekLabel === '\u661f\u671f\u56db').items[0].id,
  'autobangumi-102'
);
assert.equal(
  authenticated.calls.filter((call) => call.includes('/api/searchBgm')).length,
  1
);
assert.equal(
  authenticated.calls.some((call) => call.includes('/api/getAniBySubjectId')),
  true
);

const unauthenticated = await run(false);
const untouched = unauthenticated.result.data.weekList.flatMap(
  (week) => week.items
);
assert.equal(untouched.length, 2);
assert.equal(untouched.every((item) => item._abSource === 'ANI-RSS'), true);
assert.equal(
  unauthenticated.calls.some((call) =>
    call.includes('/api/v1/bangumi/get/all')
  ),
  false
);

console.log('ANI-RSS AutoBangumi merge tests passed');
