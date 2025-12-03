const cardsEl = document.getElementById('cards');
const chipsEl = document.getElementById('chips');
const btnAdd = document.getElementById('btnAdd');
const btnImport = document.getElementById('btnImport');
const adminPromptModal = document.getElementById('adminPromptModal');
const adminPromptForm = document.getElementById('adminPromptForm');
const adminPromptTitle = document.getElementById('adminPromptTitle');
const adminPromptDescription = document.getElementById('adminPromptDescription');
const adminPromptFields = document.getElementById('adminPromptFields');
const adminPromptConfirm = document.getElementById('adminPromptConfirm');
const adminPromptCancel = document.getElementById('adminPromptCancel');

// Verifica autenticação admin
const adminToken = localStorage.getItem('adminToken');
if (!adminToken) {
  window.location.href = '/login.html';
}

// Função para fazer fetch com token
function authFetch(url, options = {}) {
  const headers = options.headers || {};
  headers['Authorization'] = `Bearer ${adminToken}`;
  return fetch(url, { ...options, headers });
}

// Função para logout
function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = '/login.html';
}


// Motion/feedback utilities
function setBusy(el, busy=true){
  try {
    if(!el) return;
    el.classList.toggle('is-busy', !!busy);
    el.setAttribute('aria-busy', busy ? 'true' : 'false');
    if(busy){
      if(!el.querySelector('.dot-loader')){
        const l = document.createElement('span');
        l.className = 'dot-loader';
        el.appendChild(l);
      }
      el.disabled = true;
    } else {
      const l = el.querySelector('.dot-loader'); if(l) l.remove();
      el.disabled = false;
    }
  } catch {}
}
function showOverlayBusy(){
  let o = document.querySelector('.overlay-busy');
  if(!o){
    o = document.createElement('div');
    o.className = 'overlay-busy';
    const spinner = document.createElement('div'); spinner.className = 'spinner';
    o.appendChild(spinner);
    document.body.appendChild(o);
  }
  o.classList.add('show');
}
function hideOverlayBusy(){
  const o = document.querySelector('.overlay-busy');
  if(o) o.classList.remove('show');
}
function toast(msg, type='info'){
  let root = document.querySelector('#toast-root');
  if(!root){
    root = document.createElement('div');
    root.id = 'toast-root';
    Object.assign(root.style, { position:'fixed', bottom:'16px', left:'50%', transform:'translateX(-50%)', zIndex: 10000 });
    document.body.appendChild(root);
  }
  const el = document.createElement('div');
  el.role = 'status'; el.ariaLive = 'polite';
  el.textContent = String(msg||'');
  Object.assign(el.style, {
    marginTop:'8px', background:'#101922', color:'#fff', padding:'10px 14px', borderRadius:'10px', boxShadow:'0 6px 24px rgba(0,0,0,.18)', fontWeight:'600'
  });
  if(type==='success'){ el.style.background = '#17b26a'; }
  if(type==='error'){ el.style.background = '#e53935'; }
  root.appendChild(el);
  setTimeout(()=>{ try{ el.remove(); }catch{} }, 2800);
}
// Reusable admin modal prompt with animated card
const __promptState = { cleanup: null };
function openAdminPrompt(opts = {}) {
  if (!adminPromptModal || !adminPromptForm) return Promise.resolve(null);
  if (__promptState.cleanup) { try { __promptState.cleanup(null, true); } catch {} }
  const {
    title='configurações', description='', confirmLabel='Confirmar', cancelLabel='Cancelar', fields=[]
  } = opts;
  return new Promise(resolve => {
    const card = adminPromptModal.querySelector('.modal-card');
    const dismissEls = Array.from(adminPromptModal.querySelectorAll('[data-admin-prompt-dismiss]'));
    adminPromptTitle.textContent = title;
    if (adminPromptDescription) {
      adminPromptDescription.textContent = description;
      adminPromptDescription.style.display = description ? '' : 'none';
    }
    if (adminPromptConfirm) adminPromptConfirm.textContent = confirmLabel;
    if (adminPromptCancel) adminPromptCancel.textContent = cancelLabel;
    adminPromptFields.innerHTML=''; adminPromptForm.reset();
    fields.forEach(f => {
      const group = document.createElement('div'); group.className='form-group';
      const label = document.createElement('label'); label.textContent = f.label || f.name || ''; label.setAttribute('for', `admin-prompt-${f.name}`);
      let input; const type = String(f.type||'text').toLowerCase();
      if (type==='textarea'){ input=document.createElement('textarea'); input.rows=f.rows||3; }
      else if (type==='select' && Array.isArray(f.options)) {
        input=document.createElement('select');
        if (f.placeholder){ const ph=document.createElement('option'); ph.value=''; ph.textContent=f.placeholder; ph.disabled=true; ph.selected=!f.value; input.appendChild(ph); }
        f.options.forEach(opt=>{ const o=document.createElement('option'); o.value=opt.value; o.textContent=opt.label??opt.value; input.appendChild(o); });
      } else if (type==='checkbox'){ input=document.createElement('input'); input.type='checkbox'; input.checked=!!f.value; }
      else { input=document.createElement('input'); input.type=f.inputType||'text'; if (f.placeholder) input.placeholder=f.placeholder; input.value=f.value??''; }
      input.id=`admin-prompt-${f.name}`; input.name=f.name||''; if (f.required) input.required=true; if (type==='checkbox'){} else { input.value=f.value??''; }
      group.append(label,input); adminPromptFields.appendChild(group);
    });
    let closed=false; const finish=(result)=>{
      if (closed) return; closed=true;
      document.removeEventListener('keydown',onKey); adminPromptForm.removeEventListener('submit',onSubmit); dismissEls.forEach(el=>el.removeEventListener('click',onDismiss)); __promptState.cleanup=null;
      if (!card){ adminPromptModal.classList.add('hidden'); adminPromptModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; return resolve(result); }
      card.classList.remove('is-visible'); card.classList.add('is-leaving'); card.addEventListener('animationend',()=>{ card.classList.remove('is-leaving'); adminPromptModal.classList.add('hidden'); adminPromptModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; resolve(result); },{once:true});
    };
    const onSubmit=(e)=>{ e.preventDefault(); const data={}; (fields||[]).forEach(f=>{ const el=adminPromptForm.elements[f.name]; if(!el) return; data[f.name]= el.type==='checkbox' ? el.checked : String(el.value||'').trim(); }); finish(data); };
    const onDismiss=()=>finish(null); const onKey=(e)=>{ if(e.key==='Escape'){ e.preventDefault(); onDismiss(); } };
    adminPromptForm.addEventListener('submit',onSubmit); dismissEls.forEach(el=>el.addEventListener('click',onDismiss)); document.addEventListener('keydown',onKey);
    __promptState.cleanup=(r=null,skip=false)=>{ if(skip){ closed=true; document.removeEventListener('keydown',onKey); adminPromptForm.removeEventListener('submit',onSubmit); dismissEls.forEach(el=>el.removeEventListener('click',onDismiss)); adminPromptModal.classList.add('hidden'); adminPromptModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; resolve(r); return;} finish(r); };
    adminPromptModal.classList.remove('hidden'); adminPromptModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; if(card){ card.classList.remove('is-leaving'); requestAnimationFrame(()=>card.classList.add('is-visible')); }
  });
}
let campaignsCache = [];
let activeFilter = 'ativa';

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchJSON(url, opts) {
  const res = await authFetch(url, opts);
  if (!res.ok) {
    if (res.status === 401) {
      logout();
      return;
    }
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

function formatStatus(status) {
  const value = String(status || '').toLowerCase();
  if (!value) return '-';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderCampaigns() {
  const filtered =
    activeFilter === '*'
      ? campaignsCache
      : campaignsCache.filter(
          campaign => String(campaign.status || '').toLowerCase() === activeFilter,
        );

  cardsEl.innerHTML = '';

  if (!filtered.length) {
    const placeholder = document.createElement('article');
    placeholder.className = 'card placeholder';
    placeholder.innerHTML = `
      <div class="card-head">
        <h3 class="m0">Vamos criar uma campanha?</h3>
        <span class="pill">Importar planilha</span>
      </div>
      <p class="small m0">Ainda não há campanhas para este filtro.</p>
    `;
    cardsEl.appendChild(placeholder);
    return;
  }

  for (const campaign of filtered) {
    const counts = campaign.counts || {};
    const reviewCount = counts.revisar || campaign.reviewCount || 0;
    const card = document.createElement('article');
    card.className = 'card';
    const canSync = Boolean(campaign.sheetId);

    const clientInfo = [
      campaign.client && escapeHTML(campaign.client),
      campaign.period && escapeHTML(campaign.period),
    ]
      .filter(Boolean)
      .join(' &middot; ');

    card.innerHTML = `
      <div class="card-head">
        <h3 class="m0">${escapeHTML(campaign.name)}</h3>
        <span class="pill${reviewCount > 0 ? ' warn' : ''}">${formatStatus(
          campaign.status,
        )}</span>
      </div>
      <div class="card-meta">${clientInfo || 'Sem cliente/periodo'}</div>
      <div class="counts">
        <div class="count">Agendado: ${counts.agendado || 0}</div>
        <div class="count">Confirmado: ${counts.confirmado || 0}</div>
        <div class="count">Instalado: ${counts.instalado || 0}</div>
        <div class="count">Revisar: ${reviewCount}</div>
      </div>
      <div class="card-actions">
        <a class="btn btn--primary" href="campaign.html?id=${encodeURIComponent(
          campaign.id,
        )}">Detalhes da campanha</a>
        <button class="btn btn--ghost" data-action="sync" data-id="${encodeURIComponent(
          campaign.id,
        )}" ${canSync ? '' : 'disabled title="Sem planilha vinculada"'}>Sincronizar</button>
        <button class="btn btn--danger" data-action="delete" data-id="${encodeURIComponent(
          campaign.id,
        )}">Excluir</button>
      </div>
    `;

    cardsEl.appendChild(card);
  }
}

async function loadCampaigns() {
  try {
    const data = await fetchJSON('/api/campaigns');
    campaignsCache = Array.isArray(data) ? data : [];
    renderCampaigns();
  } catch (err) {
    console.error(err);
    alert('Não foi possivel carregar as campanhas.');
  }
}

function setActiveFilter(filter) {
  activeFilter = filter;
  renderCampaigns();
}

function setupFilters() {
  if (!chipsEl) return;
  chipsEl.addEventListener('click', event => {
    const button = event.target.closest('.chip');
    if (!button) return;

    chipsEl.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
    button.classList.add('active');

    setActiveFilter(button.dataset.filter || '*');
  });
}

async function handleCreateCampaign() {
  const data = await openAdminPrompt({
    title: 'Nova campanha',
    description: 'Informe os dados principais.',
    confirmLabel: 'Criar campanha',
    fields: [
      { name: 'name', label: 'Nome da campanha', placeholder: 'Ex.: Sicoob /coca-cola', required: true },
      { name: 'client', label: 'Cliente', placeholder: 'Cliente' },
      { name: 'period', label: 'Período', placeholder: 'Ex.: Nov-Dez/24' },
    ],
  });
  if (!data) return;
  const { name, client = '', period = '' } = data;

  try {
    await fetchJSON('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, client, period }),
    });
    await loadCampaigns();
    toast('Campanha criada.', 'success');
  } catch (err) {
    console.error(err);
    toast('Não foi possível criar a campanha.', 'error');
  }
}

async function handleImportCampaign() {
  const data = await openAdminPrompt({
    title: 'Importar planilha do Google Sheets',
    description: 'Informe o ID da planilha e, opcionalmente, personalize os dados exibidos no painel.',
    confirmLabel: 'Importar',
    fields: [
      { name: 'spreadsheetId', label: 'ID da planilha', placeholder: '1abc...', required: true },
      { name: 'campaignName', label: 'Nome da campanha (painel)', placeholder: 'Opcional' },
      { name: 'client', label: 'Cliente (opcional)', placeholder: 'Cliente' },
      { name: 'period', label: 'Periodo (opcional)', placeholder: 'Ex.: Dez/24' },
      { name: 'sheetName', label: 'Nome da aba', value: 'Pagina1', placeholder: 'Pagina1' },
    ],
  });
  if (!data) return;
  const { spreadsheetId, campaignName = '', client = '', period = '', sheetName = 'Pagina1' } = data;

  setBusy(btnImport,true);

  try {
    const payload = {
      spreadsheetId: spreadsheetId.trim(),
      sheetName: sheetName.trim() || 'Pagina1',
      campaignName: campaignName.trim(),
      client: client.trim(),
      period: period.trim(),
    };

    const result = await fetchJSON('/api/imports/campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    toast(`Campanha importada. Motoristas v�lidos: ${result.imported}.`, 'success');
    await loadCampaigns();
  } catch (err) {
    console.error(err);
    const detail = err?.message ? ` (${err.message})` : '';
    toast('Não foi possivel importar a planilha.' + detail, 'error');
  } finally {
    setBusy(btnImport,false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  loadCampaigns();
  // opcional: buscar configuracao atual
  try { fetchJSON('/api/config').then(cfg => { console.debug('Config:', cfg); }).catch(() => {}); } catch (e) {}

  if (cardsEl) {
    cardsEl.addEventListener('click', async event => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const id = button.dataset.id;
      if (!id) return;

      if (button.dataset.action === 'sync') {
        event.preventDefault();
        if (button.disabled) return;
        const original = button.textContent;
        const previousDisabled = button.disabled;
        try {
          setBusy(button,true);
          await fetchJSON(`/api/campaigns/${id}/sync`, { method: 'POST' });
          await loadCampaigns();
          toast('Campanha sincronizada com sucesso.','success');
        } catch (err) {
          console.error(err);
          toast('Não foi possivel sincronizar a campanha.','error');
        } finally {
          if (document.body.contains(button)) {
            setBusy(button,false);
          }
        }
      }

      if (button.dataset.action === 'delete') {
        event.preventDefault();
        if (!confirm('Tem certeza que deseja excluir esta campanha? Essa ação não pode ser desfeita.')) {
          return;
        }
        const original = button.textContent;
        const previousDisabled = button.disabled;
        try {
          setBusy(button,true);
          const res = await authFetch(`/api/campaigns/${id}`, { method: 'DELETE' });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `HTTP ${res.status}`);
          }
          await loadCampaigns();
        } catch (err) {
          console.error(err);
          alert('Não foi possivel excluir a campanha.');
          if (document.body.contains(button)) {
            setBusy(button,false);
          }
        } finally {
          
        }
      }
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener('click', handleCreateCampaign);
  }

  if (btnImport) {
    btnImport.addEventListener('click', handleImportCampaign);
  }

  // Logout
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await authFetch('/api/admin/logout', { method: 'POST' });
      } catch (err) {
        console.error('Erro no logout:', err);
      }
      logout();
    });
  }

  // Histórico de auditoria
  const btnAuditLogs = document.getElementById('btnAuditLogs');
  if (btnAuditLogs) {
    btnAuditLogs.addEventListener('click', () => {
      window.location.href = '/audit-logs.html';
    });
  }

  // Exibe nome do usuário logado
  const adminUserName = document.getElementById('adminUserName');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  if (adminUserName && adminUser.name) {
    adminUserName.textContent = adminUser.name;
  }

});





















