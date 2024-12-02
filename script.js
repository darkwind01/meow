const spans = document.querySelectorAll('.clanStats span[id^="stats-"]');
let delay = 0;
const under5Hours = []; // Lista pentru utilizatorii cu sub 3 ore
const webhookUrl = 'https://discord.com/api/webhooks/1313218493721608203/Q9lErbjaX--bMoSRmYrmF1GS1zgjprU4nyWYtXBDtP5crvycm1MUQvjLBxkdL3_T7QA4'; // Înlocuiește cu URL-ul webhookului tău

spans.forEach((span) => {
    setTimeout(() => {
        span.click(); // Simulează click pe fiecare element pentru afișare
        setTimeout(() => {
            const hoursText = span.textContent.match(/Hours L7:\s*([\d.]+)/); // Extrage numărul de ore
            if (hoursText && parseFloat(hoursText[1]) < 3) {
                const row = span.closest('tr');
                const userElement = row.querySelector('td a');
                const lastLoginCell = row.querySelectorAll('td')[5]; // Presupunând că a 6-a coloană (index 5) are data
                const username = userElement ? userElement.textContent.trim() : 'Unknown';
                const lastLoginRaw = lastLoginCell ? lastLoginCell.textContent.trim() : 'Unknown';

                let daysAgoText = '';
                if (lastLoginRaw !== 'Unknown') {
                    // Parsare manuală a datei (format: DD.MM.YYYY HH:mm)
                    const dateParts = lastLoginRaw.match(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/);
                    if (dateParts) {
                        const day = parseInt(dateParts[1], 10);
                        const month = parseInt(dateParts[2], 10) - 1; // Luna începe de la 0 în JS
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

// După ce toate datele sunt colectate, trimite mesajul pe Discord
setTimeout(() => {
    console.log('Utilizatori cu sub 3 ore în ultimele 7 zile:', under5Hours);
    
    // Formatează mesajul pentru Discord
    const message = under5Hours.map(player => 
        `**Nume:** ${player.username}\n**Ore jucate în ultimele 7 zile:** ${player.hours}\n**Ultima conectare:** ${player.lastLogin}\n`
    ).join('\n');

    // Trimite mesajul prin webhook
    if (message) {
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `📋 **Lista jucătorilor cu sub 3 ore în ultimele 7 zile:**\n\n${message}`
            })
        })
        .then(response => {
            if (response.ok) {
                console.log('Mesaj trimis cu succes pe Discord!');
            } else {
                console.error('Eroare la trimiterea mesajului:', response.statusText);
            }
        })
        .catch(error => console.error('Eroare:', error));
    } else {
        console.log('Nicio informație de trimis.');
    }
}, delay + 1000);
