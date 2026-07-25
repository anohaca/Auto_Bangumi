(() => {
  const TAB_ID = 'autobangumi-native-settings-tab';
  const PANEL_ID = 'autobangumi-native-settings-panel';
  const TOKEN_KEY = 'autobangumi_access_token';
  const AB_ORIGIN = 'http://' + window.location.hostname + ':7893';
  let currentConfig = null;

  const text = {
    title: 'AutoBangumi \u5e38\u89c4\u8bbe\u7f6e',
    rssTime: 'RSS \u95f4\u9694',
    renameTime: '\u91cd\u547d\u540d\u95f4\u9694',
    webuiPort: '\u7f51\u9875\u7aef\u53e3',
    debug: '\u8c03\u8bd5\u65e5\u5fd7',
    save: '\u4fdd\u5b58\u5e76\u91cd\u542f AutoBangumi',
    loading: '\u6b63\u5728\u8bfb\u53d6 AutoBangumi \u8bbe\u7f6e...',
    ready: '\u5df2\u8fde\u63a5 AutoBangumi',
    saved: '\u5df2\u4fdd\u5b58\uff0cAutoBangumi \u6b63\u5728\u91cd\u542f',
    loginTitle: '\u8bf7\u5148\u767b\u5f55 AutoBangumi',
    username: '\u7528\u6237\u540d',
    password: '\u5bc6\u7801',
    login: '\u767b\u5f55\u5e76\u8bfb\u53d6\u8bbe\u7f6e',
    loginFailed: '\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u8d26\u53f7\u5bc6\u7801',
    offline: '\u65e0\u6cd5\u8fde\u63a5 AutoBangumi\uff0c\u8bf7\u786e\u8ba4 7893 \u7aef\u53e3\u53ef\u7528',
  };

  const panel = () => document.getElementById(PANEL_ID);
  const field = (name) => panel()?.querySelector('[name="' + name + '"]');

  const setStatus = (message, isError = false) => {
    const status = panel()?.querySelector('.ab-status');
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? '#f56c6c' : '#67c23a';
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

  const fillForm = (config) => {
    currentConfig = config;
    field('rss_time').value = config.program.rss_time;
    field('rename_time').value = config.program.rename_time;
    field('webui_port').value = config.program.webui_port;
    field('debug_enable').checked = config.log.debug_enable;
    panel().querySelector('.ab-login').style.display = 'none';
    panel().querySelector('.ab-fields').style.display = 'grid';
    panel().querySelector('.ab-actions').style.display = 'flex';
    setStatus(text.ready);
  };

  const loadConfig = async () => {
    setStatus(text.loading);
    try {
      const response = await request('/api/v1/config/get');
      fillForm(await response.json());
    } catch (error) {
      if (error.message !== 'unauthorized') setStatus(text.offline, true);
    }
  };

  const showLogin = () => {
    if (!panel()) return;
    panel().querySelector('.ab-login').style.display = 'grid';
    panel().querySelector('.ab-fields').style.display = 'none';
    panel().querySelector('.ab-actions').style.display = 'none';
    setStatus(text.loginTitle, true);
  };

  const login = async () => {
    const body = new URLSearchParams({
      username: field('username').value,
      password: field('password').value,
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
      field('password').value = '';
      await loadConfig();
    } catch {
      setStatus(text.loginFailed, true);
    }
  };

  const saveConfig = async () => {
    if (!currentConfig) return;
    const config = JSON.parse(JSON.stringify(currentConfig));
    config.program.rss_time = Number(field('rss_time').value);
    config.program.rename_time = Number(field('rename_time').value);
    config.program.webui_port = Number(field('webui_port').value);
    config.log.debug_enable = field('debug_enable').checked;
    try {
      await request('/api/v1/config/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setStatus(text.saved);
      window.setTimeout(() => {
        request('/api/v1/restart').catch(() => {});
      }, 300);
    } catch (error) {
      if (error.message !== 'unauthorized') setStatus(text.offline, true);
    }
  };

  const createPanel = (tabs) => {
    const element = document.createElement('div');
    element.id = PANEL_ID;
    element.style.cssText = 'display:none;height:500px;overflow:auto;padding:12px 18px;box-sizing:border-box';
    element.innerHTML =
      '<h3 style="margin:4px 0 18px">' + text.title + '</h3>' +
      '<div class="ab-login" style="display:none">' +
      '<label>' + text.username + '<input name="username" autocomplete="username"></label>' +
      '<label>' + text.password + '<input name="password" type="password" autocomplete="current-password"></label>' +
      '<button class="el-button el-button--primary ab-login-button">' + text.login + '</button></div>' +
      '<div class="ab-fields">' +
      '<label>' + text.rssTime + '<input name="rss_time" type="number" min="1"></label>' +
      '<label>' + text.renameTime + '<input name="rename_time" type="number" min="1"></label>' +
      '<label>' + text.webuiPort + '<input name="webui_port" type="number" min="1" max="65535"></label>' +
      '<label class="ab-checkbox"><input name="debug_enable" type="checkbox">' + text.debug + '</label></div>' +
      '<div class="ab-actions" style="display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:22px">' +
      '<span class="ab-status" style="margin-right:auto"></span>' +
      '<button class="el-button el-button--primary ab-save">' + text.save + '</button></div>';

    const style = document.createElement('style');
    style.textContent =
      '#' + PANEL_ID + ' .ab-fields,#' + PANEL_ID + ' .ab-login{grid-template-columns:repeat(2,minmax(220px,1fr));gap:18px}' +
      '#' + PANEL_ID + ' label{display:flex;align-items:center;justify-content:space-between;gap:16px;color:var(--el-text-color-regular)}' +
      '#' + PANEL_ID + ' input:not([type=checkbox]){width:180px;height:32px;padding:0 10px;border:1px solid var(--el-border-color);border-radius:4px;background:var(--el-fill-color-blank);color:var(--el-text-color-primary)}' +
      '#' + PANEL_ID + ' .ab-checkbox{justify-content:flex-start}' +
      '@media(max-width:800px){#' + PANEL_ID + ' .ab-fields,#' + PANEL_ID + ' .ab-login{grid-template-columns:1fr}}';
    document.head.appendChild(style);
    tabs.appendChild(element);
    element.querySelector('.ab-save').addEventListener('click', saveConfig);
    element.querySelector('.ab-login-button').addEventListener('click', login);
    return element;
  };

  const install = () => {
    if (document.getElementById(TAB_ID)) return;
    const settings = Array.from(document.querySelectorAll('.el-dialog')).find((dialog) => {
      const title = dialog.querySelector('.el-dialog__title');
      return title && title.textContent.trim() === '\u8bbe\u7f6e';
    });
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
      nav.querySelectorAll('.el-tabs__item').forEach((item) => item.classList.toggle('is-active', item === tab));
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

  new MutationObserver(install).observe(document.body, { childList: true, subtree: true });
  install();
})();
