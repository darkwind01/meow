const spans = document.querySelectorAll('.clanStats span[id^="stats-"]');
let delay = 0;
const under5Hours = [];
const webhookUrl = 'https://discord.com/api/webhooks/1313227342684094586/VYeig3TWy-DbQsklbnPiJd4Noo9FSSvZoBfUo1HgpUCdV3q_G3cgIqC-Jhw13mqoC3KW';
spans.forEach((span) => {
    setTimeout(() => {
        span.click();
        setTimeout(() => {
            const hoursText = span.textContent.match(/Hours L7:\s*([\d.]+)/);
            if (hoursText && parseFloat(hoursText[1]) < 3) {
                const row = span.closest('tr');
                const userElement = row.querySelector('td a');
                const lastLoginCell = row.querySelectorAll('td')[5];
                const username = userElement ? userElement.textContent.trim() : 'Unknown';
                const lastLoginRaw = lastLoginCell ? lastLoginCell.textContent.trim() : 'Unknown';

                let daysAgoText = '';
                if (lastLoginRaw !== 'Unknown') {
                    const dateParts = lastLoginRaw.match(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/);
                    if (dateParts) {
                        const day = parseInt(dateParts[1], 10);
                        const month = parseInt(dateParts[2], 10) - 1;
                        const year = parseInt(dateParts[3], 10);
                        const hour = parseInt(dateParts[4], 10);
                        const minute = parseInt(dateParts[5], 10);
                        const lastLoginDate = new Date(year, month, day, hour, minute);

                        const now = new Date();
                        const diffTime = now - lastLoginDate;
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        daysAgoText = ` (${diffDays} zile în urmă)`;
                    } else {
                        daysAgoText = ' (Data invalidă)';
                    }
                }

                under5Hours.push({ 
                    username, 
                    hours: parseFloat(hoursText[1]), 
                    lastLogin: `${lastLoginRaw}${daysAgoText}`
                });
            }
        }, 500);
    }, delay);
    delay += 500;
});

setTimeout(() => {
    console.log('Utilizatori cu sub 3 ore în ultimele 7 zile:', under5Hours);
    const messageParts = [];
    let currentMessage = '';
    under5Hours.forEach(player => {
        const playerInfo = `**Nume:** ${player.username}\n**Ore jucate în ultimele 7 zile:** ${player.hours}\n**Ultima conectare:** ${player.lastLogin}\n\n`;
        if ((currentMessage + playerInfo).length > 2000) {
            messageParts.push(currentMessage);
            currentMessage = playerInfo;
        } else {
            currentMessage += playerInfo;
        }
    });
    if (currentMessage) {
        messageParts.push(currentMessage);
    }
    messageParts.forEach((message, index) => {
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Meow - Activity members',
                avatar_url: 'https://cdn.discordapp.com/attachments/1272194216365260830/1301601010317525042/Untitled-1.png?ex=674f41e7&is=674df067&hm=3f22cd576ba8e5a6f86ad5329cbfda48ddf8ebad42802303d789aebae25a81af&',
                content: `📋 **Lista membrilor inactivi in clan #${index + 1}:**\n\n${message}`
            })
        })
        .then(response => {
            if (response.ok) {
                console.log(`Mesajul ${index + 1} trimis cu succes pe Discord!`);
            } else {
                console.error(`Eroare la trimiterea mesajului ${index + 1}:`, response.statusText);
            }
        })
        .catch(error => console.error('Eroare:', error));
    });
}, delay + 1000);
