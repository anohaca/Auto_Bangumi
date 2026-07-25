(() => {
  const TAB_ID = 'autobangumi-native-settings-tab';
  const PANEL_ID = 'autobangumi-native-settings-panel';
  const TOKEN_KEY = 'autobangumi_access_token';
  const AB_ORIGIN = 'http://' + window.location.hostname + ':7893';
  let currentConfig = null;

  const t = {
    title: 'AutoBangumi \u8bbe\u7f6e',
    general: '\u5e38\u89c4\u8bbe\u7f6e',
    parser: 'RSS \u89e3\u6790',
    downloader: '\u4e0b\u8f7d\u5668',
    manage: '\u756a\u5267\u7ba1\u7406',
    notification: '\u901a\u77e5',
    proxy: '\u4ee3\u7406',
    rssTime: 'RSS \u95f4\u9694\uff08\u79d2\uff09',
    renameTime: '\u91cd\u547d\u540d\u95f4\u9694\uff08\u79d2\uff09',
    webuiPort: '\u7f51\u9875\u7aef\u53e3',
    debug: '\u8c03\u8bd5\u65e5\u5fd7',
    enable: '\u542f\u7528',
    language: '\u8bed\u8a00',
    filter: '\u6392\u9664\u89c4\u5219\uff08\u9017\u53f7\u5206\u9694\uff09',
    type: '\u7c7b\u578b',
    host: '\u5730\u5740',
    username: '\u7528\u6237\u540d',
    password: '\u5bc6\u7801',
    path: '\u4e0b\u8f7d\u8def\u5f84',
    ssl: '\u4f7f\u7528 SSL',
    renameMethod: '\u91cd\u547d\u540d\u65b9\u5f0f',
    epsComplete: '\u8865\u5168\u96c6\u6570',
    groupTag: '\u6dfb\u52a0\u5b57\u5e55\u7ec4\u6807\u7b7e',
    removeBad: '\u5220\u9664\u9519\u8bef\u79cd\u5b50',
    token: 'Token',
    chatId: 'Chat ID',
    port: '\u7aef\u53e3',
    save: '\u4fdd\u5b58\u5e76\u91cd\u542f AutoBangumi',
    loading: '\u6b63\u5728\u8bfb\u53d6 AutoBangumi \u8bbe\u7f6e...',
    ready: '\u5df2\u8fde\u63a5 AutoBangumi',
    saved: '\u5df2\u4fdd\u5b58\uff0cAutoBangumi \u6b63\u5728\u91cd\u542f',
    loginTitle: '\u8bf7\u5148\u767b\u5f55 AutoBangumi',
    login: '\u767b\u5f55\u5e76\u8bfb\u53d6\u8bbe\u7f6e',
    loginFailed: '\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u8d26\u53f7\u5bc6\u7801',
    offline: '\u65e0\u6cd5\u8fde\u63a5 AutoBangumi\uff0c\u8bf7\u786e\u8ba4 7893 \u7aef\u53e3\u53ef\u7528',
  };

  const groups = [
    {
      title: t.general,
      fields: [
        ['program.rss_time', t.rssTime, 'number'],
        ['program.rename_time', t.renameTime, 'number'],
        ['program.webui_port', t.webuiPort, 'number'],
        ['log.debug_enable', t.debug, 'checkbox'],
      ],
    },
    {
      title: t.parser,
      fields: [
        ['rss_parser.enable', t.enable, 'checkbox'],
        ['rss_parser.language', t.language, 'select', ['zh', 'en', 'jp']],
        ['rss_parser.filter', t.filter, 'list'],
      ],
    },
    {
      title: t.downloader,
      fields: [
        ['downloader.type', t.type, 'select', ['qbittorrent']],
        ['downloader.host', t.host, 'text'],
        ['downloader.username', t.username, 'text'],
        ['downloader.password', t.password, 'password'],
        ['downloader.path', t.path, 'text'],
        ['downloader.ssl', t.ssl, 'checkbox'],
      ],
    },
    {
      title: t.manage,
      fields: [
        ['bangumi_manage.enable', t.enable, 'checkbox'],
        [
          'bangumi_manage.rename_method',
          t.renameMethod,
          'select',
          ['normal', 'pn', 'advance', 'none'],
        ],
        ['bangumi_manage.eps_complete', t.epsComplete, 'checkbox'],
        ['bangumi_manage.group_tag', t.groupTag, 'checkbox'],
        ['bangumi_manage.remove_bad_torrent', t.removeBad, 'checkbox'],
      ],
    },
    {
      title: t.notification,
      fields: [
        ['notification.enable', t.enable, 'checkbox'],
        [
          'notification.type',
          t.type,
          'select',
          ['telegram', 'server-chan', 'bark', 'wecom'],
        ],
        ['notification.token', t.token, 'password'],
        ['notification.chat_id', t.chatId, 'text'],
      ],
    },
    {
      title: t.proxy,
      fields: [
        ['proxy.enable', t.enable, 'checkbox'],
        ['proxy.type', t.type, 'select', ['http', 'https', 'socks5']],
        ['proxy.host', t.host, 'text'],
        ['proxy.port', t.port, 'number'],
        ['proxy.username', t.username, 'text'],
        ['proxy.password', t.password, 'password'],
      ],
    },
  ];

  const panel = () => document.getElementById(PANEL_ID);
  const field = (path) =>
    panel()?.querySelector('[data-ab-path="' + path + '"]');
  const getValue = (object, path) =>
    path.split('.').reduce((value, key) => value?.[key], object);
  const setValue = (object, path, value) => {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((item, key) => item[key], object);
    target[last] = value;
  };

  const setStatus = (message, isError = false) => {
    const status = panel()?.querySelector('.ab-status');
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? '#f56c6c' : '#67c23a';
  };

  const showLogin = () => {
    if (!panel()) return;
    panel().querySelector('.ab-login').style.display = 'grid';
    panel().querySelector('.ab-settings').style.display = 'none';
    panel().querySelector('.ab-actions').style.display = 'none';
    setStatus(t.loginTitle, true);
  };

  const request = async (path, options = {}) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', 'Bearer ' + token);
    const response = await fetch(AB_ORIGIN + path, { ...options, headers });
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      showLogin();
      throw new Error('unauthorized');
    }
    if (!response.ok) throw new Error('http ' + response.status);
    return response;
  };

  const inputHtml = ([path, label, type, choices]) => {
    if (type === 'checkbox') {
      return (
        '<label class="ab-check"><input data-ab-path="' +
        path +
        '" type="checkbox"><span>' +
        label +
        '</span></label>'
      );
    }
    if (type === 'select') {
      return (
        '<label><span>' +
        label +
        '</span><select data-ab-path="' +
        path +
        '">' +
        choices
          .map((choice) => '<option value="' + choice + '">' + choice + '</option>')
          .join('') +
        '</select></label>'
      );
    }
    return (
      '<label><span>' +
      label +
      '</span><input data-ab-path="' +
      path +
      '" type="' +
      (type === 'list' ? 'text' : type) +
      '"></label>'
    );
  };

  const fillForm = (config) => {
    currentConfig = config;
    groups.flatMap((group) => group.fields).forEach(([path, , type]) => {
      const input = field(path);
      const value = getValue(config, path);
      if (type === 'checkbox') input.checked = Boolean(value);
      else if (type === 'list') input.value = (value || []).join(', ');
      else input.value = value ?? '';
    });
    panel().querySelector('.ab-login').style.display = 'none';
    panel().querySelector('.ab-settings').style.display = 'grid';
    panel().querySelector('.ab-actions').style.display = 'flex';
    setStatus(t.ready);
  };

  const loadConfig = async () => {
    setStatus(t.loading);
    try {
      const response = await request('/api/v1/config/get');
      fillForm(await response.json());
    } catch (error) {
      if (error.message !== 'unauthorized') setStatus(t.offline, true);
    }
  };

  const login = async () => {
    const body = new URLSearchParams({
      username: panel().querySelector('[name="ab_username"]').value,
      password: panel().querySelector('[name="ab_password"]').value,
    });
    try {
      const response = await fetch(AB_ORIGIN + '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!response.ok) throw new Error('login failed');
      const result = await response.json();
      if (!result.access_token) throw new Error('login failed');
      localStorage.setItem(TOKEN_KEY, result.access_token);
      panel().querySelector('[name="ab_password"]').value = '';
      await loadConfig();
      window.dispatchEvent(new Event('autobangumi:authenticated'));
    } catch {
      setStatus(t.loginFailed, true);
    }
  };

  const saveConfig = async () => {
    if (!currentConfig) return;
    const config = JSON.parse(JSON.stringify(currentConfig));
    groups.flatMap((group) => group.fields).forEach(([path, , type]) => {
      const input = field(path);
      let value = input.value;
      if (type === 'checkbox') value = input.checked;
      if (type === 'number') value = Number(value);
      if (type === 'list') {
        value = value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
      setValue(config, path, value);
    });
    try {
      await request('/api/v1/config/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setStatus(t.saved);
      window.setTimeout(() => {
        request('/api/v1/restart').catch(() => {});
      }, 300);
    } catch (error) {
      if (error.message !== 'unauthorized') setStatus(t.offline, true);
    }
  };

  const createPanel = (tabs) => {
    const element = document.createElement('div');
    element.id = PANEL_ID;
    element.style.cssText =
      'display:none;height:520px;overflow:auto;padding:12px 18px;box-sizing:border-box';
    element.innerHTML =
      '<h3 style="margin:4px 0 18px">' +
      t.title +
      '</h3><div class="ab-login" style="display:none">' +
      '<label><span>' +
      t.username +
      '</span><input name="ab_username" autocomplete="username"></label>' +
      '<label><span>' +
      t.password +
      '</span><input name="ab_password" type="password" autocomplete="current-password"></label>' +
      '<button class="el-button el-button--primary ab-login-button">' +
      t.login +
      '</button></div><div class="ab-settings">' +
      groups
        .map(
          (group) =>
            '<section><h4>' +
            group.title +
            '</h4><div class="ab-fields">' +
            group.fields.map(inputHtml).join('') +
            '</div></section>'
        )
        .join('') +
      '</div><div class="ab-actions" style="display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:22px">' +
      '<span class="ab-status" style="margin-right:auto"></span>' +
      '<button class="el-button el-button--primary ab-save">' +
      t.save +
      '</button></div>';

    const style = document.createElement('style');
    style.textContent =
      ':root{--ab-brand:#7c3aed;--ab-brand-light:#ede9fe;--ab-brand-border:#c4b5fd}' +
      '#' +
      TAB_ID +
      '.is-active{color:var(--ab-brand)!important}' +
      '#' +
      TAB_ID +
      '.is-active::after{background-color:var(--ab-brand)!important}' +
      '#' +
      PANEL_ID +
      ' .ab-settings{display:grid;grid-template-columns:repeat(2,minmax(300px,1fr));gap:16px}' +
      '#' +
      PANEL_ID +
      ' section{border:1px solid var(--el-border-color-lighter);border-radius:8px;padding:14px}' +
      '#' +
      PANEL_ID +
      ' h4{margin:0 0 14px;color:var(--el-text-color-primary)}' +
      '#' +
      PANEL_ID +
      ' .ab-fields,#' +
      PANEL_ID +
      ' .ab-login{display:grid;gap:12px}' +
      '#' +
      PANEL_ID +
      ' label{display:flex;align-items:center;justify-content:space-between;gap:14px;color:var(--el-text-color-regular)}' +
      '#' +
      PANEL_ID +
      ' input:not([type=checkbox]),#' +
      PANEL_ID +
      ' select{width:190px;height:32px;padding:0 9px;border:1px solid var(--el-border-color);border-radius:4px;background:var(--el-fill-color-blank);color:var(--el-text-color-primary);box-sizing:border-box}' +
      '#' +
      PANEL_ID +
      ' .ab-check{justify-content:flex-start}' +
      '#' +
      PANEL_ID +
      ' .ab-login-button{justify-self:end}' +
      '#' +
      PANEL_ID +
      ' .el-button--primary{--el-button-bg-color:var(--ab-brand);--el-button-border-color:var(--ab-brand);--el-button-hover-bg-color:#6d28d9;--el-button-hover-border-color:#6d28d9;--el-button-active-bg-color:#5b21b6;--el-button-active-border-color:#5b21b6}' +
      '@media(max-width:900px){#' +
      PANEL_ID +
      ' .ab-settings{grid-template-columns:1fr}}';
    document.head.appendChild(style);
    tabs.appendChild(element);
    element.querySelector('.ab-save').addEventListener('click', saveConfig);
    element.querySelector('.ab-login-button').addEventListener('click', login);
    return element;
  };

  const install = () => {
    if (document.getElementById(TAB_ID)) return;
    const settings = Array.from(document.querySelectorAll('.el-dialog')).find(
      (dialog) => {
        const title = dialog.querySelector('.el-dialog__title');
        return title && title.textContent.trim() === '\u8bbe\u7f6e';
      }
    );
    if (!settings) return;
    const tabs = settings.querySelector('.el-tabs');
    const nav = settings.querySelector('.el-tabs__nav');
    const content = settings.querySelector('.el-tabs__content');
    if (!tabs || !nav || !content) return;

    const tab = document.createElement('div');
    tab.id = TAB_ID;
    tab.className = 'el-tabs__item is-top';
    tab.setAttribute('role', 'tab');
    tab.textContent = 'AutoBangumi';
    nav.appendChild(tab);
    const nativePanel = createPanel(tabs);

    tab.addEventListener('click', () => {
      nav
        .querySelectorAll('.el-tabs__item')
        .forEach((item) => item.classList.toggle('is-active', item === tab));
      content.style.display = 'none';
      nativePanel.style.display = 'block';
      loadConfig();
    });
    nav.addEventListener('click', (event) => {
      if (event.target === tab || tab.contains(event.target)) return;
      tab.classList.remove('is-active');
      nativePanel.style.display = 'none';
      content.style.display = '';
    });
  };

  new MutationObserver(install).observe(document.body, {
    childList: true,
    subtree: true,
  });
  install();
})();

(() => {
  const AB_ORIGIN = 'http://' + window.location.hostname + ':7893';
  const TOKEN_KEY = 'autobangumi_access_token';
  const CACHE_KEY = 'autobangumi_ani_metadata_v3';
  const SOURCE_CLASS = 'ab-source-tag';
  let abRules = [];
  let aniItems = [];
  let mergeTimer = 0;
  let merging = false;
  let backgroundMerge = null;
  let backgroundSignature = "";
  const mergedDataCache = new Map();
  const sourceRegistry = new Map();
  const nativeFetch = window.fetch.bind(window);

  const text = {
    ani: 'ANI-RSS',
    ab: 'AutoBangumi',
    both: 'ANI-RSS + AutoBangumi',
    manage: 'AutoBangumi \u7ba1\u7406',
    add: 'AutoBangumi \u6dfb\u52a0\u8ba2\u9605',
    login: '\u8bf7\u5148\u5728\u8bbe\u7f6e\u4e2d\u767b\u5f55 AutoBangumi',
    loading: '\u6b63\u5728\u5408\u5e76 AutoBangumi \u756a\u5267...',
    noRules: '\u6682\u65e0 AutoBangumi \u756a\u5267',
    close: '\u5173\u95ed',
    edit: '\u7f16\u8f91',
    enable: '\u542f\u7528',
    disable: '\u7981\u7528',
    delete: '\u5220\u9664',
    save: '\u4fdd\u5b58',
    cancel: '\u53d6\u6d88',
    title: '\u756a\u5267\u540d',
    rawTitle: '\u539f\u59cb\u6807\u9898',
    season: '\u5b63',
    group: '\u5b57\u5e55\u7ec4',
    offset: '\u504f\u79fb',
    filter: '\u8fc7\u6ee4\uff08\u9017\u53f7\u5206\u9694\uff09',
    rss: 'RSS \u94fe\u63a5\uff08\u9017\u53f7\u5206\u9694\uff09',
    savePath: '\u4fdd\u5b58\u8def\u5f84',
    status: '\u72b6\u6001',
    source: '\u6765\u6e90',
    actions: '\u64cd\u4f5c',
    enabled: '\u5df2\u542f\u7528',
    disabled: '\u5df2\u7981\u7528',
    confirmDelete: '\u786e\u5b9a\u5220\u9664\u8fd9\u6761 AutoBangumi \u89c4\u5219\uff1f',
    rssUrl: 'RSS \u94fe\u63a5',
    rssName: 'RSS \u540d\u79f0',
    parser: '\u89e3\u6790\u5668',
    aggregate: '\u805a\u5408 RSS',
    analyse: '\u89e3\u6790',
    subscribe: '\u8ba2\u9605\u65b0\u756a',
    collect: '\u4e0b\u8f7d\u5408\u96c6',
    success: '\u64cd\u4f5c\u6210\u529f',
    failed: '\u64cd\u4f5c\u5931\u8d25',
  };

  const normalizeTitle = (value) =>
    String(value || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\[(?:tmdbid=)?\d+\]/g, '')
      .replace(/\((?:19|20)\d{2}\)/g, '')
      .replace(
        /(?:season|part|\u7b2c)\s*[0-9ivx]+\s*(?:\u5b63|\u90e8)?/gi,
        ''
      )
      .replace(
        /[\s\-_:~!,.'"\uFF1A\u00B7\u30FB\uFF5E\uFF01\uFF1F\uFF0C\u3002]/g,
        ''
      );

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const aliases = (item, isAni) => {
    const values = isAni
      ? [
          item.title,
          item.jpTitle,
          item.mikanTitle,
          item.themoviedbName,
          item.bgmName,
        ]
      : [item.official_title, item.title_raw, item.rule_name];
    return new Set(values.map(normalizeTitle).filter((value) => value.length > 1));
  };

  const subjectId = (item) => {
    const match = String(item?.bgmUrl || '').match(/subject\/(\d+)/);
    return match ? match[1] : '';
  };

  const sameTitle = (ani, ab, metadata) => {
    const aniSubject = subjectId(ani);
    if (metadata?.bgmId && aniSubject === String(metadata.bgmId)) return true;
    const seasonMatches =
      !ani.season ||
      !ab.season ||
      Number(ani.season) === Number(ab.season);
    if (!seasonMatches) return false;
    const left = aliases(ani, true);
    const right = new Set([
      ...aliases(ab, false),
      ...aliases(metadata || {}, true),
    ]);
    for (const value of left) {
      if (right.has(value)) return true;
    }
    return false;
  };

  const abRequest = async (path, options = {}) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error('unauthorized');
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', 'Bearer ' + token);
    const response = await fetch(AB_ORIGIN + path, { ...options, headers });
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      throw new Error('unauthorized');
    }
    if (!response.ok) throw new Error('http ' + response.status);
    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('json') ? response.json() : response.text();
  };

  const abPublicRequest = async (path) => {
    const response = await fetch(AB_ORIGIN + path);
    if (!response.ok) throw new Error('http ' + response.status);
    return response.json();
  };

  const aniRequest = async (path, body) => {
    const headers = {};
    const authorization = localStorage.getItem('authorization');
    if (authorization) headers.Authorization = authorization;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await Promise.race([
      fetch('/api/' + path, {
        method: 'POST',
        headers,
        body: body === undefined ? null : JSON.stringify(body),
      }),
      new Promise((_, reject) =>
        window.setTimeout(
          () => reject(new Error('ANI-RSS request timeout')),
          7000
        )
      ),
    ]);
    if (!response.ok) throw new Error('ANI-RSS http ' + response.status);
    const result = await response.json();
    if (result.code < 200 || result.code >= 300) {
      throw new Error(result.message || text.failed);
    }
    return result.data;
  };

  const aniRequestWithRetry = async (path, body) => {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await aniRequest(path, body);
      } catch (error) {
        lastError = error;
        if (attempt < 1) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, 700 * 2 ** attempt)
          );
        }
      }
    }
    throw lastError;
  };

  const notify = (message, error = false) => {
    let element = document.querySelector('.ab-integration-toast');
    if (!element) {
      element = document.createElement('div');
      element.className = 'ab-integration-toast';
      document.body.appendChild(element);
    }
    element.textContent = message;
    element.classList.toggle('is-error', error);
    element.classList.add('is-visible');
    window.clearTimeout(element._timer);
    element._timer = window.setTimeout(
      () => element.classList.remove('is-visible'),
      2600
    );
  };

  const loadCache = () => {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const saveCache = (cache) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  };

  const metadataKey = (rule) =>
    rule.id + ':' + normalizeTitle(rule.official_title || rule.title_raw);

  const scoreBgm = (candidate, rule) => {
    const ruleNames = aliases(rule, false);
    const names = [candidate.name, candidate.nameCn]
      .map(normalizeTitle)
      .filter(Boolean);
    let score = names.some((name) => ruleNames.has(name)) ? 100 : 0;
    for (const name of names) {
      for (const target of ruleNames) {
        if (name.includes(target) || target.includes(name)) score += 35;
      }
    }
    if (rule.year && String(candidate.date || '').startsWith(String(rule.year))) {
      score += 8;
    }
    if (rule.season && Number(candidate.season) === Number(rule.season)) {
      score += 8;
    }
    return score;
  };

  const queryMetadata = async (rule) => {
    const cache = loadCache();
    const key = metadataKey(rule);
    const cached = cache[key];
    const cacheLife = cached?.notFound ? 3600000 : 7 * 86400000;
    if (cached && Date.now() - cached.cachedAt < cacheLife) return cached;

    try {
      const queries = [
        rule.official_title,
        rule.title_raw,
        rule.rule_name,
      ].filter((value, index, array) => value && array.indexOf(value) === index);
      let candidate = null;
      let candidateScore = -1;
      for (const query of queries) {
        const candidates = await aniRequestWithRetry(
          'searchBgm?name=' + encodeURIComponent(query)
        );
        for (const item of Array.isArray(candidates) ? candidates : []) {
          const score = scoreBgm(item, rule);
          if (score > candidateScore) {
            candidate = item;
            candidateScore = score;
          }
        }
        if (candidateScore >= 100) break;
      }
      if (!candidate || candidateScore < 30) {
        throw new Error('not found');
      }
      const detail = await aniRequestWithRetry(
        'getAniBySubjectId?id=' + encodeURIComponent(candidate.id)
      );
      const date = detail?.releaseDate || candidate.date || '';
      const dateObject = date ? new Date(String(date).slice(0, 10) + 'T12:00:00') : null;
      const metadata = {
        ...detail,
        bgmId: candidate.id,
        bgmName: candidate.name,
        title: candidate.nameCn || detail?.title || candidate.name,
        jpTitle: candidate.name || detail?.jpTitle,
        season: detail?.season || candidate.season,
        score: detail?.score || candidate.rating?.score || 0,
        image:
          detail?.image ||
          candidate.images?.large ||
          candidate.images?.common ||
          candidate.images?.medium ||
          '',
        releaseDate: date,
        weekLabel:
          detail?.weekLabel ||
          (dateObject && !Number.isNaN(dateObject.getTime())
            ? [
                '\u661f\u671f\u65e5',
                '\u661f\u671f\u4e00',
                '\u661f\u671f\u4e8c',
                '\u661f\u671f\u4e09',
                '\u661f\u671f\u56db',
                '\u661f\u671f\u4e94',
                '\u661f\u671f\u516d',
              ][dateObject.getDay()]
            : ''),
        cachedAt: Date.now(),
      };
      const latest = loadCache();
      latest[key] = metadata;
      saveCache(latest);
      return metadata;
    } catch {
      const fallback = {
        title: rule.official_title,
        jpTitle: rule.title_raw,
        image: rule.poster_link || '',
        weekLabel: '\u672a\u77e5\u661f\u671f',
        notFound: true,
        cachedAt: Date.now(),
      };
      const latest = loadCache();
      latest[key] = fallback;
      saveCache(latest);
      return fallback;
    }
  };

  const mapConcurrent = async (items, limit, mapper) => {
    const results = new Array(items.length);
    let cursor = 0;
    const workers = Array.from(
      { length: Math.min(limit, items.length) },
      async () => {
        while (cursor < items.length) {
          const index = cursor++;
          results[index] = await mapper(items[index], index);
        }
      }
    );
    await Promise.all(workers);
    return results;
  };

  const posterUrl = (rule, metadata) => {
    const value = metadata.image || rule.poster_link || '';
    if (!value) return '';
    if (/^https?:\/\//.test(value)) return value;
    if (value.startsWith('/')) return AB_ORIGIN + value;
    return AB_ORIGIN + '/' + value;
  };

  const sourceTag = (source) => {
    const tag = document.createElement('span');
    tag.className =
      'el-tag el-tag--primary el-tag--small is-light ' +
      SOURCE_CLASS +
      (source.includes('AutoBangumi') ? ' ab-source-auto' : ' ab-source-ani');
    tag.textContent = source;
    tag.title = '\u6765\u6e90\uff1a' + source;
    return tag;
  };

  const addSourceToAniCard = (card, source, rule) => {
    const tags = card.querySelector('.list-card-tags');
    if (!tags) return;
    card.querySelector('.' + SOURCE_CLASS)?.remove();
    tags.appendChild(sourceTag(source));
    if (rule) {
      card.dataset.abRuleId = rule.id;
      addManageAction(card, rule);
    }
  };

  const button = (label, className, action) => {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'el-button is-text ' + (className || '');
    element.textContent = label;
    element.addEventListener('click', (event) => {
      event.stopPropagation();
      action();
    });
    return element;
  };

  const addManageAction = (card, rule) => {
    const actions = card.querySelector('.list-card-actions');
    if (!actions || actions.querySelector('.ab-card-manage')) return;
    if (card.dataset.abOnly === 'true') {
      actions.textContent = '';
    }
    const manageButton = button('AB', 'ab-card-manage', () => openRuleEditor(rule));
    manageButton.title = text.manage;
    actions.prepend(manageButton);
  };

  const syntheticAni = (rule, metadata, sort) => {
    const title = rule.official_title || metadata.title || rule.title_raw;
    const releaseDate = String(metadata.releaseDate || '').slice(0, 10);
    const bgmUrl = metadata.bgmId
      ? 'https://bgm.tv/subject/' + metadata.bgmId
      : '';
    return {
      sort,
      id: 'autobangumi-' + rule.id,
      mikanTitle: '',
      url: String(rule.rss_link || '').split(',')[0] || '',
      exists: true,
      standbyRssList: [],
      title,
      jpTitle: metadata.jpTitle || rule.title_raw || '',
      offset: Number(rule.offset || 0),
      releaseDate: releaseDate || '1970-01-01',
      year: Number(rule.year || 0),
      month: 0,
      date: 0,
      weekLabel: metadata.weekLabel || '\u672a\u77e5\u661f\u671f',
      season: Number(rule.season || metadata.season || 1),
      cover: '',
      image: metadata.image || '',
      subgroup: rule.group_name || '',
      match: [],
      exclude: String(rule.filter || '')
        .split(',')
        .filter(Boolean),
      globalExclude: false,
      ova: false,
      pinyin: title,
      pinyinInitials: title,
      enable: !rule.deleted,
      currentEpisodeNumber: Number(metadata.currentEpisodeNumber || 0),
      totalEpisodeNumber:
        metadata.totalEpisodeNumber == null
          ? null
          : Number(metadata.totalEpisodeNumber),
      themoviedbName: '',
      type: 'autobangumi',
      bgmUrl,
      customDownloadPath: Boolean(rule.save_path),
      customDownloadPathTemplate: rule.save_path || '',
      score: Number(metadata.score || metadata.rating?.score || 0),
      customEpisode: false,
      customEpisodeStr: '',
      customEpisodeGroupIndex: 0,
      omit: false,
      downloadNew: false,
      notDownload: [],
      tmdb: { id: '0', name: '', date: releaseDate || '1970-01-01' },
      upload: false,
      procrastinating: false,
      customRenameTemplateEnable: false,
      customRenameTemplate: '',
      lastDownloadTime: 0,
      message: false,
      customUploadEnable: false,
      customUploadPathTarget: '',
      completed: Boolean(rule.eps_collect),
      customCompleted: false,
      customCompletedPathTemplate: '',
      customTags: [],
      customTagsEnable: false,
      customPriorityKeywordsEnable: false,
      customPriorityKeywords: [],
      _abSource: text.ab,
      _abRuleId: rule.id,
    };
  };

  const sourceKey = (title, season) =>
    normalizeTitle(title) + '|' + Number(season || 1);

  const registerSource = (item, source, rule = null, metadata = null) => {
    for (const alias of aliases(item, true)) {
      sourceRegistry.set(sourceKey(alias, item.season), {
        source,
        rule,
        poster: rule ? posterUrl(rule, metadata || {}) : '',
        abOnly: source === text.ab,
      });
    }
  };

  const initializeNativeData = (data) => {
    sourceRegistry.clear();
    aniItems = data.weekList.flatMap((week) =>
      (week.items || []).map((item) => {
        item._abSource = text.ani;
        item.weekLabel ||= week.weekLabel;
        registerSource(item, text.ani);
        return item;
      })
    );
    data.total = aniItems.length;
    return data;
  };

  const mergeListData = async (data, onProgress) => {
    if (!data?.weekList) return data;
    initializeNativeData(data);
    try {
      const cachedResult = await abPublicRequest('/api/v1/integration/ani-rss');
      const cachedItems = Array.isArray(cachedResult?.items)
        ? cachedResult.items
        : [];
      abRules = cachedItems.map((entry) => entry.rule);
      let sort = Math.max(0, ...aniItems.map((item) => Number(item.sort || 0))) + 1;
      let unresolved = 0;
      const batchSize = 4;
      for (let offset = 0; offset < cachedItems.length; offset += batchSize) {
        const batch = cachedItems.slice(offset, offset + batchSize);
        const resolvedRules = batch.map((entry) => {
          const rule = entry.rule;
          const directMatch = aniItems.find((item) => sameTitle(item, rule));
          return {
            rule,
            metadata: entry.metadata || {},
            directMatch,
          };
        });
        for (const resolved of resolvedRules) {
          const { rule, metadata } = resolved;
          const match =
            resolved.directMatch ||
            aniItems.find((item) => sameTitle(item, rule, metadata));
          if (match) {
            match._abSource = text.both;
            match._abRuleId = rule.id;
            registerSource(match, text.both, rule, metadata);
            continue;
          }

          if (metadata.notFound || !metadata.weekLabel) {
            unresolved += 1;
            continue;
          }
          const item = syntheticAni(rule, metadata, sort++);
          let week = data.weekList.find(
            (entry) => entry.weekLabel === item.weekLabel
          );
          if (!week) {
            week = { weekLabel: item.weekLabel, items: [] };
            data.weekList.push(week);
          }
          week.items.push(item);
          aniItems.push(item);
          registerSource(item, text.ab, rule, metadata);
          const month = item.releaseDate.slice(0, 7);
          if (
            month !== '1970-01' &&
            Array.isArray(data.releaseDateList) &&
            !data.releaseDateList.includes(month)
          ) {
            data.releaseDateList.push(month);
          }
        }
        data.total = aniItems.length;
        if (onProgress && offset + batchSize < cachedItems.length) {
          onProgress(structuredClone(data));
        }
      }
      if (unresolved) {
        window.setTimeout(
          () =>
            notify(
              unresolved +
                ' \u90e8 AutoBangumi \u756a\u5267\u6682\u672a\u67e5\u5230\u661f\u671f\u8d44\u6599',
              true
            ),
          0
        );
      }
    } catch (error) {
      if (error.message !== 'unauthorized') {
        window.setTimeout(
          () => notify(text.failed + ': ' + error.message, true),
          0
        );
      }
    }
    return data;
  };

  const startBackgroundMerge = (data, signature) => {
    if (
      merging ||
      backgroundMerge ||
      mergedDataCache.has(signature)
    ) {
      return;
    }
    merging = true;
    backgroundSignature = signature;
    const publish = (merged) => {
      mergedDataCache.set(signature, structuredClone(merged));
      reloadMergedList(0);
    };
    backgroundMerge = mergeListData(structuredClone(data), publish)
      .then((merged) => {
        publish(merged);
      })
      .finally(() => {
        merging = false;
        backgroundMerge = null;
        backgroundSignature = "";
      });
  };

  window.fetch = async (input, options = {}) => {
    const response = await nativeFetch(input, options);
    const url =
      typeof input === 'string'
        ? new URL(input, window.location.href)
        : new URL(input.url, window.location.href);
    const method = String(options.method || input.method || 'GET').toUpperCase();
    if (url.origin !== window.location.origin || url.pathname !== '/api/listAni') {
      return response;
    }
    if (method !== 'POST' || !response.ok) return response;
    try {
      const result = await response.clone().json();
      if (result.code >= 200 && result.code < 300) {
        const signature =
          method + ':' + String(options.body || input.body || '');
        if (mergedDataCache.has(signature)) {
          result.data = structuredClone(mergedDataCache.get(signature));
        } else {
          result.data = initializeNativeData(result.data);
          startBackgroundMerge(result.data, signature);
        }
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        headers.delete('content-encoding');
        headers.set('content-type', 'application/json');
        return new Response(JSON.stringify(result), {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }
    } catch {
      return response;
    }
    return response;
  };

  const decorateCards = () => {
    document.querySelectorAll('.' + SOURCE_CLASS).forEach((element) => element.remove());
    document.querySelectorAll('.ab-card-manage').forEach((element) => element.remove());
    document.querySelectorAll('.grid-container .el-card').forEach((card) => {
      delete card.dataset.abRuleId;
      delete card.dataset.abOnly;
      const title = card.querySelector('.list-card-title')?.textContent;
      const seasonText =
        card.querySelector('.list-card-tags .el-tag')?.textContent || '';
      const season = Number(seasonText.match(/\d+/)?.[0] || 1);
      const key = sourceKey(title, season);
      const source = sourceRegistry.get(key);
      if (!source) return;
      if (source.abOnly) {
        card.dataset.abOnly = 'true';
        const image = card.querySelector('.list-card-image');
        if (image) {
          if (source.poster) image.src = source.poster;
          if (!image.dataset.abGuarded) {
            image.dataset.abGuarded = 'true';
            image.addEventListener(
              'click',
              (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (source.poster) window.open(source.poster, '_blank');
              },
              true
            );
          }
        }
        const score = card.querySelector('.list-card-score');
        if (score && !score.dataset.abGuarded) {
          score.dataset.abGuarded = 'true';
          score.addEventListener(
            'click',
            (event) => {
              event.preventDefault();
              event.stopImmediatePropagation();
            },
            true
          );
        }
      }
      addSourceToAniCard(card, source.source, source.rule);
    });
  };

  const reloadMergedList = (delay = 100) => {
    window.setTimeout(() => {
      if (typeof window.$reLoadList === 'function') window.$reLoadList();
      window.setTimeout(decorateCards, 700);
    }, delay);
  };

  const scheduleMerge = (delay = 300) => {
    window.clearTimeout(mergeTimer);
    mergeTimer = window.setTimeout(decorateCards, delay);
  };

  const modal = (title, body) => {
    const overlay = document.createElement('div');
    overlay.className = 'el-overlay ab-modal-overlay';
    overlay.innerHTML =
      '<div role="dialog" aria-modal="true" aria-label="' +
      title +
      '" class="el-overlay-dialog"><div class="el-dialog ab-modal">' +
      '<header class="el-dialog__header"><span class="el-dialog__title">' +
      title +
      '</span><button class="el-dialog__headerbtn" aria-label="' +
      text.close +
      '">\u00d7</button></header><div class="el-dialog__body"></div></div></div>';
    overlay.querySelector('.el-dialog__body').appendChild(body);
    const close = () => overlay.remove();
    overlay.querySelector('.el-dialog__headerbtn').addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    document.body.appendChild(overlay);
    return { overlay, close };
  };

  const formRow = (label, name, value, type = 'text') => {
    const row = document.createElement('label');
    row.className = 'ab-form-row';
    row.innerHTML =
      '<span>' +
      label +
      '</span><input name="' +
      name +
      '" type="' +
      type +
      '">';
    const input = row.querySelector('input');
    if (type === 'checkbox') input.checked = Boolean(value);
    else input.value = value ?? '';
    return row;
  };

  const openRuleEditor = (rule) => {
    const content = document.createElement('div');
    content.className = 'ab-rule-editor';
    [
      [text.title, 'official_title', rule.official_title],
      [text.rawTitle, 'title_raw', rule.title_raw],
      [text.season, 'season', rule.season, 'number'],
      [text.group, 'group_name', rule.group_name],
      [text.offset, 'offset', rule.offset, 'number'],
      [text.filter, 'filter', rule.filter],
      [text.rss, 'rss_link', rule.rss_link],
      [text.savePath, 'save_path', rule.save_path],
    ].forEach((args) => content.appendChild(formRow(...args)));
    const actions = document.createElement('div');
    actions.className = 'ab-modal-actions';
    const instance = modal(text.edit + ' AutoBangumi', content);
    actions.appendChild(
      button(text.cancel, '', () => instance.close())
    );
    actions.appendChild(
      button(text.save, 'el-button--primary', async () => {
        const updated = { ...rule };
        content.querySelectorAll('input').forEach((input) => {
          updated[input.name] =
            input.type === 'number' ? Number(input.value) : input.value;
        });
        const payload = { ...updated };
        delete payload.id;
        try {
          await abRequest('/api/v1/bangumi/update/' + rule.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          instance.close();
          notify(text.success);
          reloadMergedList(100);
        } catch (error) {
          notify(text.failed + ': ' + error.message, true);
        }
      })
    );
    content.appendChild(actions);
  };

  const openManage = async () => {
    const content = document.createElement('div');
    content.innerHTML = '<div class="ab-manage-loading">' + text.loading + '</div>';
    const instance = modal(text.manage, content);
    try {
      abRules = await abRequest('/api/v1/bangumi/get/all');
      content.textContent = '';
      const table = document.createElement('table');
      table.className = 'ab-manage-table';
      table.innerHTML =
        '<thead><tr><th>' +
        text.title +
        '</th><th>' +
        text.season +
        '</th><th>' +
        text.status +
        '</th><th>' +
        text.actions +
        '</th></tr></thead><tbody></tbody>';
      const tbody = table.querySelector('tbody');
      abRules.forEach((rule) => {
        const row = document.createElement('tr');
        row.innerHTML =
          '<td>' +
          escapeHtml(rule.official_title || rule.title_raw) +
          '</td><td>' +
          (rule.season || 1) +
          '</td><td>' +
          (rule.deleted ? text.disabled : text.enabled) +
          '</td><td class="ab-row-actions"></td>';
        const rowActions = row.querySelector('.ab-row-actions');
        rowActions.appendChild(button(text.edit, '', () => openRuleEditor(rule)));
        rowActions.appendChild(
          button(rule.deleted ? text.enable : text.disable, '', async () => {
            try {
              if (rule.deleted) {
                await abRequest('/api/v1/bangumi/enable/' + rule.id);
              } else {
                await abRequest(
                  '/api/v1/bangumi/disable/' + rule.id + '?file=false',
                  { method: 'DELETE' }
                );
              }
              instance.close();
              notify(text.success);
              reloadMergedList(100);
            } catch (error) {
              notify(text.failed + ': ' + error.message, true);
            }
          })
        );
        rowActions.appendChild(
          button(text.delete, 'el-button--danger', async () => {
            if (!window.confirm(text.confirmDelete)) return;
            try {
              await abRequest(
                '/api/v1/bangumi/delete/' + rule.id + '?file=false',
                { method: 'DELETE' }
              );
              row.remove();
              notify(text.success);
              reloadMergedList(100);
            } catch (error) {
              notify(text.failed + ': ' + error.message, true);
            }
          })
        );
        tbody.appendChild(row);
      });
      if (!abRules.length) content.textContent = text.noRules;
      else content.appendChild(table);
    } catch (error) {
      content.textContent =
        error.message === 'unauthorized' ? text.login : text.failed;
    }
  };

  const openAdd = () => {
    const content = document.createElement('div');
    content.className = 'ab-add-form';
    content.appendChild(formRow(text.rssUrl, 'url', ''));
    content.appendChild(formRow(text.rssName, 'name', ''));
    const parserRow = document.createElement('label');
    parserRow.className = 'ab-form-row';
    parserRow.innerHTML =
      '<span>' +
      text.parser +
      '</span><select name="parser"><option value="mikan">mikan</option>' +
      '<option value="tmdb">tmdb</option><option value="parser">parser</option></select>';
    content.appendChild(parserRow);
    content.appendChild(formRow(text.aggregate, 'aggregate', false, 'checkbox'));
    const preview = document.createElement('div');
    preview.className = 'ab-subscribe-preview';
    content.appendChild(preview);
    const actions = document.createElement('div');
    actions.className = 'ab-modal-actions';
    const instance = modal(text.add, content);
    actions.appendChild(
      button(text.cancel, '', () => instance.close())
    );
    actions.appendChild(
      button(text.analyse, 'el-button--primary', async () => {
        const rss = {
          id: 0,
          url: content.querySelector('[name="url"]').value.trim(),
          name: content.querySelector('[name="name"]').value.trim(),
          parser: content.querySelector('[name="parser"]').value,
          aggregate: content.querySelector('[name="aggregate"]').checked,
          enabled: true,
        };
        if (!rss.url) return;
        try {
          if (rss.aggregate) {
            await abRequest('/api/v1/rss/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(rss),
            });
            instance.close();
            notify(text.success);
            return;
          }
          const rule = await abRequest('/api/v1/rss/analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rss),
          });
          preview.textContent = '';
          [
            [text.title, 'official_title', rule.official_title],
            [text.rawTitle, 'title_raw', rule.title_raw],
            [text.season, 'season', rule.season, 'number'],
            [text.group, 'group_name', rule.group_name],
            [text.filter, 'filter', rule.filter],
            [text.savePath, 'save_path', rule.save_path],
          ].forEach((args) => preview.appendChild(formRow(...args)));
          const subscribeActions = document.createElement('div');
          subscribeActions.className = 'ab-modal-actions';
          const submit = async (path) => {
            preview.querySelectorAll('input').forEach((input) => {
              rule[input.name] =
                input.type === 'number' ? Number(input.value) : input.value;
            });
            const options = {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body:
                path === 'subscribe'
                  ? JSON.stringify({ data: rule, rss })
                  : JSON.stringify(rule),
            };
            await abRequest('/api/v1/rss/' + path, options);
            instance.close();
            notify(text.success);
            reloadMergedList(500);
          };
          subscribeActions.appendChild(
            button(text.collect, '', () =>
              submit('collect').catch((error) =>
                notify(text.failed + ': ' + error.message, true)
              )
            )
          );
          subscribeActions.appendChild(
            button(text.subscribe, 'el-button--primary', () =>
              submit('subscribe').catch((error) =>
                notify(text.failed + ': ' + error.message, true)
              )
            )
          );
          preview.appendChild(subscribeActions);
        } catch (error) {
          notify(text.failed + ': ' + error.message, true);
        }
      })
    );
    content.appendChild(actions);
  };

  const installToolbar = () => {
    const toolbar = document.querySelector('.add-button');
    if (!toolbar || toolbar.querySelector('.ab-manage-entry')) return;
    const wrapper = document.createElement('div');
    wrapper.style.margin = '0 4px';
    const manageButton = button('AB \u7ba1\u7406', 'ab-manage-entry', openManage);
    manageButton.title = text.manage;
    wrapper.appendChild(manageButton);
    const manageOriginal = Array.from(toolbar.querySelectorAll('button')).find(
      (item) => item.textContent.trim() === '\u7ba1\u7406'
    );
    toolbar.insertBefore(wrapper, manageOriginal?.parentElement || null);
  };

  const installAddMenu = () => {
    document.querySelectorAll('.el-dropdown-menu').forEach((menu) => {
      if (
        menu.querySelector('.ab-add-entry') ||
        !Array.from(menu.querySelectorAll('.el-dropdown-menu__item')).some(
          (item) => item.textContent.trim() === '\u6dfb\u52a0\u8ba2\u9605'
        )
      ) {
        return;
      }
      const item = document.createElement('li');
      item.className = 'el-dropdown-menu__item ab-add-entry';
      item.textContent = text.add;
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        openAdd();
      });
      menu.appendChild(item);
    });
  };

  const installStyles = () => {
    if (document.getElementById('autobangumi-integration-styles')) return;
    const style = document.createElement('style');
    style.id = 'autobangumi-integration-styles';
    style.textContent =
      '.' +
      SOURCE_CLASS +
      '{grid-column:1/-1;font-weight:600}' +
      '.ab-source-auto{color:#a78bfa!important}' +
      '.ab-card-manage,.ab-manage-entry{color:#7c3aed!important;font-weight:700}' +
      '.ab-modal .el-button--primary{--el-button-bg-color:#7c3aed;--el-button-border-color:#7c3aed;--el-button-hover-bg-color:#6d28d9;--el-button-hover-border-color:#6d28d9;--el-button-active-bg-color:#5b21b6;--el-button-active-border-color:#5b21b6}' +
      '.ab-integration-toast{position:fixed;z-index:99999;top:22px;left:50%;transform:translate(-50%,-20px);opacity:0;padding:10px 16px;border-radius:6px;background:#67c23a;color:#fff;transition:.2s;pointer-events:none}' +
      '.ab-integration-toast.is-visible{opacity:1;transform:translate(-50%,0)}' +
      '.ab-integration-toast.is-error{background:#f56c6c}' +
      '.ab-modal-overlay{z-index:2100;display:flex;align-items:center;justify-content:center}' +
      '.ab-modal-overlay .el-overlay-dialog{position:static;width:min(900px,92vw)}' +
      '.ab-modal{width:100%;margin:0;max-height:86vh;overflow:auto;background:var(--el-bg-color);border-radius:8px}' +
      '.ab-modal .el-dialog__header{display:flex;align-items:center;justify-content:space-between;padding:18px}' +
      '.ab-modal .el-dialog__headerbtn{position:static;width:32px;height:32px;border:0;background:transparent;color:var(--el-text-color-regular);font-size:24px;cursor:pointer}' +
      '.ab-modal .el-dialog__body{padding:0 18px 18px}' +
      '.ab-form-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:10px 0}' +
      '.ab-form-row input:not([type=checkbox]),.ab-form-row select{width:min(480px,60vw);height:34px;padding:0 9px;border:1px solid var(--el-border-color);border-radius:4px;background:var(--el-fill-color-blank);color:var(--el-text-color-primary);box-sizing:border-box}' +
      '.ab-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}' +
      '.ab-manage-table{width:100%;border-collapse:collapse}' +
      '.ab-manage-table th,.ab-manage-table td{padding:9px;border-bottom:1px solid var(--el-border-color-lighter);text-align:left}' +
      '.ab-row-actions{white-space:nowrap}' +
      '.ab-subscribe-preview{margin-top:14px;padding-top:8px;border-top:1px solid var(--el-border-color)}';
    document.head.appendChild(style);
  };

  const observer = new MutationObserver((records) => {
    installToolbar();
    installAddMenu();
    const listChanged = records.some((record) =>
      Array.from(record.addedNodes).some((node) => {
        if (!(node instanceof HTMLElement)) return false;
        if (
          node.matches(
            '.' + SOURCE_CLASS + ',.ab-modal-overlay'
          )
        ) {
          return false;
        }
        return (
          node.matches('.list-content,.grid-container') ||
          Boolean(node.querySelector('.list-card-content'))
        );
      })
    );
    if (listChanged) scheduleMerge(500);
  });

  installStyles();
  installToolbar();
  installAddMenu();
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('autobangumi:authenticated', () =>
    reloadMergedList(50)
  );
  window.addEventListener('focus', () => scheduleMerge(300));
  scheduleMerge(800);
})();
