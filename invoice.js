function getInvoiceId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('invoice');
}

const invoiceId = getInvoiceId();
const detailsContainer = document.getElementById('invoice-details');
const invoiceBtn = document.getElementById('invoice-btn');
const unsentBtn = document.getElementById('unsent-btn');
const addPositionBtn = document.getElementById('add-position-btn');
const positionsTableBody = document.querySelector('#positions-table tbody');
const editBtn = document.getElementById('edit-btn');
const saveBtn = document.getElementById('save-btn');

let positions = [];

function updateSentStatus() {
  const isSent = localStorage.getItem(invoiceId) === 'sent';
  if (isSent) {
    invoiceBtn.style.display = 'none';
    unsentBtn.style.display = 'inline-block';
    if (!document.querySelector('.sent-label')) {
      const sentLabel = document.createElement('span');
      sentLabel.className = 'sent-label';
      sentLabel.textContent = 'LÄHETETTY';
      sentLabel.style.marginRight = '10px';
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
  // Disable editing when sent
  setInputsDisabled(true);
  editBtn.disabled = true;
  renderPositions(positions, false);
});

unsentBtn.addEventListener('click', () => {
  localStorage.removeItem(invoiceId); // remove sent status
  localStorage.setItem(`tab_${invoiceId}`, 'tab2'); // move back to tab2
  updateSentStatus();
  // Enable editing again
  editBtn.disabled = false;
});

function setInputsDisabled(disabled) {
  document.getElementById('client').disabled = disabled;
  document.getElementById('address').disabled = disabled;
  document.getElementById('price').disabled = disabled;
}

function updateTotalPrice() {
  const totalPrice = positions.reduce((sum, pos) => {
    return sum + (pos.quantity * pos.unitPrice);
  }, 0);
  document.getElementById('price').value = totalPrice.toFixed(2);
}

function renderPositions(positionsArray, editable = false) {
  positionsTableBody.innerHTML = '';

  positionsArray.forEach((pos, index) => {
    const row = document.createElement('tr');

    if (editable) {
      row.innerHTML = `
        <td><input type="text" class="pos-desc" value="${pos.description || ''}" style="width: 100%; font-size: 1em;"></td>
        <td><input type="number" min="0" class="pos-qty" value="${pos.quantity || 0}" style="width: 60px; font-size: 1em;"></td>
        <td><input type="number" min="0" step="0.01" class="pos-unit" value="${pos.unitPrice || 0}" style="width: 80px; font-size: 1em;"></td>
        <td class="pos-total">${((pos.quantity || 0) * (pos.unitPrice || 0)).toFixed(2)}</td>
        <td><button class="delete-position" data-index="${index}" style="font-size: 0.9em;">Poista</button></td>
      `;
    } else {
      const total = ((pos.quantity || 0) * (pos.unitPrice || 0)).toFixed(2);
      row.innerHTML = `
        <td>${pos.description}</td>
        <td>${pos.quantity}</td>
        <td>${pos.unitPrice.toFixed(2)}</td>
        <td>${total}</td>
        <td></td>
      `;
    }

    positionsTableBody.appendChild(row);
  });

  if (editable) {
    // Delete buttons
    document.querySelectorAll('.delete-position').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.index, 10);
        positions.splice(idx, 1);
        renderPositions(positions, true);
        updateTotalPrice();
      });
    });

    const descInputs = document.querySelectorAll('.pos-desc');
    const qtyInputs = document.querySelectorAll('.pos-qty');
    const unitInputs = document.querySelectorAll('.pos-unit');
    const totalCells = document.querySelectorAll('.pos-total');

    descInputs.forEach((input, i) => {
      input.addEventListener('input', () => {
        positions[i].description = input.value;
      });
    });

    qtyInputs.forEach((input, i) => {
      input.addEventListener('input', () => {
        positions[i].quantity = parseFloat(input.value) || 0;
        totalCells[i].textContent = (positions[i].quantity * positions[i].unitPrice).toFixed(2);
        updateTotalPrice();
      });
    });

    unitInputs.forEach((input, i) => {
      input.addEventListener('input', () => {
        positions[i].unitPrice = parseFloat(input.value) || 0;
        totalCells[i].textContent = (positions[i].quantity * positions[i].unitPrice).toFixed(2);
        updateTotalPrice();
      });
    });
  }
}

