// ==UserScript==
// @name         Bilibili 稍后再看功能增强
// @namespace    watchlater-plus.bilibili.andiedie
// @author       Andiedie
// @license      MIT License
// @homepageURL  https://github.com/Andiedie/bilibili-watchlater-plus
// @include      /(.+.)?bilibili.com/
// @description  Bilibili 稍后再看功能增强
// @version      0.0.1
// @require      https://cdn.jsdelivr.net/npm/axios@0.18.0/dist/axios.min.js
// @require      https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js
// ==/UserScript==

(async function () {
  'use strict';
  // -----------------hint-----------------
  const _hint = document.createElement('div');
  _hint.classList.add('watch-later-hint');
  _hint.style.position = 'absolute';
  _hint.style.fontSize = '12px';
  _hint.style.color = '#fff';
  _hint.style.borderRadius = '4px';
  _hint.style.lineHeight = '18px';
  _hint.style.padding = '4px 8px';
  _hint.style.zIndex = '99999';
  _hint.style.backgroundColor = '#000';
  document.body.appendChild(_hint);
  function hideHint () {
    _hint.style.display = 'none';
  }
  function showHint (str, target) {
    _hint.innerText = str;
    _hint.style.display = 'block';
    target = $(target);
    _hint.style.top = (target.offset().top - 30) + 'px';
    _hint.style.left = (target.offset().left - $(_hint).width() / 2) + 'px';
  }
  // -----------------hint-----------------

  // -----------------Utils-----------------
  function replaceWatchLaterTrigger (root) {
    const list = $(root).find('.watch-later-trigger');
    list.each((_, ele) => {
      const href =
        $(ele).parents('a[data-target-url]').attr('data-target-url') ||
        $(ele).parents('a[href]').attr('href') ||
        $(ele).siblings('a[href]').attr('href');
      const aid = /av(\d+)/.exec(href)[1];
      const clone = createWatchLaterTrigger(aid);
      ele.replaceWith(clone);
    });
  }
  function replaceIWatchLater (root) {
    const list = $(root).find('.i-watchlater');
    list.each((_, ele) => {
      const clone = ele.cloneNode();
      const href =
        $(ele).parents('a[href]').attr('href') ||
        $(ele).siblings('a[href]').attr('href');
      const aid = /av(\d+)/.exec(href)[1];
      clone.dataset.aid = aid;
      watchLaterList().then(list => {
        if (list.includes(aid)) {
          clone.classList.add('has-select');
          clone.dataset.added = true;
        }
      });
      clone.onmouseenter = (event) => {
        const target = event.currentTarget;
        if (target.dataset.added) {
          showHint('移除稍后再看+', target);
        } else {
          showHint('稍后再看+', target);
        }
      };
      clone.onmouseout = (_) => {
        hideHint();
      };
      clone.onclick = async (event) => {
        event.stopPropagation();
        event.preventDefault();
        const target = event.currentTarget;
        if (target.dataset.added) {
          await removeWatchLater(target.dataset.aid);
          target.removeAttribute('data-added');
          clone.classList.remove('has-select');
          showHint('稍后再看+', target);
        } else {
          await addWatchLater(target.dataset.aid);
          clone.dataset.added = true;
          clone.classList.add('has-select');
          showHint('移除稍后再看+', target);
        }
      };
      ele.replaceWith(clone);
    });
  }
  function handleEmptySpreadModule (root) {
    const selector = '.spread-module:not(:has(.watch-later-trigger))';
    const list = $(root).find(selector).addBack(selector);
    list.each((_, ele) => {
      const href = $(ele).find('a[href]').attr('href');
      const aid = /av(\d+)/.exec(href)[1];
      const clone = createWatchLaterTrigger(aid);
      $(ele).find('.pic').append(clone);
    });
  }
  function createWatchLaterTrigger (aid) {
    const clone = document.createElement('div');
    clone.className = 'watch-later-trigger w-later watch-later';
    clone.dataset.aid = aid;
    watchLaterList().then(list => {
      if (list.includes(aid)) {
        clone.classList.add('added');
        clone.dataset.added = true;
      }
    });
    clone.onmouseenter = (event) => {
      const target = event.currentTarget;
      if (target.dataset.added) {
        showHint('移除稍后再看+', target);
      } else {
        showHint('稍后再看+', target);
      }
    };
    clone.onmouseout = (_) => {
      hideHint();
    };
    clone.onclick = async (event) => {
      event.stopPropagation();
      event.preventDefault();
      const target = event.currentTarget;
      if (target.dataset.added) {
        await removeWatchLater(target.dataset.aid);
        target.removeAttribute('data-added');
        clone.classList.remove('added');
        showHint('稍后再看+', target);
      } else {
        await addWatchLater(target.dataset.aid);
        clone.dataset.added = true;
        clone.classList.add('added');
        showHint('移除稍后再看+', target);
      }
    };
    return clone;
  }
  const watchLaterList = (function () {
    let promise;
    return function () {
      if (!promise) {
        promise = getWatchLaterList().then(list => list.map(one => one.aid.toString()));
      }
      return promise;
    };
  })();
  async function getWatchLaterList () {
    const { data: { data } } = await axios.get('https://api.bilibili.com/x/v2/history/toview/web', {
      params: {
        _: new Date().getTime()
      },
      withCredentials: true
    });
    return data.list;
  }
  async function addWatchLater (aid) {
    const csrf = document.cookie.match(/bili_jct=([a-zA-Z\d]+)/)[1];
    const { data } = await axios.post('https://api.bilibili.com/x/v2/history/toview/add', `aid=${aid}&csrf=${csrf}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      withCredentials: true
    });
    if (data.code !== 0) throw new Error(data.message);
  }
  async function removeWatchLater (aid) {
    const csrf = document.cookie.match(/bili_jct=([a-zA-Z\d]+)/)[1];
    const { data } = await axios.post('https://api.bilibili.com/x/v2/history/toview/del', `aid=${aid}&csrf=${csrf}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      withCredentials: true
    });
    if (data.code !== 0) throw new Error(data.message);
  }
  // -----------------Utils-----------------

  // -----------------Run Immediately-----------------
  hideHint();
  new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      for (const one of mutation.addedNodes) {
        replaceWatchLaterTrigger(one);
        replaceIWatchLater(one);
        handleEmptySpreadModule(one);
      }
    }
  }).observe(document.body, {
    childList: true,
    subtree: true
  });
  // t.bilibili.com/pages/nav/index
  // www.bilibili.com
  replaceWatchLaterTrigger(document.body);
  // space.bilibili.com
  replaceIWatchLater(document.body);
  // www.bilibili.com
  handleEmptySpreadModule(document.body);
  // -----------------Run Immediately-----------------
})();
