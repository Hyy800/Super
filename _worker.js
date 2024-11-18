const UID = "3648425794742788096";
const KEY = "G8Jxb2YtcONGmQwN7b5odg==";
const UUID = "BA9151A2-C3F9-4324-84C8-AF720DAA1387";
const Aes_IV = 'VXH2THdPBsHEp+TY';  // 需要转换为字节
const Aes_KEY = 'VXH2THdPBsHEp+TY'; // 需要转换为字节

// 解密函数，使用 Web Crypto API
async function decryptData(data) {
    try {
        const decodedData = atob(data);
        const dataBuffer = new Uint8Array(decodedData.split('').map(c => c.charCodeAt(0)));

        const keyBuffer = new TextEncoder().encode(Aes_KEY);
        const ivBuffer = new TextEncoder().encode(Aes_IV);

        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyBuffer, { name: 'AES-CBC' }, false, ['decrypt']
        );

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv: ivBuffer }, cryptoKey, dataBuffer
        );

        const decoder = new TextDecoder('utf-8');
        return decoder.decode(decryptedBuffer);
    } catch (e) {
        console.error("解密失败:", e);
        return null;
    }
}

// 从 GitHub 获取 shiju.txt 文件
async function readPoemFile() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/Hyy800/Quantumult-X/refs/heads/Nana/gs/shiju.txt');
        if (!response.ok) {
            console.error('文件加载失败:', response.status);
            return [];
        }
        const text = await response.text();
        return text.split('\n');
    } catch (error) {
        console.error('读取诗句文件失败:', error);
        return [];
    }
}

