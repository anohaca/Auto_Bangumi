(() => {
  const TAB_ID = 'autobangumi-native-settings-tab';
  const PANEL_ID = 'autobangumi-native-settings-panel';
  const TOKEN_KEY = 'autobangumi_access_token';
  const AB_ORIGIN = 'http://' + window.location.hostname + ':7892';
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
    apiKey: 'API Key',
    apiKeyEnable: '\u4f7f\u7528 API Key',
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
    testNotification: '\u6d4b\u8bd5\u901a\u77e5',
    testingNotification: '\u6b63\u5728\u53d1\u9001\u6d4b\u8bd5\u901a\u77e5...',
    notificationSent: '\u6d4b\u8bd5\u901a\u77e5\u5df2\u53d1\u9001',
    notificationFailed: '\u6d4b\u8bd5\u901a\u77e5\u53d1\u9001\u5931\u8d25',
    loginTitle: '\u8bf7\u5148\u767b\u5f55 AutoBangumi',
    login: '\u767b\u5f55\u5e76\u8bfb\u53d6\u8bbe\u7f6e',
    loginFailed: '\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u8d26\u53f7\u5bc6\u7801',
    offline: '\u65e0\u6cd5\u8fde\u63a5 AutoBangumi\uff0c\u8bf7\u786e\u8ba4 7892 \u7aef\u53e3\u53ef\u7528',
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
        ['downloader.api_key_enable', t.apiKeyEnable, 'checkbox'],
        ['downloader.api_key', t.apiKey, 'password'],
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
    if (type === 'list') {
      return (
        '<label class="ab-settings-list-field"><span>' +
        label +
        '</span><div class="ab-settings-exclude" data-ab-path="' +
        path +
        '"></div></label>'
      );
    }
    return (
      '<label><span>' +
      label +
      '</span><input data-ab-path="' +
      path +
      '" type="' +
      type +
      '"></label>'
    );
  };

  const openSettingsExcludeAdder = (onAdd) => {
    const overlay = document.createElement('div');
    overlay.className = 'el-overlay ab-settings-exclude-overlay';
    overlay.innerHTML =
      '<div class="el-overlay-dialog"><div class="el-dialog">' +
      '<header class="el-dialog__header"><span class="el-dialog__title">' +
      '\u6dfb\u52a0\u6b63\u5219</span></header>' +
      '<div class="el-dialog__body"><label class="ab-settings-regex-row">' +
      '<span>\u6b63\u5219</span><div class="el-input"><div class="el-input__wrapper">' +
      '<input class="el-input__inner" placeholder="\u5982 720\u3001\u7b80\u3001\\\\d-\\\\d">' +
      '</div></div></label></div><footer class="el-dialog__footer">' +
      '<button class="el-button ab-regex-cancel">\u53d6\u6d88</button>' +
      '<button class="el-button el-button--primary ab-regex-add">\u6dfb\u52a0</button>' +
      '</footer></div></div>';
    const close = () => overlay.remove();
    const input = overlay.querySelector('input');
    const submit = () => {
      const pattern = input.value.trim();
      if (!pattern) return;
      onAdd(pattern);
      close();
    };
    overlay.querySelector('.ab-regex-cancel').addEventListener('click', close);
    overlay.querySelector('.ab-regex-add').addEventListener('click', submit);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submit();
    });
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    document.body.appendChild(overlay);
    input.focus();
  };

  const renderSettingsExclude = (editor, values) => {
    const items = values;
    editor.textContent = '';
    items.forEach((item, index) => {
      const tag = document.createElement('span');
      tag.className =
        'el-tag el-tag--primary el-tag--small is-light is-closable ab-settings-exclude-tag';
      const content = document.createElement('span');
      content.className = 'el-tag__content';
      content.textContent = item;
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'ab-settings-exclude-close';
      close.textContent = '\u00d7';
      close.addEventListener('click', () => {
        items.splice(index, 1);
        renderSettingsExclude(editor, items);
      });
      tag.append(content, close);
      editor.appendChild(tag);
    });
    const add = document.createElement('button');
    add.type = 'button';
    add.className =
      'el-button is-text is-has-bg el-button--small ab-settings-exclude-add';
    add.textContent = '+';
    add.title = '\u6dfb\u52a0\u6b63\u5219';
    add.addEventListener('click', () => {
      openSettingsExcludeAdder((pattern) => {
        if (!items.includes(pattern)) items.push(pattern);
        renderSettingsExclude(editor, items);
      });
    });
    editor.appendChild(add);
    if (items.length) {
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className =
        'el-button is-text is-has-bg el-button--small el-button--danger ab-settings-exclude-clear';
      clear.title = '\u6e05\u7a7a\u6392\u9664';
      clear.setAttribute('aria-label', '\u6e05\u7a7a\u6392\u9664');
      clear.innerHTML =
        '<span><i class="el-icon"><svg viewBox="0 0 1024 1024" aria-hidden="true">' +
        '<path fill="currentColor" d="M352 192V96h320v96h224v64H128v-64h224zm64 0h192v-32H416v32zm-192 128h576l-48 608H272l-48-608zm192 128v352h64V448h-64zm128 0v352h64V448h-64z"/></svg></i></span>';
      clear.addEventListener('click', () => {
        items.splice(0);
        renderSettingsExclude(editor, items);
      });
      editor.appendChild(clear);
    }
    editor._abItems = items;
  };

  const fillForm = (config) => {
    currentConfig = config;
    groups.flatMap((group) => group.fields).forEach(([path, , type]) => {
      const input = field(path);
      const value = getValue(config, path);
      if (type === 'checkbox') input.checked = Boolean(value);
      else if (type === 'list') {
        renderSettingsExclude(
          input,
          (value || []).map((item) => String(item).trim()).filter(Boolean)
        );
      }
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
        value = [...(input._abItems || [])];
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

  const testNotification = async () => {
    const button = panel()?.querySelector('.ab-test-notification');
    if (!button) return;
    const type = field('notification.type')?.value || '';
    const token = field('notification.token')?.value || '';
    const chatId = field('notification.chat_id')?.value || '';
    button.disabled = true;
    setStatus(t.testingNotification);
    try {
      const response = await request('/api/v1/config/notification/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enable: true,
          type,
          token,
          chat_id: chatId,
        }),
      });
      const result = await response.json();
      setStatus(result.msg_zh || t.notificationSent);
    } catch (error) {
      if (error.message !== 'unauthorized') {
        setStatus(t.notificationFailed, true);
      }
    } finally {
      button.disabled = false;
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
            (group.title === t.notification
              ? '<div class="ab-notification-test-row"><button type="button" class="el-button ab-test-notification">' +
                t.testNotification +
                '</button></div>'
              : '') +
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
      ' select{width:190px;height:32px;padding:0 9px;border:1px solid var(--el-border-color);border-radius:4px;background:var(--el-fill-color-blank);color:var(--el-text-color-primary);font-size:14px;box-sizing:border-box}' +
      '#' +
      PANEL_ID +
      ' .ab-check{justify-content:flex-start}' +
      '#' +
      PANEL_ID +
      ' .ab-settings-list-field{align-items:flex-start}' +
      '#' +
      PANEL_ID +
      ' .ab-settings-exclude{display:flex;align-items:center;justify-content:flex-start;flex-wrap:wrap;gap:6px;width:190px;min-height:32px}' +
      '#' +
      PANEL_ID +
      ' .ab-settings-exclude-tag{max-width:160px}' +
      '#' +
      PANEL_ID +
      ' .ab-settings-exclude-tag .el-tag__content{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '#' +
      PANEL_ID +
      ' .ab-settings-exclude-close{margin-left:5px;padding:0;border:0;background:transparent;color:inherit;font-size:15px;cursor:pointer}' +
      '#' +
      PANEL_ID +
      ' .ab-settings-exclude-add,#' +
      PANEL_ID +
      ' .ab-settings-exclude-clear{width:24px;height:24px;min-width:24px;padding:2px}' +
      '.ab-settings-exclude-overlay{z-index:2200;display:flex;align-items:center;justify-content:center}' +
      '.ab-settings-exclude-overlay .el-overlay-dialog{position:static;width:300px}' +
      '.ab-settings-exclude-overlay .el-dialog{width:100%;margin:0}' +
      '.ab-settings-exclude-overlay .el-dialog__header{padding:20px 20px 10px}' +
      '.ab-settings-exclude-overlay .el-dialog__body{padding:20px}' +
      '.ab-settings-exclude-overlay .el-dialog__footer{padding:10px 20px 20px}' +
      '.ab-settings-regex-row{display:flex;align-items:center;gap:12px}' +
      '.ab-settings-regex-row>span{flex:0 0 42px}' +
      '#' +
      PANEL_ID +
      ' .ab-login-button{justify-self:end}' +
      '#' +
      PANEL_ID +
      ' .ab-notification-test-row{display:flex;justify-content:flex-end}' +
      '#' +
      PANEL_ID +
      ' .el-button--primary{--el-button-bg-color:var(--ab-brand);--el-button-border-color:var(--ab-brand);--el-button-hover-bg-color:#6d28d9;--el-button-hover-border-color:#6d28d9;--el-button-active-bg-color:#5b21b6;--el-button-active-border-color:#5b21b6}' +
      '@media(max-width:900px){#' +
      PANEL_ID +
      ' .ab-settings{grid-template-columns:1fr}}';
    document.head.appendChild(style);
    tabs.appendChild(element);
    element.querySelector('.ab-save').addEventListener('click', saveConfig);
    element
      .querySelector('.ab-test-notification')
      .addEventListener('click', testNotification);
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
    tab.textContent = 'AB';
    const donationTab = Array.from(
      nav.querySelectorAll('.el-tabs__item')
    ).find((item) =>
      /(?:\u6350\u8d60|\u8d5e\u52a9|donat)/i.test(
        item.textContent.trim()
      )
    );
    if (donationTab?.parentElement === nav) {
      nav.insertBefore(tab, donationTab);
    } else {
      nav.appendChild(tab);
    }
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

  let installScheduled = false;
  const scheduleInstall = () => {
    if (installScheduled) return;
    installScheduled = true;
    window.requestAnimationFrame(() => {
      installScheduled = false;
      install();
    });
  };

  new MutationObserver(scheduleInstall).observe(document.body, {
    childList: true,
    subtree: true,
  });
  install();
})();

