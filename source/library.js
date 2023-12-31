import axios from 'axios';

// 1. Проверка наличия исходного кода токена. 
export async function checkSourceCodeVerified(token) {
    try {
        const banned_resources = [
            'github', 'wikipedia', 'hardhat', 'ethereum.org',
            'zeppelin', 'readthedocs', 'consensys', 'metadrop',
            'theverge', 'medium'
        ]

        // Создание и обработка запроса
        const response = (await axios.get(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${token.address}&apikey=I42WBTQDF5JSSWARWCNYFU2DUI1IFGQWD1`)).data.result[0]
        if (response.ABI == 'Contract source code not verified') {
            token.sourceCodeVerified = false
            return token
        } // Возвращать false, если исходный код не был получен.

        token.sourceCodeVerified = true
        const content = (response.SourceCode).split('\n') // Извлечение исходного кода токена.
    
        // Код может быть в виде обычного текста: function()..., а может и быть в виде объекта: "lang": "solidity", "content": function()...,
        // и здесь регестрируются оба случая, чтобы в случае чего не упускать исходного кода.
        const contentIndex = content.indexOf(content.find(element => element.includes('\"content\"'))) || '-1'; // Индекс "content" в коде в массиве ответа (2-ой случай). Изначально: -1.
    
        const text = (contentIndex == -1) ? content : content[contentIndex].split('\\n') // Извлечение исходного кода созданием массива для каждой отдельной строчки.
        const links = text.filter(element => element.includes('https://')).map(link => link.trim()); // Объявление массива для предполагающихся ссылок на ресурсы.
    
        for (const rawLink of links) {
            // Обработка raw-ссылки.
            let link = rawLink.slice(rawLink.indexOf('https://'))
            if (link.indexOf('\\') > 0) link = link.slice(0, link.indexOf('\\'))
            if (link.indexOf(' ') > 0) link = link.slice(0, (link.indexOf(' ')))
    
            // Извлечение ссылок.
            if (link.includes('t.me')) { token.telegram = link; continue; } // Извлечение ТГ-канала.
            if (link.includes('twitter.com') || link.includes('x.com') || link.includes('X.com')) { token.twitter = link; continue; } // Извлечение Твиттера.
            if (!banned_resources.some(element => link.includes(element))) token.website = link; // Извлечение сайта.
            
            if (token?.telegram && token?.twitter && token?.website) break; // Не проверять ссылки дальше, если объект со всеми ресурсами полностью собран.
        }
    
        // Возврат данных
        return token // Если ссылки были найдены, вывести объект с ссылками, который будет равен true в Boolean, чтобы прошло подтверждение наличия исходного кода
    } catch (e) {
        console.log(e)
    }
}



// 2. Получение холдеров токена.
export async function getHolders(address, decimals) {
    const holders = [] // Объявление общего массива с холдерами.

    async function getPageHolders(page) { // Функция получние холдеров с указанной страницей.
        return (await axios.get(`https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${address}&page=${page}&offset=1000&apikey=I42WBTQDF5JSSWARWCNYFU2DUI1IFGQWD1`)).data.result
    }

    const firstPageHolders = await getPageHolders(1) // Получение холдеров с первой страницы.
    firstPageHolders.forEach(holder => holders.push([holder.TokenHolderAddress, holder.TokenHolderQuantity / 10**decimals])) // Фильтрация холдеров и добавление их в общий массив.

    if (firstPageHolders.length === 1000) { // Смотреть следующую страницу, если текущая заполнена полностью.
        await getLocalPageHolders(2) // Получение холдеров со второй страницы.

        async function getLocalPageHolders(page) {
            const localPageArray = await getPageHolders(page) // Получение холдеров с page страницы.
            localPageArray.forEach(holder => holders.push([holder.TokenHolderAddress, holder.TokenHolderQuantity / 10**decimals]))

            if (localPageArray.length == 1000) { // Смотреть следующую страницу, если текущая заполнена полностью.
                return getLocalPageHolders(page+1) // Рекурсивный вызов функции для сбора холдеров со следующей страницы.
            } else {
                return holders // Возврат массива все холдеров, если страница не заполенена полностью (то есть следующие страницы смотреть не надо).
            }
        }
    }

    holders.sort((a, b) => b[1] - a[1]); // Сортировка объекта с холдерами по убыванию количества токенов.
    return holders // Конечный возврат массива с холдерами.
}