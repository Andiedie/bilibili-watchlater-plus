// ==UserScript==
// @name         Bilibili 稍后再看功能增强
// @namespace    watchlater-plus.bilibili.andiedie
// @author       Andiedie
// @license      MIT License
// @homepageURL  https://github.com/Andiedie/bilibili-watchlater-plus
// @include      https://*.bilibili.com/*
// @description  Bilibili 稍后再看功能增强
// @version      0.0.1
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/axios/0.18.0/axios.min.js
// ==/UserScript==

(async function () {
  'use strict';
  switch (location.hostname) {
    case 't.bilibili.com':
      const watchlaterList = await getWatchlaterList();
      const observer = new MutationObserver(syncTrends.bind(null, watchlaterList));
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
  }
  async function getWatchlaterList () {
    const { data: { data } } = await axios.get('https://api.bilibili.com/x/v2/history/toview/web', {
      params: {
        _: new Date().getTime()
      },
      withCredentials: true
    });
    return data.list.map(one => String(one.aid));
  }
  async function bangumiAid (link) {
    const { data } = await axios.get(link);
    const result = data.match(/"epInfo":{"aid":(\d+)/);
    if (result === null) {
      throw new Error(`Fail to get aid of bangumi ${link}`);
    }
    return result[1];
  }
  async function addToWatchlater (aid) {
    const regexpResult = document.cookie.match(/bili_jct=([a-zA-Z\d]+)/);
    const csrf = regexpResult ? regexpResult[1] : 'd50c29859648f986686804a9e46848a1';
    const { data } = await axios.post('https://api.bilibili.com/x/v2/history/toview/add', `aid=${aid}&csrf=${csrf}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      withCredentials: true
    });
    if (data.code !== 0) throw new Error(data.message);
  }
  async function removeFromWatchlater (aid) {
    const regexpResult = document.cookie.match(/bili_jct=([a-zA-Z\d]+)/);
    const csrf = regexpResult ? regexpResult[1] : 'd50c29859648f986686804a9e46848a1';
    const { data } = await axios.post('https://api.bilibili.com/x/v2/history/toview/del', `aid=${aid}&csrf=${csrf}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      withCredentials: true
    });
    if (data.code !== 0) throw new Error(data.message);
  }
  async function syncTrends (watchlaterList, mutationList) {
    for (const mutation of mutationList) {
      for (let node of mutation.addedNodes) {
        if (!node.className || !node.className.includes('d-data')) continue;
        node = node.querySelector('.preview > a');
        if (node === null) continue;
        const result = node.href.match(/(av|ep)(\d+)/);
        if (result === null) {
          console.error('Fail to get ep/aid', node);
          continue;
        }
        const type = result[1];
        if (type === 'av') {
          const aid = result[2];
          if (watchlaterList.includes(aid)) {
            const watchlaterBtn = node.querySelector('div.watch-later');
            watchlaterBtn.classList.add('added');
          }
        } else {
          const aid = await bangumiAid(node.href);
          console.log(aid);
          const added = watchlaterList.includes(aid);
          const watchLaterTrigger = document.createElement('div');
          watchLaterTrigger.classList.add('watch-later-trigger', 'watch-later');
          if (added) watchLaterTrigger.classList.add('added');
          const watchLaterHint = document.createElement('div');
          watchLaterHint.classList.add('watch-later-hint');
          watchLaterHint.textContent = added ? '移除' : '稍后再看';
          watchLaterTrigger.appendChild(watchLaterHint);
          watchLaterTrigger.onclick = async event => {
            event.stopPropagation();
            event.preventDefault();
            if (event.target.classList.contains('added')) {
              console.log('remove');
              await removeFromWatchlater(aid);
              watchLaterHint.textContent = '稍后再看';
              watchLaterTrigger.classList.remove('added');
            } else {
              console.log('add');
              await addToWatchlater(aid);
              watchLaterHint.textContent = '移除';
              watchLaterTrigger.classList.add('added');
            }
          };
          node.appendChild(watchLaterTrigger);
        }
      }
    }
  };
})();
