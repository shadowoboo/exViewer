// control buttons
const ctrlBar = document.getElementById('ctrlBar');

const submitBtn = document.getElementById('submitBtn');
submitBtn.addEventListener('click', onclick);

const clearUrlBtn = document.getElementById('clearUrlBtn');
clearUrlBtn.addEventListener('click', clearUrl);

const zoomInput = document.getElementById('zoomInput');
zoomInput.addEventListener('change', widthChange);

const pagesLimitInput = document.getElementById('pagesLimitInput');


// loading Notice
const loadingBar = document.getElementById('loadingBar');

// debug message
const debugMsg = document.getElementById('debugMsg');
const debugMsgWrap = document.getElementById('debugMsgWrap');
const cleanDebugMsgBtn = document.getElementById('cleanDebugMsgBtn');
cleanDebugMsgBtn.addEventListener('click', cleanDebugMsg);

// image message
const imgMsg = document.getElementById('imgMsg');
const cleanImgMsgBtn = document.getElementById('cleanImgMsgBtn');
cleanImgMsgBtn.addEventListener('click', cleanImgMsg);

// page index
const pageIndexWrap = document.getElementById('pageIndexWrap');


// lazy loading
// const watcher = new IntersectionObserver(onEnterView)


function getImgurConfigString(text) {
    const reg = /(?<=widgetFactory.mergeConfig\('gallery', )(\{[\s\S]+?\})(?=\);)/;
    const matchResult = text.match(reg);
    const imgurConfigString = matchResult && matchResult.length > 0 ? matchResult[0] : '';
    return imgurConfigString;
}

function getImageData(imgurConfigString) {
    const reg = /(?<=image *: *)(\{.*\})(?= *,)/;
    const matchResult = imgurConfigString.match(reg);
    const imageString = matchResult && matchResult.length > 0 ? matchResult[0] : '';
    const imageObj = JSON.parse(imageString)
    // log(JSON.stringify(imageObj, null, '  '))
    return imageObj;
}

function getImgurPicDatasByUrl(url) {
    return fetch(url, {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7,la;q=0.6,zh-CN;q=0.5",
            "cache-control": "max-age=0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "cross-site",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1"
        },
        "referrerPolicy": "origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    })
        .catch(err => {
            console.log(err);
            logIssue(err);
            hideLoading();
        })
        .then(response => response.text())
        .then(text => getImgurConfigString(text))
        .then(imgurConfigString => getImageData(imgurConfigString))
        .catch(err => {
            console.log(err);
            logIssue(new Error(err));
            hideLoading();
        });
}

function onclick() {
    showLoading();
    const urlInput = document.getElementById('urlInput');
    const imgsWrap = document.getElementById('imgsWrap');
    console.log(`urlInput.value`, urlInput.value)
    getImgurPicDatasByUrl(urlInput.value)
        // .then(imageData =>{
        //     logImgMsg(imageData);
        //     return imageData;
        // })
        .then(imageData => imageData.album_images.images
            .map(imgInfo => imgInfo.url = `http://i.imgur.com/${imgInfo.hash}${imgInfo.ext}`)
            .map((imgUrl, index) => createTemplateByLoadMode(pagesLimitInput.checked, imgUrl, index))
        )
        // .then(imgsUrl => console.log('imgsUrl: ', imgsUrl))
        .then(imgsElementStrings => {
            // create HTML
            imgsWrap.innerHTML = imgsElementStrings.join('\n');

            // regist image lazy loading watcher
            if(pagesLimitInput.checked){
                const watcher = new IntersectionObserver(onEnterViews);
                const lazyImages = document.getElementsByClassName('isLazy');
                Array.from(lazyImages).forEach(lazyImage=>watcher.observe(lazyImage));
            }

            // blur control area
            ctrlBar.classList.add('opacity-1');
            debugMsgWrap.classList.add('opacity-1');
            pageIndexWrap.classList.add('opacity-1');
            hideLoading();
        })
        .catch(err => {
            logIssue(new Error(err));
            hideLoading();
        });

}

function widthChange(event) {
    const value = event.target.value;
    console.log('widthChange--value: ', value);

    const imgWraps = document.getElementsByClassName('imgWrap');
    console.log('widthChange--Array.from(imgWrap): ', Array.from(imgWraps));
    Array.from(imgWraps).forEach(imgWrap => {
        imgWrap.style.width = `${value}px`;
    })

    const currentWidthValue = document.getElementById('currentWidthValue');
    currentWidthValue.innerText = `${value} px`
}

function onEnterViews(entries, observer){
    const removeMockup = (event) => {
        const mockup = event.target.previousElementSibling;
        mockup.addEventListener('transitionend', mockup.remove);
        mockup.classList.remove('imgLoading');
        mockup.classList.add('fade-out');
    }
    const loadImg = (img) => {
        img.previousElementSibling.classList.add('imgLoading')
        img.setAttribute('src', img.dataset.src);
        img.classList.remove('isLazy');
        img.addEventListener('load', removeMockup)
    };
    return Array.from(entries)
    .filter(entry=>entry.isIntersecting)
    .forEach(entry=>{
        loadImg(entry.target);
        observer.unobserve(entry.target);
    })
}

function createTemplateByLoadMode(loadMode, imgUrl, index){
        return loadMode?
        `
        <div class="imgWrap" data-src="${imgUrl}" data-number="${index+1}">
            <div class="mockup">${index+1}</div>
            <img id="imgs_${index+1}" class="imgs isLazy" data-src="${imgUrl}" data-number="${index+1}">
        </div>
        `:
        `
        <div class="imgWrap" data-src="${imgUrl}" data-number="${index+1}">
            <img id="imgs_${index+1}" class="imgs" src="${imgUrl}" data-number="${index+1}">
        </div>
        `
}

function logIssue(err) {
    console.log(err);
    debugMsg.innerHTML +=
        `
        <h3>${err.name}</h3>
        <h5>${err.message}</h5>
        <pre>${err.stack}</pre>
        `
}

function cleanDebugMsg() {
    debugMsg.innerText = null;
}

function clearUrl(){
    const urlInput = document.getElementById('urlInput');
    urlInput.value = '';
}


function logImgMsg(imageData) {
    console.log(imageData);
    const datas = imageData.album_images.images;
    imgMsg.innerText = JSON.stringify(datas, null, '  ');
}

function cleanImgMsg() {
    imgMsg.innerText = null;
}

function showLoading(){
    return loadingBar.classList.remove('hidden');
}

function hideLoading(){
    return loadingBar.classList.add('hidden');
}

