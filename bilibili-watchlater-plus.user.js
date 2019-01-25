// ==UserScript==
// @name         Bilibili 稍后再看功能增强
// @namespace    watchlater-plus.bilibili.andiedie
// @author       Andiedie
// @license      MIT License
// @homepageURL  https://github.com/Andiedie/bilibili-watchlater-plus
// @include      /(.+.)?bilibili.com/
// @description  Bilibili 稍后再看功能增强
// @version      0.0.1
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/axios@0.18.0/dist/axios.min.js
// @require      https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/lodash@4.17.11/lodash.min.js
// ==/UserScript==

(async () => {
  'use strict';
  // -----------------Constant-----------------
  const BUTTON_CLASS_NAME = 'watch-later-plus';
  const CONTAINER_CLASS_NAME = 'watch-later-plus-container';
  const HINT_CLASS_NAME = 'watch-later-plus-hint';

  const DEBOUNCE_WAIT = 200;
  // const SKIP_TOKEN = 'data-watch-later-plus-skip';
  // -----------------Constant-----------------

  // -----------------Hint-----------------
  const _hint = document.createElement('div');
  _hint.className = HINT_CLASS_NAME;
  document.body.appendChild(_hint);
  function hideHint () {
    _hint.style.display = 'none';
  }
  function showHint (str, target) {
    _hint.innerText = str;
    target = $(target);
    _hint.style.top = (target.offset().top - 30) + 'px';
    _hint.style.left = (target.offset().left - $(_hint).width() / 2) + 'px';
    _hint.style.display = 'block';
  }
  // -----------------Hint-----------------

  // -----------------Utils-----------------
  // 替换首页、动态iframe
  const replaceIndex = _.debounce(() => {
    const list = $(`.watch-later-trigger`);
    if (list.length) {
      console.log('replaceIndex', list.length);
    }
    list.each((_, ele) => {
      const href =
        $(ele).parents('a[data-target-url]').attr('data-target-url') ||
        $(ele).parents('a[href]').attr('href') ||
        $(ele).siblings('a[href]').attr('href');
      const aid = /av(\d+)/.exec(href)[1];
      const clone = createWatchLater(aid, ele.parentElement);
      ele.replaceWith(clone);
    });
  }, DEBOUNCE_WAIT);

  // 处理首页番剧
  const handleIndexBangumi = _.debounce(() => {
    const list = $(`#bili_bangumi .spread-module:not(:has(.${BUTTON_CLASS_NAME}))`);
    if (list.length) {
      console.log('handleIndexBangumi', list.length);
    }
    list.each((_, ele) => {
      const href = $(ele).find('a[href]').attr('href');
      const aid = /av(\d+)/.exec(href)[1];
      const clone = createWatchLater(aid, ele);
      $(ele).find('.pic').append(clone);
    });
  }, DEBOUNCE_WAIT);

  // 处理动态iframe番剧
  const handleDynamicIframeBangumi = _.debounce(() => {
    const list = $(`.d-data>.preview>a:not(:has(.${BUTTON_CLASS_NAME}))`);
    if (list.length) {
      console.log('handleDynamicIframeBangumi', list.length);
    }
    list.each(async (_, ele) => {
      const href = ele.href;
      const epid = /ep(\d+)/.exec(href)[1];
      const aid = await epid2aid(epid);
      const clone = createWatchLater(aid, ele);
      ele.appendChild(clone);
    });
  }, DEBOUNCE_WAIT);

  // 替换空间
  const replaceSpace = _.debounce(() => {
    const list = $('span.i-watchlater');
    if (list.length) {
      console.log('replaceSpace', list.length);
    }
    list.each((_, ele) => {
      const href = $(ele).parents('a[href]').attr('href');
      if (href === 'javascript:;') {
        console.log('该视频已失效，跳过');
      } else {
        const aid = /av(\d+)/.exec(href)[1];
        const clone = createWatchLater(aid, ele.parentElement);
        ele.replaceWith(clone);
      }
    });
  }, DEBOUNCE_WAIT);

  // 替换动态首页
  const replaceDynamicIndex = _.debounce(() => {
    const list = $('.see-later');
    if (list.length) {
      console.log('replaceDynamicIndex', list.length);
    }
    list.each((_, ele) => {
      const href = $(ele).parents('a[href]').attr('href');
      const aid = /av(\d+)/.exec(href)[1];
      const clone = createWatchLater(aid, ele.parentElement);
      ele.replaceWith(clone);
    });
  }, DEBOUNCE_WAIT);

  // 处理动态首页番剧
  const handleDynamicIndexBangumi = _.debounce(function handleDynamicIndexBangumi () {
    const list = $(`.bangumi-container .image-area:not(:has(.${BUTTON_CLASS_NAME}))`);
    if (list.length) {
      console.log('handleDynamicIndexBangumi', list.length);
    }
    list.each(async (_, ele) => {
      const href = $(ele).parents('a[href]').attr('href');
      const epid = /ep(\d+)/.exec(href)[1];
      const aid = await epid2aid(epid);
      const clone = createWatchLater(aid, ele);
      ele.appendChild(clone);
    });
  }, DEBOUNCE_WAIT);

  const handlePlaying = _.debounce(() => {
    const result = /watchlater\/#\/av(\d+)/.exec(location.href);
    if (result) {
      location.href = `https://www.bilibili.com/video/av${result[1]}?watch-later-plus`;
    }
  }, DEBOUNCE_WAIT);

  function createWatchLater (aid, parent) {
    parent.classList.add(CONTAINER_CLASS_NAME);
    const clone = document.createElement('div');
    clone.className = BUTTON_CLASS_NAME;
    clone.dataset.aid = aid;
    watchLaterList().then(list => {
      if (list.includes(aid)) {
        clone.dataset.checked = true;
      }
    });
    clone.onmouseenter = (event) => {
      const target = event.currentTarget;
      if (target.dataset.checked) {
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
      if (target.dataset.checked) {
        await removeWatchLater(target.dataset.aid);
        target.removeAttribute('data-checked');
        showHint('稍后再看+', target);
      } else {
        await addWatchLater(target.dataset.aid);
        clone.dataset.checked = true;
        showHint('移除稍后再看+', target);
      }
    };
    return clone;
  }
  const watchLaterList = (() => {
    let promise;
    return () => {
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
  async function epid2aid (epid) {
    const { data } = await axios.get(`https://www.bilibili.com/bangumi/play/ep${epid}`);
    const initState = JSON.parse(/window.__INITIAL_STATE__=(.*?);/.exec(data)[1]);
    const aid = initState.epInfo.aid;
    return aid.toString();
  }
  function addStyle () {
    GM_addStyle(`
      .${BUTTON_CLASS_NAME} {
        width: 22px;
        height: 22px;
        position: absolute;
        right: 8px;
        bottom: 4px;
        opacity: 0;
        cursor: pointer;
        z-index: 99999;
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAABT0lEQVQ4je3VMYrCQBTG8b/DWASLNKJgJ1hY2sloZeF2gkeYW+wZvIVXsLBJY5UdtLJLk17EIghCwChukWRxFzSaaLdfMwm8/EgemTclgOl02gEmwAAoky8RsAA+tdbrUoJ+AVZO8G9CoCeJ39Sq1+sopbBtO5e23+8xxrDdbi1gIog/vxAKYNs2Sqn0diBIenoP9X2fIAgyccv66WZZZBXvdjtc18UYkwlfJxM+n8+/1pfBefMPPw4LEZcEQcBqteJ0Or0GrlartFotLpcLnucxm83YbDbFYSEE/X6f4XBIpVLhcDjgOA6u63I8HvPDaRqNBuPxmHa7DcS7cT6f36yXj8IAUkq63S7NZpPlcomUtx9/Ck5Tq9UYjUZ3a976u0UQz9OiCcMwvYwk8XHyYYxBKXU9+p5Grybg4m1Hk9Bar4Ee4JC0JWeixOhprdffE/1yRW/TLMYAAAAASUVORK5CYII=);
      }
      
      .${BUTTON_CLASS_NAME}[data-checked] {
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAABiklEQVQ4jbXVzyvDcRzH8efns1+JIRtbOSiKrMRBrZZC5IzcHJYTJyc1J464ubuY5MQ/oLSTNSHfIg5KyEmbzY/5sa++c/hOCtv47rvX8f2pR+/3u0+fjwAgfNoFLAH9gA1jUYEIECLoU0QOjQIVBsHveQECEr1Ts1By1pJEH9/s9EuM77RQbLIMKACG4QaHhYNBL7EBj3lwtU2yFXDT6rRil8Ic2C4F634XnbU24m8aY9F46bAUsNJdR1+9g6f3LKPROBfp99LhxY5aRhorULUs43sJlFQmfxO/FWMDHpQhL+3VXzdxps3JVEsVAJOHSSK3rwWbsP5WtAhorrSy09vAxH6CeoeFOV8NALPHKTZvnovMBoLwafZ7sc4uWfe76HE70HKnUsDy+SNzJ/dFUciziruMxvBunNXLNFLo6Mb1M/N/RCHPKgAyWpbpoyQHdxmaKi0snD3wYzQj8GfWrtL/4L5S1rdCLYOrSvTvxOxEJBBC/07MygsQkgR9ChAAtiltLWrOCBD0KR9smmovo1v+1QAAAABJRU5ErkJggg==);
      }

      .${CONTAINER_CLASS_NAME}:hover .${BUTTON_CLASS_NAME} {
        opacity: 1;
      }

      .${HINT_CLASS_NAME} {
        position: absolute;
        font-size: 12px;
        color: #fff;
        border-radius: 4px;
        line-height: 18px;
        padding: 4px 8px;
        z-index: 99999;
        background-color: #000;
      }
    `);
  }
  // -----------------Utils-----------------

  // -----------------Run Immediately-----------------
  addStyle();
  hideHint();
  new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      if (mutation.addedNodes.length) {
        replaceIndex();
        handleIndexBangumi();
        handleDynamicIframeBangumi();
        replaceSpace();
        replaceDynamicIndex();
        handleDynamicIndexBangumi();
        // replaceWatchLaterLink();
      }
    }
  }).observe(document.body, {
    childList: true,
    subtree: true
  });
  // t.bilibili.com/pages/nav/index
  // www.bilibili.com
  replaceIndex();
  // www.bilibili.com
  handleIndexBangumi();
  // t.bilibili.com/pages/nav/index
  handleDynamicIframeBangumi();
  // space.bilibili.com
  replaceSpace();
  // t.bilibili.com
  replaceDynamicIndex();
  handleDynamicIndexBangumi();
  // watchlater
  // replaceWatchLaterLink();
  if (location.href.includes('//www.bilibili.com/watchlater/#')) {
    console.log('added');
    handlePlaying();
    window.addEventListener('popstate', handlePlaying);
  }
  // -----------------Run Immediately-----------------
})();
