

// console.log('exImgur HIIIIIIIIII')


// window.addEventListener('load', main)


function main() {
    const html = getHtmlString();
    const imgurConfigString = getImgurConfigString(html);

    if (imgurConfigString) {
        const imageData = getImageData(imgurConfigString);
        console.log('imageData: ', imageData)
    } else {
        console.log(`NO imgurConfigString`);
    }
}


function getHtmlString() {
    return document.documentElement.innerHTML;
}


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