fetch('data.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load data.json');
    return response.json();
  })
  .then(data => {
    const found = data.find(inv => inv.invoice === invoiceId);
    const savedEdits = JSON.parse(localStorage.getItem(`edit_${invoiceId}`) || '{}');

    if (found) {
      // Show invoice number in the page
      const invoiceNumberSpan = document.getElementById('invoice-number');
      if (invoiceNumberSpan) {
        invoiceNumberSpan.textContent = found.invoice || invoiceId;
      }

      const merged = { ...found, ...savedEdits };

      document.getElementById('client').value = merged.client || '';
      document.getElementById('address').value = merged.address || '';
      document.getElementById('price').value = merged.price || '';

      document.getElementById('client').style.fontSize = '1.1em';
      document.getElementById('address').style.fontSize = '1.1em';
      document.getElementById('price').style.fontSize = '1.1em';

      document.getElementById('client').style.marginTop = '8px';
      document.getElementById('address').style.marginTop = '8px';
      document.getElementById('price').style.marginTop = '8px';

      updateSentStatus();

      positions = Array.isArray(merged.positions) ? merged.positions : [];
      renderPositions(positions, false);

      // Disable edit button if in tab4 (sent)
      if (localStorage.getItem(`tab_${invoiceId}`) === 'tab4') {
        editBtn.disabled = true;
      }
    } else {
      detailsContainer.innerHTML = '<p style="color:red;">Mitään ei ole löydetty.</p>';
      invoiceBtn.style.display = 'none';
      unsentBtn.style.display = 'none';
      editBtn.disabled = true;
      addPositionBtn.disabled = true;
      saveBtn.style.display = 'none';
    }
  })
  .catch(error => {
    console.error('Error:', error);
    detailsContainer.innerHTML = '<p style="color:red;">Lataaminen on epäonnistunut.</p>';
    invoiceBtn.style.display = 'none';
    unsentBtn.style.display = 'none';
    editBtn.disabled = true;
    addPositionBtn.disabled = true;
    saveBtn.style.display = 'none';
  });

setInputsDisabled(true);

editBtn.addEventListener('click', () => {
  setInputsDisabled(false);
  editBtn.style.display = 'none';
  saveBtn.style.display = 'inline-block';
  addPositionBtn.disabled = false;
  renderPositions(positions, true);
});

saveBtn.addEventListener('click', () => {
  const client = document.getElementById('client').value;
  const address = document.getElementById('address').value;

  // Update positions from current inputs before saving
  const descs = [...document.querySelectorAll('.pos-desc')];
  const qtys = [...document.querySelectorAll('.pos-qty')];
  const units = [...document.querySelectorAll('.pos-unit')];

  positions = descs.map((descInput, i) => ({
    description: descInput.value,
    quantity: parseFloat(qtys[i].value) || 0,
    unitPrice: parseFloat(units[i].value) || 0
  }));

  updateTotalPrice();
  const price = document.getElementById('price').value;

  const edited = { client, price, address, positions };
  localStorage.setItem(`edit_${invoiceId}`, JSON.stringify(edited));

  setInputsDisabled(true);
  saveBtn.style.display = 'none';
  editBtn.style.display = 'inline-block';
  addPositionBtn.disabled = true;

  renderPositions(positions, false);

  showSaveNotification();
});

addPositionBtn.addEventListener('click', () => {
  if (saveBtn.style.display === 'inline-block') {
    positions.push({ description: '', quantity: 0, unitPrice: 0 });
    renderPositions(positions, true);
    updateTotalPrice();
  } else {
    alert('Avaa muokkaustila lisätäksesi rivejä.');
  }
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
  notification.style.marginRight = '10px';

  setTimeout(() => {
    if (notification) notification.remove();
  }, 2000);
}