// 随机获取一句每日一言
async function getRandomQuote() {
    const quotes = await readPoemFile();
    if (quotes.length === 0) {
        return '无法加载每日一言。';
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
}

// 从 API 获取节点列表
async function fetchNodeList() {
    const url = "https://api.9527.click/v2/node/list/op";
    const headers = {
        'Accept': '*/*',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'User-Agent': 'International/3.3.36 (iPhone; iOS 16.5; Scale/3.00)',
        'Accept-Language': 'zh-Hant;q=1'
    };

    const data = {
        "d": "0",
        "key": KEY,
        "uid": parseInt(UID),
        "vercode": "1",
        "uuid": UUID
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error(`错误: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error("API 请求失败:", error);
        return null;
    }
}

// 生成 Trojan 链接
function generateTrojanLink(uid, host, tag) {
    return `trojan://${uid}@${host}:443?allowInsecure=1#${tag}`;
}

// 主函数，处理节点数据
async function processNodes() {
    const nodeData = await fetchNodeList();
    if (!nodeData || !nodeData.data) {
        return "获取节点数据失败.";
    }

    const renameMap = {
        "Tokyo": "🇯🇵日本-东京", "Seoul": "🇰🇷韩国-首尔", "Singapore": "🇸🇬狮城-加坡",
        "New York": "🇺🇸美国-纽约", "Ohio": "🇺🇸美国-俄亥俄", "Virginia": "🇺🇸美国-弗吉尼亚",
        "Oregon": "🇺🇸美国-俄勒冈", "Amsterdam": "🇳🇱荷兰-阿姆斯特丹", "Warsaw": "🇵🇱波兰-华沙",
        "Frankfurt": "🇩🇪德国-法兰克福", "Paris": "🇫🇷法国-巴黎", "London": "🇬🇧英国-伦敦",
        "Stockholm": "🇸🇪瑞典-斯德哥尔摩", "Mumbai": "🇮🇳印度-孟买", "Bangalore": "🇮🇳印度-班加罗尔",
        "Sao Paulo": "🇧🇷巴西-圣保罗", "Bangkok": "🇹🇭泰国-曼谷", "Riyadh": "🇸🇦沙特-利雅得",
        "Johannesburg": "🇿🇦南非-约翰内斯堡", "Prague": "🇨🇿捷克-布拉格", "Manama": "🇧🇭巴林-麦纳麦",
        "Toronto": "🇨🇦加拿大-多伦多", "Ireland": "🇮🇪爱尔兰", "Saint Peterburg": "🇷🇺俄罗斯-圣彼得堡",
        "Moscow": "🇷🇺俄罗斯-莫斯科", "Madrid": "🇪🇸西班牙-马德里", "Fujairah": "🇦🇪阿拉伯-富查伊拉",
        "Dubai": "🇦🇪阿拉伯-迪拜", "Ponte San Pietro": "🇮🇹意大利-蓬泰圣彼得罗", "Istanbul": "🇹🇷土耳其-伊斯坦布尔",
        "Kathmandu": "🇳🇵尼泊尔-加德满都", "Lagos": "🇳🇬尼日利亚-拉各斯", "Sydney": "🇦🇺澳大利亚-悉尼",
        "Riga": "🇱🇻拉脱维亚-里加", "Karachi": "🇵🇰巴基斯坦-卡拉奇", "Kuala Lumpur": "🇲🇾马来西亚-吉隆坡",
        "Almaty": "🇰🇿哈萨克斯坦-阿拉木图"
    };

    let tagCounters = {};
    let successHosts = [];

    for (const node of nodeData.data) {
        const nodeName = node.b || '';
        const encryptedHost = node.n;
        let tag = nodeName;  // 使用节点名称作为标签（tag）

        if (encryptedHost) {
            const host = await decryptData(encryptedHost);
            if (host) {
                let renamedTag = tag;
                for (const [keyword, newName] of Object.entries(renameMap)) {
                    if (tag.includes(keyword)) {
                        renamedTag = newName; // 重命名为新的名称
                        break;
                    }
                }

                tagCounters[renamedTag] = (tagCounters[renamedTag] || 0) + 1;
                const numberedTag = `${renamedTag}${String(tagCounters[renamedTag]).padStart(2, '0')}`;
                const trojanLink = generateTrojanLink(UID, host, numberedTag);
                successHosts.push({ renamedTag, trojanLink });                
            }
        }
    }

    const orderedHosts = [];
    for (const key of Object.keys(renameMap)) {
        const tagName = renameMap[key];
        successHosts.filter(item => item.renamedTag === tagName).forEach(item => orderedHosts.push(item.trojanLink));
    }

    return orderedHosts.join('\n');
}

// Web Worker 请求处理
export default {
    async fetch(request) {
        const userAgent = request.headers.get('User-Agent') || '';
        const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge|Opera|OPR|Trident|MSIE|SamsungBrowser|YaBrowser|UCBrowser|Vivaldi|Brave|QQBrowser|Baidu|Sogou/i.test(userAgent); // 判断是否为浏览器

        if (isBrowser) {
            // 如果是浏览器访问
            const randomQuote = await getRandomQuote();
            const pageContent = `
                <!DOCTYPE html>
                <html lang="zh-CN">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Super VPN</title>
                        <style>
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                background-color: #f7f7f7;
                                color: #3C3C3C;
                                text-align: center;
                                padding: 20px;
                            }
                            .container {
                                background-color: #ffffff;
                                border-radius: 12px;
                                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                                padding: 30px;
                                max-width: 500px;
                                margin: 0 auto;
                                text-align: center;
                            }
                            h1 {
                                font-size: 24px;
                                color: #33A1C9;
                                margin-bottom: 20px;
                            }
                            p {
                                font-size: 16px;
                                color: #333333;
                                margin-bottom: 20px;
                            }
                            .quote-container {
                                margin-top: 20px;
                            }
                            .quote-text {
                                font-size: 18px;
                                font-weight: bold;
                                color: #555555;
                                background-color: #F0F7FF;
                                border-radius: 10px;
                                padding: 20px;
                            }
                            .quote-button {
                                background-color: #33A1C9;
                                color: white;
                                padding: 10px 20px;
                                border: none;
                                border-radius: 5px;
                                cursor: pointer;
                                margin-top: 20px;
                                font-size: 16px;
                            }
                            .quote-button:hover {
                                background-color: #2981A9;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>欢迎订阅Super，你就是苏破面！</h1>
                            <p>请查收你的每日一言</p>
                            <div class="quote-container">
                                <div class="quote-text">${randomQuote}</div>
                                <button class="quote-button" onclick="location.reload()">获取新的每日一言</button>
                            </div>
                        </div>
                    </body>
                </html>
            `;
            return new Response(pageContent, {
                headers: { 'Content-Type': 'text/html' }
            });
        } else {
            // 非浏览器请求返回节点数据
            const result = await processNodes();
            return new Response(result, {
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    }
};
