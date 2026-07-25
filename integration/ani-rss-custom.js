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
