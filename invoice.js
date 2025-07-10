function getInvoiceId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('invoice');
}

const invoiceId = getInvoiceId();
const detailsContainer = document.getElementById('invoice-details');
const invoiceBtn = document.getElementById('invoice-btn');
const unsentBtn = document.getElementById('unsent-btn');

function updateSentStatus() {
    const isSent = localStorage.getItem(invoiceId) === 'sent';
    if (isSent) {
        invoiceBtn.style.display = 'none';
        unsentBtn.style.display = 'inline-block';
        if (!document.querySelector('.sent-label')) {
            const sentLabel = document.createElement('span');
            sentLabel.className = 'sent-label';
            sentLabel.textContent = 'lähetetty';
            detailsContainer.appendChild(sentLabel);
        }
    } else {
        invoiceBtn.style.display = 'inline-block';
        unsentBtn.style.display = 'none';
        const existingLabel = document.querySelector('.sent-label');
        if (existingLabel) existingLabel.remove();
    }
}

invoiceBtn.addEventListener('click', () => {
    localStorage.setItem(invoiceId, 'sent');
    localStorage.setItem(`tab_${invoiceId}`, 'tab4');
    updateSentStatus();
});

unsentBtn.addEventListener('click', () => {
    localStorage.removeItem(invoiceId); // remove sent status
    localStorage.setItem(`tab_${invoiceId}`, 'tab2'); // move back to tab2
    updateSentStatus();
});

fetch('data.json')
    .then(response => {
        if (!response.ok) throw new Error('Failed to load data.json');
        return response.json();
    })
    .then(data => {
        const found = data.find(inv => inv.invoice === invoiceId);
        if (found) {
            detailsContainer.innerHTML = `
                <p><strong>Laskun numero:</strong> ${found.invoice}</p>
                <p><strong>Asiakas:</strong> ${found.client}</p>
                <p><strong>Hinta:</strong> ${found.price}</p>
            `;
            updateSentStatus();
        } else {
            detailsContainer.innerHTML = '<p style="color:red;">Mitään ei löydetty.</p>';
            invoiceBtn.style.display = 'none';
            unsentBtn.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        detailsContainer.innerHTML = '<p style="color:red;">Lataaminen on epäonnistunut.</p>';
        invoiceBtn.style.display = 'none';
        unsentBtn.style.display = 'none';
    });