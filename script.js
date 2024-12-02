document.addEventListener('DOMContentLoaded', () => {
    const spans = document.querySelectorAll('.clanStats span[id^="stats-"]');
    let delay = 0;
    const under5Hours = []; // Lista pentru utilizatorii cu sub 3 ore
    const urlParams = new URLSearchParams(window.location.search);
    const webhookUrl = urlParams.get('webhook');  // Preia URL-ul webhook din parametrii URL

    // Verifică dacă URL-ul webhook este valid
    if (!webhookUrl || webhookUrl === '#') {
        console.error('URL webhook invalid! Asigură-te că parametru `webhook` este valid.');
        return;  // Oprește execuția dacă URL-ul webhook nu este valid
    }

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
        
        // Verifică dacă există utilizatori
        if (under5Hours.length === 0) {
            console.log('Nu sunt utilizatori cu sub 3 ore în ultimele 7 zile.');
            return;  // Dacă nu sunt utilizatori, oprește execuția
        }

        // Formatează mesajele pentru Discord
        const messageParts = [];
        let currentMessage = '';
        const maxMessageLength = 2000; // Limita de caractere pentru fiecare mesaj

        under5Hours.forEach(player => {
            const playerInfo = `**Nume:** ${player.username}\n**Ore jucate în ultimele 7 zile:** ${player.hours}\n**Ultima conectare:** ${player.lastLogin}\n\n`;

            if ((currentMessage + playerInfo).length > maxMessageLength) {
                // Dacă adăugarea acestui text ar depăși limita, trimite mesajul curent și începe unul nou
                messageParts.push(currentMessage);
                currentMessage = playerInfo;
            } else {
                currentMessage += playerInfo;
            }
        });

        // Adaugă ultimul mesaj dacă există
        if (currentMessage) {
            messageParts.push(currentMessage);
        }

        // Trimite fiecare parte a mesajului pe Discord
        messageParts.forEach((message, index) => {
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `📋 **Lista cu jucatorii inactivi #${index + 1}:**\n\n${message}`
                })
            })
            .then(response => response.json())  // Obține răspunsul complet
            .then(data => {
                if (data && data.error) {
                    console.error(`Eroare Discord (mesaj ${index + 1}):`, data.error);
                } else {
                    console.log(`Mesajul ${index + 1} trimis cu succes pe Discord!`);
                }
            })
            .catch(error => console.error('Eroare:', error));
        });
    }, delay + 1000);
});
