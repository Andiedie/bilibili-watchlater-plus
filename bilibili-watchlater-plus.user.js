// ==UserScript==
// @name         Bilibili 稍后再看功能增强
// @namespace    watchlater-plus.bilibili.andiedie
// @author       Andiedie
// @license      MIT License
// @homepageURL  https://github.com/Andiedie/bilibili-watchlater-plus
// @include      https://www.bilibili.com/
// @description  Bilibili 稍后再看功能增强
// @version      0.0.1
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/axios/0.18.0/axios.min.js
// ==/UserScript==

(async function () {
  'use strict';
  async function getWatchlaterList () {
    const { data: { data } } = await axios.get('https://api.bilibili.com/x/v2/history/toview/web', {
      params: {
        _: new Date().getTime()
      },
      withCredentials: true
    });
    return data.list.map(one => String(one.aid));
  }
  console.log(await getWatchlaterList());

  // window.addEventListener('load', async function () {
  //   this.console.log(this.window.top === this.window.self);
  //   switch (location.hostname) {
  //     case 't.bilibili.com':
  //       const watchlaterList = await getWatchlaterList();
  //       this.console.log(watchlaterList);
  //       const observer = new MutationObserver(syncTrends.bind(null, watchlaterList));
  //       observer.observe(document.querySelector('ul.dyn_list>span'), {
  //         childList: true
  //       });
  //       break;
  //   }
  // }, false);
  // async function getWatchlaterList () {
  //   const { data: { data } } = await axios.get('https://api.bilibili.com/x/v2/history/toview/web', {
  //     params: {
  //       _: new Date().getTime()
  //     },
  //     withCredentials: true
  //   });
  //   return data.list.map(one => String(one.aid));
  // }
  // async function syncTrends (watchlaterList, mutationList) {
  //   console.log('run');
  //   for (const mutation of mutationList) {
  //     for (const node of mutation.addedNodes) {
  //       const a = node.querySelector('.preview>a');
  //       if (a === null) continue;
  //       const result = a.href.match(/(av|ep)(\d+)/);
  //       if (result === null) {
  //         console.error('Fail to get aid', node);
  //         continue;
  //       }
  //       const aid = result[2];
  //       console.log(aid);
  //       if (watchlaterList.includes(aid)) {
  //         const watchlaterBtn = a.querySelector('div.watch-later');
  //         watchlaterBtn.classList.add('added');
  //       }
  //     }
  //   }
  // };
})();
