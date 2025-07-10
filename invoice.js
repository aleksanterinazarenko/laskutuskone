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
            sentLabel.textContent = 'LÄHETETTY';
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
    const savedEdits = JSON.parse(localStorage.getItem(`edit_${invoiceId}`) || '{}');

    if (found) {
        const merged = { ...found, ...savedEdits };

        document.getElementById('client').value = merged.client || '';
        document.getElementById('address').value = merged.address || '';
        document.getElementById('price').value = merged.price || '';

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

    document.getElementById('save-btn').addEventListener('click', () => {
    const client = document.getElementById('client').value;
    const address = document.getElementById('address').value;
    const price = document.getElementById('price').value;

    const edited = { client, price, address };
    localStorage.setItem(`edit_${invoiceId}`, JSON.stringify(edited));
});

function setInputsDisabled(disabled) {
  document.getElementById('client').disabled = disabled;
  document.getElementById('address').disabled = disabled;
  document.getElementById('price').disabled = disabled;
}

// Initially disable inputs
setInputsDisabled(true);

const editBtn = document.getElementById('edit-btn');
// Disable edit button if invoice is in tab4
if (localStorage.getItem(`tab_${invoiceId}`) === 'tab4') {
  editBtn.disabled = true;
  // Or to hide it:
  // editBtn.style.display = 'none';
}
const saveBtn = document.getElementById('save-btn');

editBtn.addEventListener('click', () => {
  setInputsDisabled(false);
  editBtn.style.display = 'none';
  saveBtn.style.display = 'inline-block';
});

saveBtn.addEventListener('click', () => {
  const client = document.getElementById('client').value;
  const address = document.getElementById('address').value;
  const price = document.getElementById('price').value;

  const edited = { client, price, address };
  localStorage.setItem(`edit_${invoiceId}`, JSON.stringify(edited));
  
  setInputsDisabled(true);
  saveBtn.style.display = 'none';
  editBtn.style.display = 'inline-block';

  showSaveNotification();
});

function showSaveNotification() {
  let notification = document.querySelector('.save-notification');
  if (!notification) {
    notification = document.createElement('span');
    notification.className = 'save-notification';
    notification.style.color = 'green';
    notification.style.fontWeight = 'bold';
    detailsContainer.appendChild(notification);
  }
  notification.textContent = 'TIEDOT TALLENNETTU';

  // Remove notification after 3 seconds
  setTimeout(() => {
    if (notification) notification.remove();
  }, 3000);
}