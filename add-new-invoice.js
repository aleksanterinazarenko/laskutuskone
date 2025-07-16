document.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('lang-select');
  let currentLang = navigator.language.startsWith('en') ? 'en' : 'fi';

  const translations = {
    fi: {
      backLink: '← Takaisin laskuihin',
      newInvoice: 'Uusi lasku',
      clientLabel: 'Asiakas:',
      addressLabel: 'Laskutusosoite:',
      createInvoice: 'Luo lasku',
      languageLabel: 'Kieli / Language:',
      fiOption: 'Suomi',
      enOption: 'English',
      fillFields: 'Täytä asiakas ja osoite.'
    },
    en: {
      backLink: '← Back to invoices',
      newInvoice: 'New Invoice',
      clientLabel: 'Client:',
      addressLabel: 'Billing address:',
      createInvoice: 'Create Invoice',
      languageLabel: 'Language / Kieli:',
      fiOption: 'Finnish',
      enOption: 'English',
      fillFields: 'Please fill in client and address.'
    }
  };

  function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    document.querySelectorAll('[data-translate-key]').forEach(el => {
      const key = el.getAttribute('data-translate-key');
      if (t[key]) el.textContent = t[key];
    });
  }

  langSelect.value = currentLang;
  setLanguage(currentLang);

  langSelect.addEventListener('change', e => {
    setLanguage(e.target.value);
  });

  function formatInvoiceNumber(num) {
    return num.toString().padStart(4, '0');
  }

  function getNewInvoices() {
    const invStr = localStorage.getItem('newInvoices');
    return invStr ? JSON.parse(invStr) : [];
  }

  function saveNewInvoices(invoices) {
    localStorage.setItem('newInvoices', JSON.stringify(invoices));
  }

  async function fetchAllInvoices() {
    const response = await fetch('data.json');
    const dataInvoices = await response.json();
    const newInvoices = getNewInvoices();
    return dataInvoices.concat(newInvoices);
  }

  async function generateNextInvoiceNumber() {
    const allInvoices = await fetchAllInvoices();
    if (allInvoices.length === 0) return '0001';

    const numbers = allInvoices.map(inv => parseInt(inv.invoice, 10)).filter(n => !isNaN(n));
    const maxNum = numbers.length ? Math.max(...numbers) : 0;
    return formatInvoiceNumber(maxNum + 1);
  }

  async function showInvoiceNumber() {
    const invoiceNumberInput = document.getElementById('invoice-number');
    if (invoiceNumberInput) {
      invoiceNumberInput.value = await generateNextInvoiceNumber();
    }
  }

  showInvoiceNumber();

  document.getElementById('create-invoice-btn').addEventListener('click', async () => {
    const client = document.getElementById('new-client').value.trim();
    const address = document.getElementById('new-address').value.trim();

    if (!client || !address) {
      alert(translations[currentLang].fillFields);
      return;
    }

    const newInvoiceId = await generateNextInvoiceNumber();

    const newInvoice = {
      invoice: newInvoiceId,
      client,
      address,
      price: 0,
      positions: [],
      status: 'Tulossa'
    };

    const newInvoices = getNewInvoices();
    newInvoices.push(newInvoice);
    saveNewInvoices(newInvoices);

    localStorage.setItem(`tab_${newInvoiceId}`, 'tab1');

    window.location.href = `invoice.html?invoice=${newInvoiceId}`;
  });
});