(() => {
  const AB_ORIGIN = 'http://' + window.location.hostname + ':7892';
  const TOKEN_KEY = 'autobangumi_access_token';
  const CACHE_KEY = 'autobangumi_ani_metadata_v3';
  const MINI_MODE_KEY = 'autobangumi_ani_mini_mode';
  const EMPTY_POSTER =
    'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  const SOURCE_CLASS = 'ab-source-tag';
  let abRules = [];
  let aniItems = [];
  let mergeTimer = 0;
  let merging = false;
  let backgroundMerge = null;
  let backgroundSignature = "";
  let abMetadataPromise = null;
  let abMetadataFetchedAt = 0;
  const mergedDataCache = new Map();
  const sourceRegistry = new Map();
  const nativeFetch = window.fetch.bind(window);

  const text = {
    ani: 'ANI-RSS',
    ab: 'AutoBangumi',
    both: 'ANI-RSS + AutoBangumi',
    add: 'AutoBangumi \u6dfb\u52a0\u8ba2\u9605',
    login: '\u8bf7\u5148\u5728\u8bbe\u7f6e\u4e2d\u767b\u5f55 AutoBangumi',
    loading: '\u6b63\u5728\u5408\u5e76 AutoBangumi \u756a\u5267...',
    close: '\u5173\u95ed',
    edit: '\u7f16\u8f91',
    delete: '\u5220\u9664',
    localEpisodes: '\u672c\u5730\u96c6\u6570',
    noLocalEpisodes: '\u6682\u65e0\u672c\u5730\u96c6\u6570',
    loadingLocalEpisodes: '\u6b63\u5728\u8bfb\u53d6\u672c\u5730\u96c6\u6570...',
    playbackUnavailable: 'AutoBangumi \u6682\u4e0d\u652f\u6301\u5728\u7ebf\u64ad\u653e',
    save: '\u4fdd\u5b58',
    cancel: '\u53d6\u6d88',
    title: '\u756a\u5267\u540d',
    rawTitle: '\u539f\u59cb\u6807\u9898',
    season: '\u5b63',
    group: '\u5b57\u5e55\u7ec4',
    offset: '\u504f\u79fb',
    filter: '\u6392\u9664',
    rss: 'RSS \u94fe\u63a5\uff08\u9017\u53f7\u5206\u9694\uff09',
    savePath: '\u4fdd\u5b58\u8def\u5f84',
    source: '\u6765\u6e90',
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

  const cleanCommaList = (value) =>
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(',');

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
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', 'Bearer ' + token);
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

  const getAbMetadata = (force = false) => {
    const fresh = Date.now() - abMetadataFetchedAt < 30000;
    if (!force && abMetadataPromise && fresh) return abMetadataPromise;
    abMetadataFetchedAt = Date.now();
    abMetadataPromise = abPublicRequest('/api/v1/integration/ani-rss').catch(
      (error) => {
        abMetadataPromise = null;
        abMetadataFetchedAt = 0;
        throw error;
      }
    );
    return abMetadataPromise;
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
    let tag = card.querySelector('.' + SOURCE_CLASS);
    if (!tag) {
      tag = sourceTag(source);
      tags.appendChild(tag);
    } else if (tag.textContent !== source) {
      tag.classList.toggle('ab-source-auto', source.includes('AutoBangumi'));
      tag.classList.toggle('ab-source-ani', !source.includes('AutoBangumi'));
      tag.textContent = source;
      tag.title = '\u6765\u6e90\uff1a' + source;
    }
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

  const nativeCardButton = (template, className, title, action) => {
    const element = template.cloneNode(true);
    element.classList.add('ab-card-action', className);
    element.title = title;
    element.setAttribute('aria-label', title);
    element.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        action();
      },
      true
    );
    return element;
  };

  const nativeCardSpacer = (template) => {
    const spacer = template
      ? template.cloneNode(false)
      : document.createElement('div');
    spacer.classList.add('list-card-spacer', 'ab-card-action-spacer');
    spacer.style.height = '5px';
    return spacer;
  };

  const deleteRule = async (rule) => {
    if (!window.confirm(text.confirmDelete)) return;
    try {
      await abRequest('/api/v1/bangumi/delete/' + rule.id + '?file=false', {
        method: 'DELETE',
      });
      notify(text.success);
      reloadMergedList(100);
    } catch (error) {
      notify(text.failed + ': ' + error.message, true);
    }
  };

  const formatBytes = (bytes) => {
    const value = Number(bytes || 0);
    if (!value) return '0 B';
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    const index = Math.min(
      Math.floor(Math.log(value) / Math.log(1024)),
      units.length - 1
    );
    return (value / 1024 ** index).toFixed(index >= 3 ? 2 : 1) + ' ' + units[index];
  };

  const formatLocalTime = (timestamp) => {
    const value = Number(timestamp || 0);
    if (!value) return '';
    const date = new Date(value * 1000);
    const pad = (part) => String(part).padStart(2, '0');
    return (
      pad(date.getMonth() + 1) +
      '-' +
      pad(date.getDate()) +
      ' ' +
      pad(date.getHours()) +
      ':' +
      pad(date.getMinutes()) +
      ':' +
      pad(date.getSeconds())
    );
  };

  const openLocalEpisodes = async (rule) => {
    const body = document.createElement('div');
    body.className = 'ab-local-content';
    body.textContent = text.loadingLocalEpisodes;
    const instance = modal(
      rule.official_title || rule.title_raw,
      body,
      'ab-local-episodes-modal'
    );
    const dialog = instance.overlay.querySelector('.el-dialog');
    dialog.classList.add('is-align-center', 'el-dialog--center');
    dialog.querySelector('.el-dialog__header')?.classList.add('show-close');
    try {
      const result = await abRequest('/api/v1/bangumi/local/' + rule.id);
      body.textContent = '';
      const items = Array.isArray(result.items) ? result.items : [];
      const scrollbar = document.createElement('div');
      scrollbar.className = 'el-scrollbar ab-local-scrollbar';
      const wrap = document.createElement('div');
      wrap.className = 'el-scrollbar__wrap el-scrollbar__wrap--hidden-default';
      const view = document.createElement('div');
      view.className = 'el-scrollbar__view';
      const grid = document.createElement('div');
      grid.className = 'grid-container ab-local-grid';
      view.appendChild(grid);
      wrap.appendChild(view);
      scrollbar.appendChild(wrap);
      body.appendChild(scrollbar);
      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'ab-local-empty';
        empty.textContent = text.noLocalEpisodes;
        grid.appendChild(empty);
      }
      items.forEach((item) => {
        const wrapper = document.createElement('div');
        const card = document.createElement('div');
        card.className = 'el-card is-never-shadow ab-local-card';
        const cardBody = document.createElement('div');
        cardBody.className = 'el-card__body';
        const row = document.createElement('div');
        row.className = 'grid-item ab-local-episode-row';
        const main = document.createElement('div');
        main.className = 'ab-local-episode-main';
        const label = document.createElement('span');
        label.className =
          'el-text is-line-clamp el-tooltip__trigger ab-local-episode-label';
        label.style.webkitLineClamp = '2';
        label.textContent = item.label || '';
        const br = document.createElement('br');
        const detail = document.createElement('span');
        detail.className =
          'el-text el-text--info el-text--small ab-local-episode-detail';
        detail.textContent =
          formatBytes(item.size) +
          (item.completedAt ? ' | ' + formatLocalTime(item.completedAt) : '');
        main.append(label, br, detail);
        const play = document.createElement('button');
        play.type = 'button';
        play.className =
          'el-button el-button--primary el-button--large is-circle is-text ab-local-play';
        play.title = text.playbackUnavailable;
        play.setAttribute('aria-label', text.playbackUnavailable);
        play.innerHTML =
          '<i class="el-icon"><svg viewBox="0 0 1024 1024" aria-hidden="true">' +
          '<path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 832a384 384 0 0 0 0-768 384 384 0 0 0 0 768m-48-247.616L668.608 512 464 375.616zm10.624-342.656 249.472 166.336a48 48 0 0 1 0 79.872L474.624 718.272A48 48 0 0 1 400 678.336V345.6a48 48 0 0 1 74.624-39.936z"/></svg></i>';
        play.addEventListener('click', () =>
          notify(text.playbackUnavailable, true)
        );
        row.append(main, play);
        row.title = item.name || '';
        cardBody.appendChild(row);
        card.appendChild(cardBody);
        wrapper.appendChild(card);
        grid.appendChild(wrapper);
      });
      const summary = document.createElement('p');
      summary.className = 'total-text ab-local-summary';
      summary.textContent = '\u5171 ' + items.length + ' \u9879';
      body.appendChild(summary);
    } catch (error) {
      body.textContent = text.failed + ': ' + error.message;
      body.classList.add('is-error');
    }
  };

  const addManageAction = (card, rule) => {
    const actions = card.querySelector('.list-card-actions');
    if (!actions || actions.querySelector('.ab-card-edit')) return;
    const nativeButtons = Array.from(actions.querySelectorAll('button'));
    if (nativeButtons.length < 2) return;
    const editTemplate = nativeButtons[nativeButtons.length - 2];
    const deleteTemplate = nativeButtons[nativeButtons.length - 1];
    const localTemplate = nativeButtons[0];
    const spacerTemplate = actions.querySelector('.list-card-spacer');
    const editButton = nativeCardButton(
      editTemplate,
      'ab-card-edit',
      text.edit + ' AutoBangumi',
      () => openRuleEditor(rule)
    );
    const deleteButton = nativeCardButton(
      deleteTemplate,
      'ab-card-delete',
      text.delete + ' AutoBangumi',
      () => deleteRule(rule)
    );
    const localButton = nativeCardButton(
      localTemplate,
      'ab-card-local',
      text.localEpisodes + ' AutoBangumi',
      () => openLocalEpisodes(rule)
    );
    if (card.dataset.abOnly === 'true') {
      actions.textContent = '';
    }
    if (card.dataset.abOnly === 'true') {
      actions.append(
        localButton,
        nativeCardSpacer(spacerTemplate),
        editButton,
        nativeCardSpacer(spacerTemplate),
        deleteButton
      );
      return;
    }
    actions.prepend(
      editButton,
      nativeCardSpacer(spacerTemplate),
      deleteButton,
      nativeCardSpacer(spacerTemplate)
    );
  };

  const syntheticAni = (rule, metadata, sort) => {
    const title = rule.official_title || metadata.title || rule.title_raw;
    const releaseDate = String(metadata.releaseDate || '').slice(0, 10);
    const poster = posterUrl(rule, metadata) || EMPTY_POSTER;
    const bgmUrl = metadata.bgmId
      ? 'https://bgm.tv/subject/' + metadata.bgmId
      : '';
    return {
      sort,
      id: 'autobangumi-' + rule.id,
      mikanTitle: '',
      url: cleanCommaList(rule.rss_link).split(',')[0] || '',
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
      cover: poster,
      image: poster,
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

  const hasAllEpisodes = (metadata) => {
    const current = Number(metadata?.currentEpisodeNumber || 0);
    const total = Number(metadata?.totalEpisodeNumber || 0);
    return current > 0 && total > 0 && current >= total;
  };

  const removeNativeMatch = (data, rule, metadata) => {
    for (const week of data.weekList) {
      week.items = (week.items || []).filter(
        (item) =>
          !sameTitle(item, rule) && !sameTitle(item, rule, metadata)
      );
    }
    aniItems = data.weekList.flatMap((week) => week.items || []);
  };

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
      const cachedResult = await getAbMetadata();
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
          if (hasAllEpisodes(metadata)) {
            removeNativeMatch(data, rule, metadata);
            continue;
          }
          const match =
            resolved.directMatch ||
            aniItems.find((item) => sameTitle(item, rule, metadata));
          if (match) {
            match.currentEpisodeNumber = Math.max(
              Number(match.currentEpisodeNumber || 0),
              Number(metadata.currentEpisodeNumber || 0)
            );
            if (
              Number(metadata.totalEpisodeNumber || 0) >
              Number(match.totalEpisodeNumber || 0)
            ) {
              match.totalEpisodeNumber = Number(metadata.totalEpisodeNumber);
            }
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
      reloadMergedList(0, true);
    };
    backgroundMerge = mergeListData(structuredClone(data))
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
    document.querySelectorAll('.grid-container .el-card').forEach((card) => {
      delete card.dataset.abRuleId;
      delete card.dataset.abOnly;
      const cardImage = card.querySelector('.list-card-image');
      if (cardImage?.complete && cardImage.naturalWidth > 0) {
        cardImage.classList.add('ab-image-ready');
      }
      card
        .querySelector('.list-card-title')
        ?.classList.remove('ab-title-ani', 'ab-title-auto', 'ab-title-both');
      const title = card.querySelector('.list-card-title')?.textContent;
      const seasonText =
        card.querySelector('.list-card-tags .el-tag')?.textContent || '';
      const season = Number(seasonText.match(/\d+/)?.[0] || 1);
      const key = sourceKey(title, season);
      const source = sourceRegistry.get(key);
      if (!source) {
        card.querySelector('.' + SOURCE_CLASS)?.remove();
        return;
      }
      const titleElement = card.querySelector('.list-card-title');
      if (titleElement) {
        titleElement.classList.add(
          source.source === text.ab
            ? 'ab-title-auto'
            : source.source === text.both
              ? 'ab-title-both'
              : 'ab-title-ani'
        );
      }
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

  const reloadMergedList = (delay = 100, silent = false) => {
    window.setTimeout(() => {
      if (silent) {
        document.body.classList.add('ab-silent-list-refresh');
        window.setTimeout(
          () => document.body.classList.remove('ab-silent-list-refresh'),
          1500
        );
      }
      if (typeof window.$reLoadList === 'function') window.$reLoadList();
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(decorateCards)
      );
    }, delay);
  };

  const scheduleMerge = (delay = 100) => {
    window.clearTimeout(mergeTimer);
    mergeTimer = window.setTimeout(decorateCards, delay);
  };

  const modal = (title, body, className = '') => {
    const overlay = document.createElement('div');
    overlay.className =
      'el-overlay ab-modal-overlay dialog-fade-enter-active' +
      (className ? ' ' + className : '');
    overlay.innerHTML =
      '<div role="dialog" aria-modal="true" aria-label="' +
      title +
      '" class="el-overlay-dialog"><div class="el-dialog ab-modal">' +
      '<header class="el-dialog__header"><span class="el-dialog__title">' +
      title +
      '</span><button class="el-dialog__headerbtn" aria-label="' +
      text.close +
      '"><i class="el-icon el-dialog__close"><svg viewBox="0 0 1024 1024" aria-hidden="true">' +
      '<path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a32 32 0 1 0-45.248 45.248L466.752 512 214.464 764.288a32 32 0 1 0 45.248 45.248L512 557.248l252.288 252.288a32 32 0 1 0 45.248-45.248L557.248 512l252.288-252.288a32 32 0 1 0-45.248-45.248z"/></svg></i>' +
      '</button></header><div class="el-dialog__body"></div></div></div>';
    overlay.querySelector('.el-dialog__body').appendChild(body);
    const close = () => {
      if (overlay.classList.contains('dialog-fade-leave-active')) return;
      overlay.classList.remove('dialog-fade-enter-active');
      overlay.classList.add('dialog-fade-leave-active');
      window.setTimeout(() => overlay.remove(), 300);
    };
    overlay.querySelector('.el-dialog__headerbtn').addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    document.body.appendChild(overlay);
    overlay.addEventListener(
      'animationend',
      () => overlay.classList.remove('dialog-fade-enter-active'),
      { once: true }
    );
    return { overlay, close };
  };

  const formRow = (label, name, value, type = 'text') => {
    const row = document.createElement('label');
    row.className = 'el-form-item ab-form-row';
    row.innerHTML =
      '<span class="el-form-item__label">' +
      label +
      '</span><div class="el-form-item__content"><div class="el-input">' +
      '<div class="el-input__wrapper"><input class="el-input__inner" name="' +
      name +
      '" type="' +
      type +
      '"></div></div></div>';
    const input = row.querySelector('input');
    if (type === 'checkbox') input.checked = Boolean(value);
    else input.value = value ?? '';
    return row;
  };

  const numberRow = (label, name, value, min = null) => {
    const row = document.createElement('label');
    row.className = 'el-form-item ab-form-row';
    row.innerHTML =
      '<span class="el-form-item__label">' +
      label +
      '</span><div class="el-form-item__content">' +
      '<div class="el-input-number ab-number-input">' +
      '<span role="button" aria-label="decrease number" class="el-input-number__decrease">' +
      '<i class="el-icon"><svg viewBox="0 0 1024 1024" aria-hidden="true">' +
      '<path fill="currentColor" d="M128 480h768v64H128z"/></svg></i></span>' +
      '<span role="button" aria-label="increase number" class="el-input-number__increase">' +
      '<i class="el-icon"><svg viewBox="0 0 1024 1024" aria-hidden="true">' +
      '<path fill="currentColor" d="M480 128h64v352h352v64H544v352h-64V544H128v-64h352z"/></svg></i></span>' +
      '<div class="el-input"><div class="el-input__wrapper" tabindex="-1">' +
      '<input class="el-input__inner" role="spinbutton" autocomplete="off" name="' +
      name +
      '" type="number"></div></div></div></div>';
    const input = row.querySelector('input');
    input.value = Number(value || 0);
    input.setAttribute('aria-valuenow', input.value);
    if (min != null) input.min = String(min);
    const update = (delta) => {
      const next = Number(input.value || 0) + delta;
      input.value = min == null ? next : Math.max(min, next);
      input.setAttribute('aria-valuenow', input.value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    row
      .querySelector('.el-input-number__decrease')
      .addEventListener('click', () => update(-1));
    row
      .querySelector('.el-input-number__increase')
      .addEventListener('click', () => update(1));
    return row;
  };

  const selectRow = (label, name, value, choices) => {
    const row = document.createElement('label');
    row.className = 'el-form-item ab-form-row';
    row.innerHTML =
      '<span class="el-form-item__label">' +
      label +
      '</span><div class="el-form-item__content"><select name="' +
      name +
      '">' +
      choices
        .map(
          (choice) =>
            '<option value="' + choice + '">' + choice + '</option>'
        )
        .join('') +
      '</select></div>';
    row.querySelector('select').value = value;
    return row;
  };

  const switchRow = (label, name, value) => {
    const row = document.createElement('div');
    row.className = 'el-form-item ab-form-row';
    row.innerHTML =
      '<span class="el-form-item__label">' +
      label +
      '</span><div class="el-form-item__content">' +
      '<label class="el-switch"><input class="el-switch__input" name="' +
      name +
      '" type="checkbox"><span class="el-switch__core">' +
      '<span class="el-switch__action"></span></span></label></div>';
    const input = row.querySelector('input');
    input.checked = Boolean(value);
    input.addEventListener('change', () =>
      input.closest('.el-switch')?.classList.toggle('is-checked', input.checked)
    );
    return row;
  };

  const rssGroupRow = (groupName, rssLink) => {
    const row = document.createElement('div');
    row.className = 'el-form-item ab-form-row ab-rss-group-row';
    row.innerHTML =
      '<span class="el-form-item__label">' +
      '\u4e3b RSS' +
      '</span>' +
      '<div class="el-form-item__content"><div class="ab-rss-group-content">' +
      '<div class="ab-rss-group-field"><span class="ab-inline-label">' +
      text.group +
      '</span><div class="el-input"><div class="el-input__wrapper">' +
      '<input class="el-input__inner" name="group_name" type="text">' +
      '</div></div></div>' +
      '<div class="ab-rss-url-field"><span class="ab-inline-label">RSS</span>' +
      '<div class="el-textarea"><textarea class="el-textarea__inner" ' +
      'name="rss_link" rows="2"></textarea></div></div>' +
      '</div></div>';
    row.querySelector('[name="group_name"]').value = groupName ?? '';
    row.querySelector('[name="rss_link"]').value = cleanCommaList(rssLink);
    row.querySelector('[name="group_name"]').placeholder =
      '\u672a\u77e5\u5b57\u5e55\u7ec4';
    row.querySelector('[name="rss_link"]').placeholder = 'https://';
    return row;
  };

  const filterRow = (value) => {
    const row = document.createElement('div');
    row.className = 'el-form-item ab-form-row';
    row.innerHTML =
      '<span class="el-form-item__label">' +
      text.filter +
      '</span><div class="el-form-item__content">' +
      '<div class="ab-exclude-editor"></div></div>';
    const editor = row.querySelector('.ab-exclude-editor');
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'filter';
    const items = String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const render = () => {
      editor.textContent = '';
      hidden.value = items.join(',');
      if (!items.length) {
        const empty = document.createElement('span');
        empty.className = 'el-tag el-tag--info el-tag--small is-light ab-exclude-tag';
        empty.textContent = '\u65e0';
        editor.appendChild(empty);
      }
      items.forEach((item, index) => {
        const tag = document.createElement('span');
        tag.className =
          'el-tag el-tag--primary el-tag--small is-light is-closable ab-exclude-tag';
        const label = document.createElement('span');
        label.className = 'el-tag__content';
        label.textContent = item;
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'ab-exclude-close';
        close.textContent = '\u00d7';
        close.setAttribute('aria-label', '\u5220\u9664 ' + item);
        close.addEventListener('click', () => {
          items.splice(index, 1);
          render();
        });
        tag.append(label, close);
        editor.appendChild(tag);
      });
      const add = button('+', 'ab-exclude-add is-has-bg', () => {
        const inputRow = formRow('\u6b63\u5219', 'pattern', '');
        inputRow.querySelector('input').placeholder =
          '\u5982 720\u3001\u7b80\u3001\\\\d-\\\\d';
        const actions = document.createElement('div');
        actions.className = 'el-dialog__footer ab-modal-actions';
        const instance = modal('\u6dfb\u52a0\u6b63\u5219', inputRow);
        const cancel = button(text.cancel, '', instance.close);
        const submit = button('\u6dfb\u52a0', 'el-button--primary', () => {
          const pattern = inputRow.querySelector('input').value.trim();
          if (!pattern) return;
          if (!items.includes(pattern)) items.push(pattern);
          instance.close();
          render();
        });
        cancel.classList.remove('is-text');
        submit.classList.remove('is-text');
        actions.append(cancel, submit);
        inputRow.appendChild(actions);
      });
      add.title = '\u6dfb\u52a0\u6b63\u5219';
      editor.appendChild(add);
      if (items.length) {
        const clear = button('', 'el-button--danger ab-exclude-clear is-has-bg', () => {
          items.splice(0);
          render();
        });
        clear.title = '\u6e05\u7a7a\u6392\u9664';
        clear.setAttribute('aria-label', '\u6e05\u7a7a\u6392\u9664');
        clear.innerHTML =
          '<span><i class="el-icon"><svg viewBox="0 0 1024 1024" aria-hidden="true">' +
          '<path fill="currentColor" d="M352 192V96h320v96h224v64H128v-64h224zm64 0h192v-32H416v32zm-192 128h576l-48 608H272l-48-608zm192 128v352h64V448h-64zm128 0v352h64V448h-64z"/></svg></i></span>';
        editor.appendChild(clear);
      }
      editor.appendChild(hidden);
    };
    render();
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
    ].forEach((args) => {
      let row;
      if (args[1] === 'filter') row = filterRow(args[2]);
      else if (args[1] === 'season') {
        row = numberRow(args[0], args[1], args[2], 0);
      } else if (args[1] === 'offset') {
        row = numberRow(args[0], args[1], args[2]);
      } else if (args[1] === 'group_name') {
        row = rssGroupRow(rule.group_name, rule.rss_link);
      } else if (args[1] === 'rss_link') {
        return;
      } else {
        row = formRow(...args);
      }
      content.appendChild(row);
    });
    const actions = document.createElement('div');
    actions.className = 'el-dialog__footer ab-modal-actions';
    const instance = modal(
      '\u4fee\u6539\u8ba2\u9605',
      content,
      'ab-rule-modal'
    );
    const cancelButton = button(text.cancel, '', () => instance.close());
    cancelButton.classList.add('is-has-bg');
    const saveButton = button('\u786e\u5b9a', 'el-button--primary', async () => {
        const updated = { ...rule };
        content.querySelectorAll('[name]').forEach((input) => {
          updated[input.name] =
            input.type === 'number' ? Number(input.value) : input.value;
        });
        updated.rss_link = cleanCommaList(updated.rss_link);
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
      });
    saveButton.classList.add('is-has-bg');
    actions.append(cancelButton, saveButton);
    content.appendChild(actions);
  };

  const openAdd = () => {
    const content = document.createElement('div');
    content.className = 'ab-add-form';
    content.appendChild(formRow(text.rssUrl, 'url', ''));
    content.appendChild(formRow(text.rssName, 'name', ''));
    content.appendChild(
      selectRow(text.parser, 'parser', 'mikan', ['mikan', 'tmdb', 'parser'])
    );
    content.appendChild(switchRow(text.aggregate, 'aggregate', false));
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
      item.tabIndex = -1;
      item.textContent = text.add;
      item.addEventListener('pointerenter', () => {
        menu
          .querySelectorAll('.el-dropdown-menu__item')
          .forEach((sibling) => {
            if (sibling === item) return;
            sibling.classList.remove('is-active', 'is-focus', 'is-hovering');
            sibling.blur?.();
          });
        item.focus({ preventScroll: true });
      });
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        openAdd();
      });
      menu.appendChild(item);
    });
  };

  const applyMiniMode = (enabled) => {
    document.body.classList.toggle('ab-mini-list', enabled);
    localStorage.setItem(MINI_MODE_KEY, enabled ? 'true' : 'false');
    const toggle = document.querySelector('.ab-mini-list-toggle');
    if (toggle) {
      const label = enabled
        ? '\u6062\u590d\u5361\u7247\u6a21\u5f0f'
        : '\u4ec5\u663e\u793a\u6d77\u62a5\u548c\u6807\u9898';
      toggle.title = label;
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      toggle.innerHTML = enabled
        ? '<span><i class="el-icon"><svg viewBox="0 0 1024 1024" aria-hidden="true"><path fill="currentColor" d="M128 160h768v704H128V160zm64 64v576h640V224H192zm64 96h256v224H256V320zm320 0h192v64H576v-64zm0 112h192v64H576v-64zm-320 176h512v64H256v-64z"/></svg></i></span>'
        : '<span><i class="el-icon"><svg viewBox="0 0 1024 1024" aria-hidden="true"><path fill="currentColor" d="M128 128h320v320H128V128zm448 0h320v320H576V128zM128 576h320v320H128V576zm448 0h320v320H576V576zM192 192v192h192V192H192zm448 0v192h192V192H640zM192 640v192h192V640H192zm448 0v192h192V640H640z"/></svg></i></span>';
    }
  };

  const installMiniToggle = () => {
    const toolbar = document.querySelector('.add-button');
    if (!toolbar || toolbar.querySelector('.ab-mini-list-toggle')) return;
    const template = toolbar.querySelector('button');
    if (!template) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'ab-mini-list-toggle-wrapper';
    const toggle = template.cloneNode(true);
    [
      'id',
      'aria-controls',
      'aria-describedby',
      'aria-expanded',
      'aria-haspopup',
    ].forEach((attribute) => toggle.removeAttribute(attribute));
    toggle.setAttribute('aria-pressed', 'false');
    toggle.classList.add('ab-mini-list-toggle');
    toggle.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        applyMiniMode(!document.body.classList.contains('ab-mini-list'));
      },
      true
    );
    wrapper.appendChild(toggle);
    toolbar.prepend(wrapper);
    applyMiniMode(localStorage.getItem(MINI_MODE_KEY) === 'true');
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
      '.ab-title-ani{color:#409eff!important}' +
      '.ab-title-auto{color:#a78bfa!important}' +
      '.ab-title-both{color:#e6a23c!important}' +
      '.ab-card-action{color:#7c3aed!important}' +
      '.ab-card-action .el-icon{font-size:16px}' +
      '.ab-card-delete{color:var(--el-color-danger)!important}' +
      '.ab-modal-overlay.ab-local-episodes-modal .el-overlay-dialog{width:min(824px,100vw)!important}' +
      '.ab-local-episodes-modal .ab-modal{box-sizing:border-box;width:100%;padding:16px;overflow:hidden}' +
      '.ab-local-episodes-modal .ab-modal .el-dialog__header{height:40px;padding:0 32px 16px;justify-content:center;text-align:center;box-sizing:border-box}' +
      '.ab-local-episodes-modal .ab-modal .el-dialog__headerbtn{top:4px;right:0}' +
      '.ab-local-episodes-modal .ab-modal .el-dialog__body{padding:0}' +
      '.ab-local-content{height:526px}' +
      '.ab-local-scrollbar{height:500px;overflow:hidden}' +
      '.ab-local-scrollbar>.el-scrollbar__wrap{height:100%;overflow:auto}' +
      '.ab-local-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;padding:0 5px}' +
      '.ab-local-grid>div{height:91px!important}' +
      '.ab-local-card{display:flex;height:91px;border:1px solid var(--el-border-color-lighter);border-radius:12px;background:var(--el-fill-color-light);box-sizing:border-box}' +
      '.ab-local-grid>div>.ab-local-card{height:91px!important}' +
      '.ab-local-card>.el-card__body{width:100%;padding:20px;box-sizing:border-box}' +
      '.ab-local-episode-row{display:flex;align-items:center;justify-content:space-between;height:45px;margin-bottom:4px}' +
      '.ab-local-episode-main{min-width:0}' +
      '.ab-local-episode-label{font-size:14px}' +
      '.ab-local-episode-detail{font-size:12px;color:var(--el-color-info)}' +
      '.ab-local-play{display:flex;width:40px;height:40px;flex:0 0 40px;align-items:center;justify-content:center;padding:12px;border-radius:50%}' +
      '.ab-local-summary{height:20px;margin:6px;text-align:end}' +
      '.ab-local-empty{grid-column:1/-1;padding:24px;text-align:center;color:var(--el-text-color-secondary)}' +
      '.ab-local-content.is-error{color:var(--el-color-danger)}' +
      '.ab-mini-list-toggle{color:#7c3aed!important}' +
      '.ab-mini-list-toggle-wrapper{display:flex;align-items:center}' +
      '.grid-container>div{height:100%}' +
      '.grid-container>div>.el-card{height:100%}' +
      '.grid-container>div>.el-card>.el-card__body{height:100%;box-sizing:border-box}' +
      '.grid-container>div .list-card-content{height:100%;box-sizing:border-box}' +
      '.ab-mini-list .grid-container{grid-template-columns:repeat(auto-fill,minmax(108px,1fr))!important;gap:10px!important}' +
      '.ab-mini-list .grid-container .el-card .el-card__body{padding:8px!important}' +
      '.ab-mini-list .list-card-content{display:flex!important;flex-direction:column!important;align-items:stretch!important}' +
      '.ab-mini-list .list-card-image-container{width:100%!important}' +
      '.ab-mini-list .list-card-image{display:block!important;width:100%!important;height:auto!important;aspect-ratio:2/3!important;object-fit:cover!important}' +
      '.list-card-image:not(.ab-image-ready){visibility:hidden!important}' +
      '.ab-mini-list .list-card-info{position:static!important;min-width:0!important}' +
      '.ab-mini-list .list-card-info-inner{margin:6px 0 0!important}' +
      '.ab-mini-list .list-card-info-inner>*:not(.flex){display:none!important}' +
      '.ab-mini-list .list-card-info-inner>.flex{display:block!important}' +
      '.ab-mini-list .list-card-title{display:block!important;width:100%!important;text-align:center!important;font-size:13px!important;line-height:1.4!important}' +
      '.ab-mini-list .list-card-actions{display:none!important}' +
      '.ab-silent-list-refresh .el-loading-mask{display:none!important}' +
      '.ab-modal .el-button--primary.is-text{--el-button-text-color:#7c3aed;--el-button-hover-text-color:#a78bfa;--el-button-active-text-color:#6d28d9;color:#7c3aed}' +
      '.ab-integration-toast{position:fixed;z-index:99999;top:22px;left:50%;transform:translate(-50%,-20px);opacity:0;padding:10px 16px;border-radius:6px;background:#67c23a;color:#fff;transition:.2s;pointer-events:none}' +
      '.ab-integration-toast.is-visible{opacity:1;transform:translate(-50%,0)}' +
      '.ab-integration-toast.is-error{background:#f56c6c}' +
      '.ab-modal-overlay{z-index:2100;display:flex;align-items:center;justify-content:center}' +
      '.ab-modal-overlay .el-overlay-dialog{position:static;width:min(620px,calc(100vw - 32px))}' +
      '.ab-rule-modal .el-overlay-dialog{width:min(800px,calc(100vw - 32px))}' +
      '.ab-modal{width:100%;margin:0;max-height:86vh;overflow:auto;background:var(--el-bg-color);border-radius:var(--el-border-radius-small)}' +
      '.ab-modal .el-dialog__header{position:relative;display:flex;align-items:center;justify-content:center;padding:20px 48px 10px;margin:0;text-align:center}' +
      '.ab-modal .el-dialog__headerbtn{position:absolute;top:14px;right:16px;width:32px;height:32px;border:0;background:transparent;color:var(--el-color-info);cursor:pointer}' +
      '.ab-modal .el-dialog__headerbtn .el-icon{font-size:16px}' +
      '.ab-modal .el-dialog__body{padding:20px}' +
      '.ab-rule-editor{padding:0 8px}' +
      '.ab-form-row{display:flex;align-items:flex-start;margin:0 0 18px}' +
      '.ab-form-row .el-form-item__label{width:104px;flex:0 0 104px;padding-right:16px;justify-content:flex-end;line-height:32px;box-sizing:border-box}' +
      '.ab-form-row .el-form-item__content{flex:1;min-width:0}' +
      '.ab-form-row .el-input{width:100%}' +
      '.ab-number-input{width:150px;margin-left:auto}' +
      '.ab-number-input .el-input__inner{text-align:center}' +
      '.ab-number-input .el-input-number__decrease,.ab-number-input .el-input-number__increase{display:flex;align-items:center;justify-content:center}' +
      '.ab-form-row .el-textarea{width:100%}' +
      '.ab-form-row .el-textarea__inner{min-height:54px;resize:vertical}' +
      '.ab-rss-group-content{display:flex;align-items:flex-start;gap:10px;width:100%;min-width:0}' +
      '.ab-rss-group-field{width:120px;flex:0 0 120px}' +
      '.ab-rss-url-field{flex:1;min-width:0}' +
      '.ab-inline-label{display:block;margin-bottom:6px;color:var(--el-text-color-regular);font-size:13px;line-height:20px}' +
      '.ab-rss-group-row .ab-inline-label{display:none}' +
      '.ab-rss-group-row .el-textarea__inner{min-height:32px;height:32px;resize:none;white-space:nowrap;overflow:hidden}' +
      '.ab-form-row select{width:100%;height:32px;padding:0 11px;border:1px solid var(--el-border-color);border-radius:var(--el-border-radius-base);background:var(--el-fill-color-blank);color:var(--el-text-color-primary);font-family:inherit;font-size:var(--el-font-size-base,14px);font-weight:400;line-height:32px;box-sizing:border-box}' +
      '.ab-exclude-editor{display:flex;align-items:center;flex-wrap:wrap;gap:8px;width:100%;min-height:32px}' +
      '.ab-exclude-tag{max-width:220px}' +
      '.ab-exclude-tag .el-tag__content{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.ab-exclude-close{display:inline-flex;align-items:center;justify-content:center;margin-left:6px;padding:0;border:0;background:transparent;color:inherit;font-size:16px;line-height:1;cursor:pointer}' +
      '.ab-exclude-add,.ab-exclude-clear{height:24px;min-width:24px;padding:2px 8px}' +
      '.ab-modal-actions{display:flex;justify-content:flex-end;gap:12px;padding:10px 0 0;margin-top:2px}' +
      '@media (max-width:520px){' +
      '.ab-modal-overlay .el-overlay-dialog{width:calc(100vw - 32px)}' +
      '.ab-modal .el-dialog__header{padding:18px 18px 8px}' +
      '.ab-modal .el-dialog__body{padding:18px 14px 20px}' +
      '.ab-rule-editor{padding:0}' +
      '.ab-form-row{margin-bottom:16px}' +
      '.ab-form-row .el-form-item__label{width:92px;flex-basis:92px;padding-right:12px;font-size:15px}' +
      '.ab-rss-group-content{gap:8px}' +
      '.ab-rss-group-field{width:86px;flex-basis:86px}' +
      '.ab-inline-label{font-size:12px}' +
      '.ab-number-input{width:150px}' +
      '.ab-exclude-editor{gap:6px}' +
      '.ab-exclude-tag{max-width:180px}' +
      '}' +
      '.ab-subscribe-preview{margin-top:14px;padding-top:8px;border-top:1px solid var(--el-border-color)}';
    document.head.appendChild(style);
  };

  let uiInstallScheduled = false;
  const scheduleUiInstall = () => {
    if (uiInstallScheduled) return;
    uiInstallScheduled = true;
    window.requestAnimationFrame(() => {
      uiInstallScheduled = false;
      installMiniToggle();
      installAddMenu();
    });
  };

  const observer = new MutationObserver((records) => {
    scheduleUiInstall();
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
    if (listChanged) scheduleMerge(80);
  });

  installStyles();
  installMiniToggle();
  installAddMenu();
  document.addEventListener?.(
    'load',
    (event) => {
      const image = event.target;
      if (
        image instanceof HTMLImageElement &&
        image.classList.contains('list-card-image')
      ) {
        image.classList.add('ab-image-ready');
      }
    },
    true
  );
  document.addEventListener?.(
    'error',
    (event) => {
      const image = event.target;
      if (
        image instanceof HTMLImageElement &&
        image.classList.contains('list-card-image') &&
        image.src !== EMPTY_POSTER
      ) {
        image.classList.remove('ab-image-ready');
        image.src = EMPTY_POSTER;
      }
    },
    true
  );
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('autobangumi:authenticated', () => {
    getAbMetadata(true).catch(() => {});
    reloadMergedList(50);
  });
  window.addEventListener('focus', () => scheduleMerge(100));
  getAbMetadata().catch(() => {});
  scheduleMerge(100);
})();
