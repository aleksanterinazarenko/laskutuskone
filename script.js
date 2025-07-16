document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const invoiceContainer = document.getElementById('invoices');
    const langSelect = document.getElementById('lang-select');

    let allInvoices = [];
    let currentLang = navigator.language.startsWith('en') ? 'en' : 'fi';

    const translations = {
        en: {
            invoices: "Invoices",
            incoming: "Incoming",
            billable: "Billable",
            waitingToSend: "Waiting to Send",
            sent: "Sent",
            billed: "Billed",
            moveToBillable: "Move to Billable",
            invoice: "Invoice",
            moveToWaiting: "Move to Waiting",
            return: "Return",
            client: "Client",
            address: "Address",
            price: "Price",
            sendInvoice: "Send Invoice"
        },
        fi: {
            invoices: "Laskut",
            incoming: "Tulossa",
            billable: "Laskutettavissa",
            waitingToSend: "Odottaa lähetystä",
            sent: "Lähetetty",
            billed: "Laskutettu",
            moveToBillable: "Siirrä laskutettaviin",
            invoice: "Lasku",
            moveToWaiting: "Siirrä odottaviin",
            return: "Palauta",
            client: "Asiakas",
            address: "Osoite",
            price: "Hinta",
            sendInvoice: "Laskuta"
        }
    };

    function setLanguage(lang) {
        currentLang = lang;

        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.getAttribute('data-translate-key');
            if (translations[lang][key]) {
                el.innerText = translations[lang][key];
            }
        });

        renderInvoices(getActiveTabKey());
    }

    function getTab(invoiceId) {
        return localStorage.getItem(`tab_${invoiceId}`) || 'tab1';
    }

    function setTab(invoiceId, tabKey) {
        localStorage.setItem(`tab_${invoiceId}`, tabKey);
    }

    function getActiveTabKey() {
        return document.querySelector('.tab-btn.active')?.getAttribute('data-tab') || 'tab1';
    }

    function renderInvoices(tabKey) {
        const invoices = allInvoices.filter(inv => getTab(inv.invoice) === tabKey);
        invoiceContainer.innerHTML = invoices.map(inv => {
            const saved = JSON.parse(localStorage.getItem(`edit_${inv.invoice}`) || '{}');
            const client = saved.client || inv.client;
            const price = saved.price || inv.price;
            const address = saved.address || inv.address || '-';

            let actions = '';
            if (tabKey === 'tab1') {
                actions = `<button class="move-btn" data-invoice="${inv.invoice}" data-target="tab2">${translations[currentLang].moveToBillable}</button>`;
            } else if (tabKey === 'tab2') {
                actions = `
                    <button class="invoice-btn" data-invoice="${inv.invoice}">${translations[currentLang].sendInvoice}</button>
                    <button class="move-btn" data-invoice="${inv.invoice}" data-target="tab3">${translations[currentLang].moveToWaiting}</button>
                `;
            } else if (tabKey === 'tab3') {
                actions = `<button class="move-btn" data-invoice="${inv.invoice}" data-target="tab2">${translations[currentLang].moveToBillable}</button>`;
            } else if (tabKey === 'tab4') {
                actions = `<button class="unsent-btn" data-invoice="${inv.invoice}">${translations[currentLang].return}</button>`;
            }

            return `
                <div class="invoice-item">
                    <strong>${translations[currentLang].invoice}:</strong> <a href="invoice.html?invoice=${inv.invoice}">${inv.invoice}</a><br>
                    <strong>${translations[currentLang].client}:</strong> ${client}<br>
                    <strong>${translations[currentLang].address}:</strong> ${address}<br>
                    <strong>${translations[currentLang].price}:</strong> ${price}<br>
                    ${actions}
                </div>
            `;
        }).join('');

        document.querySelectorAll('.invoice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceId = e.target.getAttribute('data-invoice');
                localStorage.setItem(invoiceId, 'sent');
                setTab(invoiceId, 'tab4');
                renderInvoices(tabKey);
            });
        });

        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceId = e.target.getAttribute('data-invoice');
                const targetTab = e.target.getAttribute('data-target');
                setTab(invoiceId, targetTab);
                renderInvoices(tabKey);
            });
        });

        document.querySelectorAll('.unsent-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceId = e.target.getAttribute('data-invoice');
                localStorage.removeItem(invoiceId);
                setTab(invoiceId, 'tab2');
                renderInvoices(tabKey);
            });
        });
    }

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allInvoices = data;
            setLanguage(currentLang);
            renderInvoices('tab1');
        });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderInvoices(tab.getAttribute('data-tab'));
        });
    });

    langSelect.value = currentLang;
    langSelect.addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });
});