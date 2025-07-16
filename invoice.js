document.addEventListener('DOMContentLoaded', () => {
  function getInvoiceId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('invoice');
  }

  function getNewInvoices() {
    const stored = localStorage.getItem('newInvoices');
    return stored ? JSON.parse(stored) : [];
  }

  async function fetchAllInvoices() {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Failed to load data.json');
    const dataInvoices = await response.json();
    const newInvoices = getNewInvoices();
    return dataInvoices.concat(newInvoices);
  }

  const invoiceId = getInvoiceId();
  const detailsContainer = document.getElementById('invoice-details');
  const invoiceBtn = document.getElementById('invoice-btn');
  const unsentBtn = document.getElementById('unsent-btn');
  const addPositionBtn = document.getElementById('add-position-btn');
  const positionsTableBody = document.querySelector('#positions-table tbody');
  const editBtn = document.getElementById('edit-btn');
  const saveBtn = document.getElementById('save-btn');

  const langSelect = document.getElementById('lang-select');
  let currentLang = langSelect ? langSelect.value || 'fi' : 'fi';

  const translations = {
    fi: {
      sentLabel: 'LÄHETETTY',
      saveNotification: 'TIEDOT TALLENNETTU',
      noDataFound: 'Mitään ei ole löydetty.',
      loadFailed: 'Lataaminen on epäonnistunut.',
      deleteBtn: 'Poista',
      addRowAlert: 'Avaa muokkaustila lisätäksesi rivejä.',
      invoiceBtn: 'Laskuta',
      unsentBtn: 'Palauta',
      editBtn: 'Muokkaa',
      saveBtn: 'Tallenna',
      invoiceTitle: 'Lasku',
      languageLabel: 'Kieli / Language:',
      clientLabel: 'Asiakas:',
      addressLabel: 'Laskutusosoite:',
      priceLabel: 'Hinta:',
      addPositionBtn: 'Lisää rivi',
      descHeader: 'Kuvaus',
      qtyHeader: 'Määrä',
      unitPriceHeader: 'Yksikköhinta (€)',
      totalHeader: 'Yhteensä (€)',
      actionsHeader: 'Toiminnot',
      backLink: '← Takaisin laskuihin',
      fiOption: 'Suomi',
      enOption: 'English'
    },
    en: {
      sentLabel: 'SENT',
      saveNotification: 'DATA SAVED',
      noDataFound: 'Nothing found.',
      loadFailed: 'Loading failed.',
      deleteBtn: 'Delete',
      addRowAlert: 'Open edit mode to add rows.',
      invoiceBtn: 'Invoice',
      unsentBtn: 'Restore',
      editBtn: 'Edit',
      saveBtn: 'Save',
      invoiceTitle: 'Invoice',
      languageLabel: 'Language / Kieli:',
      clientLabel: 'Client:',
      addressLabel: 'Billing address:',
      priceLabel: 'Price:',
      addPositionBtn: 'Add Row',
      descHeader: 'Description',
      qtyHeader: 'Quantity',
      unitPriceHeader: 'Unit Price (€)',
      totalHeader: 'Total (€)',
      actionsHeader: 'Actions',
      backLink: '← Back to invoices',
      fiOption: 'Suomi',
      enOption: 'English'
    }
  };

  function updateStaticTexts() {
    const t = translations[currentLang];
    document.querySelectorAll('[data-translate-key]').forEach(el => {
      const key = el.getAttribute('data-translate-key');
      if (key in t) el.textContent = t[key];
    });
  }

  function updateAllTexts() {
    const t = translations[currentLang];
    if (invoiceBtn) invoiceBtn.textContent = t.invoiceBtn;
    if (unsentBtn) unsentBtn.textContent = t.unsentBtn;
    if (editBtn) editBtn.textContent = t.editBtn;
    if (saveBtn) saveBtn.textContent = t.saveBtn;
    if (addPositionBtn) addPositionBtn.textContent = t.addPositionBtn;

    const sentLabel = document.querySelector('.sent-label');
    if (sentLabel) sentLabel.textContent = t.sentLabel;

    updateStaticTexts();

    const isEditing = saveBtn.style.display === 'inline-block';
    renderPositions(positions, isEditing);
  }

  function updateSentStatus() {
    const t = translations[currentLang];
    const isSent = localStorage.getItem(invoiceId) === 'sent';
    if (isSent) {
      invoiceBtn.style.display = 'none';
      unsentBtn.style.display = 'inline-block';

      if (!document.querySelector('.sent-label')) {
        const sentLabel = document.createElement('span');
        sentLabel.className = 'sent-label';
        sentLabel.textContent = t.sentLabel;
        sentLabel.style.marginRight = '10px';
        detailsContainer.appendChild(sentLabel);
      } else {
        document.querySelector('.sent-label').textContent = t.sentLabel;
      }
    } else {
      invoiceBtn.style.display = 'inline-block';
      unsentBtn.style.display = 'none';
      const existingLabel = document.querySelector('.sent-label');
      if (existingLabel) existingLabel.remove();
    }
  }

  function setInputsDisabled(disabled) {
    ['client', 'address', 'price'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = disabled;
    });
  }

  function updateTotalPrice() {
    const totalPrice = positions.reduce((sum, pos) => sum + (pos.quantity * pos.unitPrice), 0);
    const priceInput = document.getElementById('price');
    if (priceInput) priceInput.value = totalPrice.toFixed(2);
  }

  function renderPositions(positionsArray, editable = false) {
    const t = translations[currentLang];
    positionsTableBody.innerHTML = '';

    positionsArray.forEach((pos, index) => {
      const tr = document.createElement('tr');

      const descTd = document.createElement('td');
      if (editable) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = pos.description || '';
        input.addEventListener('input', e => {
          positions[index].description = e.target.value;
          savePositionsToStorage();
        });
        descTd.appendChild(input);
      } else {
        descTd.textContent = pos.description || '';
      }
      tr.appendChild(descTd);

      // Quantity cell
      const qtyTd = document.createElement('td');
      if (editable) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 0;
        input.step = 'any';
        input.value = pos.quantity || 0;
        input.addEventListener('input', e => {
          positions[index].quantity = parseFloat(e.target.value) || 0;
          updateTotalPrice();
          savePositionsToStorage();
        });
        qtyTd.appendChild(input);
      } else {
        qtyTd.textContent = pos.quantity || 0;
      }
      tr.appendChild(qtyTd);

      // Unit price cell
      const unitPriceTd = document.createElement('td');
      if (editable) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 0;
        input.step = 'any';
        input.value = pos.unitPrice || 0;
        input.addEventListener('input', e => {
          positions[index].unitPrice = parseFloat(e.target.value) || 0;
          updateTotalPrice();
          savePositionsToStorage();
        });
        unitPriceTd.appendChild(input);
      } else {
        unitPriceTd.textContent = (pos.unitPrice || 0).toFixed(2);
      }
      tr.appendChild(unitPriceTd);

      const totalTd = document.createElement('td');
      const total = (pos.quantity || 0) * (pos.unitPrice || 0);
      totalTd.textContent = total.toFixed(2);
      tr.appendChild(totalTd);

      const actionsTd = document.createElement('td');
      if (editable) {
        const delBtn = document.createElement('button');
        delBtn.textContent = t.deleteBtn;
        delBtn.addEventListener('click', () => {
          positions.splice(index, 1);
          renderPositions(positions, true);
          updateTotalPrice();
          savePositionsToStorage();
        });
        actionsTd.appendChild(delBtn);
      } else {
        actionsTd.textContent = '-';
      }
      tr.appendChild(actionsTd);

      positionsTableBody.appendChild(tr);
    });
  }

  function savePositionsToStorage() {
    const savedEdits = JSON.parse(localStorage.getItem(`edit_${invoiceId}`) || '{}');
    savedEdits.positions = positions;
    localStorage.setItem(`edit_${invoiceId}`, JSON.stringify(savedEdits));
  }

  let positions = [];

  async function loadInvoice() {
    try {
      if (!invoiceId) {
        detailsContainer.innerHTML = `<p style="color:red;">${translations[currentLang].noDataFound}</p>`;
        return;
      }

      const allInvoices = await fetchAllInvoices();
      const found = allInvoices.find(inv => inv.invoice === invoiceId);
      const savedEdits = JSON.parse(localStorage.getItem(`edit_${invoiceId}`) || '{}');

      if (found) {
        document.getElementById('invoice-number').textContent = found.invoice || invoiceId;

        const merged = { ...found, ...savedEdits };

        document.getElementById('client').value = merged.client || '';
        document.getElementById('address').value = merged.address || '';
        document.getElementById('price').value = merged.price || 0;

        ['client', 'address', 'price'].forEach(id => {
          const el = document.getElementById(id);
          el.style.fontSize = '1em';
          el.style.marginTop = '8px';
        });

        positions = Array.isArray(merged.positions) ? merged.positions : [];
        updateSentStatus();
        renderPositions(positions, false);

        if (localStorage.getItem(`tab_${invoiceId}`) === 'tab4') {
          editBtn.disabled = true;
        } else {
          editBtn.disabled = false;
        }

        saveBtn.style.display = 'none';
        addPositionBtn.disabled = true;
        setInputsDisabled(true);

        updateAllTexts();
      } else {
        detailsContainer.innerHTML = `<p style="color:red;">${translations[currentLang].noDataFound}</p>`;
        invoiceBtn.style.display = 'none';
        unsentBtn.style.display = 'none';
        editBtn.disabled = true;
        addPositionBtn.disabled = true;
        saveBtn.style.display = 'none';
      }
    } catch (err) {
      console.error(err);
      detailsContainer.innerHTML = `<p style="color:red;">${translations[currentLang].loadFailed}</p>`;
      invoiceBtn.style.display = 'none';
      unsentBtn.style.display = 'none';
      editBtn.disabled = true;
      addPositionBtn.disabled = true;
      saveBtn.style.display = 'none';
    }
  }

  editBtn.addEventListener('click', () => {
    setInputsDisabled(false);
    renderPositions(positions, true);
    addPositionBtn.disabled = false;
    saveBtn.style.display = 'inline-block';
    editBtn.disabled = true;
  });

  saveBtn.addEventListener('click', () => {
    const savedEdits = {
      client: document.getElementById('client').value.trim(),
      address: document.getElementById('address').value.trim(),
      price: parseFloat(document.getElementById('price').value) || 0,
      positions
    };
    localStorage.setItem(`edit_${invoiceId}`, JSON.stringify(savedEdits));

    setInputsDisabled(true);
    renderPositions(positions, false);
    addPositionBtn.disabled = true;
    saveBtn.style.display = 'none';
    editBtn.disabled = false;

    updateTotalPrice();

    alert(translations[currentLang].saveNotification);
  });

  addPositionBtn.addEventListener('click', () => {
    positions.push({ description: '', quantity: 0, unitPrice: 0 });
    renderPositions(positions, true);
  });

  if (langSelect) {
    langSelect.addEventListener('change', e => {
      currentLang = e.target.value;
      updateAllTexts();
    });
  }

  loadInvoice();
});
