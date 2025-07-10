document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const invoiceContainer = document.getElementById('invoices');
    let allInvoices = [];

    // Load invoices from data.json
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allInvoices = data;
            renderInvoices('tab1'); // Default tab
        });

    // Handle tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabKey = tab.getAttribute('data-tab');
            renderInvoices(tabKey);
        });
    });

    function getTab(invoiceId) {
        return localStorage.getItem(`tab_${invoiceId}`) || 'tab1';
    }

    function setTab(invoiceId, tabKey) {
        localStorage.setItem(`tab_${invoiceId}`, tabKey);
    }

    function renderInvoices(tabKey) {
        const invoices = allInvoices.filter(inv => getTab(inv.invoice) === tabKey);
        invoiceContainer.innerHTML = invoices.map(inv => {
            const isSent = localStorage.getItem(inv.invoice) === 'sent';

            let actions = '';

            // Actions depending on tab
            if (tabKey === 'tab1') {
                actions = `<button class="move-btn" data-invoice="${inv.invoice}" data-target="tab2">Siirrä laskutettaviin</button>`;
            } else if (tabKey === 'tab2') {
                actions = `
                    <button class="invoice-btn" data-invoice="${inv.invoice}">Laskuta</button>
                    <button class="move-btn" data-invoice="${inv.invoice}" data-target="tab3">Siirrä odottaviin</button>
                `;
            }
else if (tabKey === 'tab3') {
    actions = `<button class="move-btn" data-invoice="${inv.invoice}" data-target="tab2">Siirrä laskutettaviin</button>`;
}
else if (tabKey === 'tab4') {
    actions = `
        <button class="unsent-btn" data-invoice="${inv.invoice}">Palauta</button>
    `;
}

            return `
                <div class="invoice-item">
                    <strong>Lasku:</strong> <a href="invoice.html?invoice=${inv.invoice}">${inv.invoice}</a> 
                    <br>
                    <strong>Asiakas:</strong> ${inv.client} <br>
                    <strong>Hinta:</strong> ${inv.price} <br>
                    ${actions}
                </div>
            `;
        }).join('');

        // Attach event handlers
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
        localStorage.removeItem(invoiceId); // remove 'sent' status
        setTab(invoiceId, 'tab2');          // move to tab2
        renderInvoices(tabKey);             // refresh the current view
    });
});
    }
});