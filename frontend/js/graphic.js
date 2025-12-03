const TOKEN_KEY = 'oddrive_graphic_token';

const loginSection = document.getElementById('graphicLogin');
const appSection = document.getElementById('graphicApp');
const loginForm = document.getElementById('graphicLoginForm');
const loginMessage = document.getElementById('graphicLoginMessage');
const loginButton = document.getElementById('graphicLoginSubmit');
const stepsContainer = document.getElementById('graphicSteps');
const welcomeEl = document.getElementById('graphicWelcome');
const campaignInfoEl = document.getElementById('graphicCampaignInfo');
const logoutButton = document.getElementById('graphicLogout');
const driverSelect = document.getElementById('graphicDriverSelect');
const driverHint = document.getElementById('graphicDriverHint');

let drivers = [];
let selectedDriverId = '';
let currentProfile = null;
let currentFlow = null;

let currentStepIndex = 0;
const stepData = new Map();
let isRefazer = false;
let overlayEl = null;
let tempDriverData = null; // holds new driver info when creating from graphic UI

function isPhotoStep(step = {}) {
  const type = String(step.type || '').toLowerCase();
  const id = String(step.id || '').toLowerCase();
  return type === 'photo' || type === 'foto' || id.includes('photo');
}

function isTextStep(step = {}) {
  const type = String(step.type || '').toLowerCase();
  return type === 'text' || type === 'nota' || type === 'notes';
}

function hasPhotoForStep(stepId) {
  return Boolean(stepData.get(stepId)?.photoData);
}

function isStepRequirementMet(step) {
  if (!step?.required) return true;
  if (isPhotoStep(step)) return hasPhotoForStep(step.id);
  if (isTextStep(step)) {
    const raw = stepData.get(step.id)?.notes;
    return typeof raw === 'string' && raw.trim().length > 0;
  }
  return true;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(value) {
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

async function authedFetch(url, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    setToken(null);
    throw new Error('Sessao expirada. Faca login novamente.');
  }
  return response;
}

function showLogin(message = '') {
  loginSection.classList.remove('hidden');
  appSection.classList.add('hidden');
  if (message) loginMessage.textContent = message;
}

function showApp() {
  loginSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  loginMessage.textContent = '';
}

function updateDriverHint() {
  if (!driverHint) return;
  if (!selectedDriverId) {
    driverHint.textContent = 'Selecione um motorista para enviar as imagens.';
  } else {
    if (selectedDriverId === '__new__' && tempDriverData) {
      driverHint.textContent = `Criando e enviando para: ${tempDriverData.name}`;
    } else {
      const driver = drivers.find(d => d.id === selectedDriverId);
      driverHint.textContent = driver ? `Enviando para: ${driver.name}` : 'Selecione um motorista para enviar as imagens.';
    }
  }
}

function ensureDriverSelected() {
  if (!selectedDriverId) {
    updateDriverHint();
    return false;
  }
  return true;
}

function resetFlowProgress() {
  currentStepIndex = 0;
  stepData.clear();
}

function isMobileDevice() {
  try {
    const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
    return /android|iphone|ipad|ipod|windows phone|mobile/.test(ua) || isTouch;
  } catch {
    return false;
  }
}

function isSecure() {
  try {
    return window.isSecureContext;
  } catch {
    return false;
  }
}

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.className = 'overlay';
  overlayEl.innerHTML = `
    <div class="overlay-card" id="graphicOverlayCard">
      <div class="spinner"></div>
      <div id="graphicOverlayText" class="small">Enviando...</div>
    </div>`;
  document.body.appendChild(overlayEl);
  return overlayEl;
}

function showLoading(text = 'Enviando...') {
  ensureOverlay();
  overlayEl.querySelector('#graphicOverlayText').textContent = text;
  overlayEl.classList.add('show');
}

function hideLoading() {
  if (overlayEl) overlayEl.classList.remove('show');
}

function showSuccess(message = 'Envio concluido!') {
  ensureOverlay();
  const card = overlayEl.querySelector('#graphicOverlayCard');
  card.innerHTML = `<div style="font-size:32px;font-weight:700;">OK</div><h3 style="margin:8px 0;">${message}</h3>`;
  overlayEl.classList.add('show');
  setTimeout(() => {
    try {
      overlayEl.classList.remove('show');
      // insert persistent panel with refazer
      if (typeof stepsContainer !== 'undefined' && stepsContainer) {
        stepsContainer.innerHTML = '';
        const done = document.createElement('article');
        done.id = 'graphicPersistentSuccess';
        done.innerHTML = `
          <div class="step-head">
            <h3>Processo realizado com sucesso!</h3>
            <span class="pill">ok</span>
          </div>
          <div class="step-body">
            <p class="small">Obrigado! Suas fotos foram enviadas com sucesso.</p>
            <div style="margin-top:12px;display:flex;gap:12px;justify-content:flex-end;">
              <button id="btnGraphicRefazer" class="btn">refazer</button>
            </div>
          </div>`;
        stepsContainer.appendChild(done);
        const btn = document.getElementById('btnGraphicRefazer');
        if (btn) btn.addEventListener('click', () => {
          resetFlowProgress();
          isRefazer = true;
          renderFlow(currentFlow);
        });
      }
    } catch (err) { console.error(err); }
    isRefazer = false;
  }, 800);

  // If we created a new driver, refresh session to get the updated drivers list
  if (tempDriverData) {
    setTimeout(() => {
      try { loadSession(); tempDriverData = null; } catch {};
    }, 1200);
  }
}

function ensureGlobalMobileWarning() {
  if (isMobileDevice() || !stepsContainer) return;
  let warn = document.getElementById('graphicMobileWarning');
  if (!warn) {
    warn = document.createElement('div');
    warn.id = 'graphicMobileWarning';
    warn.className = 'small';
    warn.style = 'margin:10px 0;padding:10px;border:1px solid var(--line);border-radius:10px;background:#fff6f0;color:#9a4b00;';
    warn.textContent = 'Use a area da grafica pelo celular. A câmera so funciona via HTTPS.';
    const parent = stepsContainer.parentNode;
    if (parent) parent.insertBefore(warn, stepsContainer);
  }
}

function buildSimplePhotoUI(stepId, onStateChange = () => {}) {
  const container = document.createElement('div');
  container.style = 'display:flex;flex-direction:column;gap:10px;';

  const preview = document.createElement('img');
  preview.alt = 'Previa da imagem';
  preview.style = 'max-width:100%;border:1px solid var(--line);border-radius:10px;display:none;';
  container.appendChild(preview);

  const controls = document.createElement('div');
  controls.style = 'display:flex;gap:10px;flex-wrap:wrap;';
  container.appendChild(controls);

  const btnSnap = document.createElement('button');
  btnSnap.className = 'btn btn--primary';
  btnSnap.type = 'button';
  btnSnap.textContent = 'Abrir câmera';
  const btnRetake = document.createElement('button');
  btnRetake.className = 'btn';
  btnRetake.type = 'button';
  btnRetake.textContent = 'Refazer';
  btnRetake.disabled = true;
  controls.append(btnSnap, btnRetake);

  const file = document.createElement('input');
  file.type = 'file';
  file.accept = 'image/*';
  try { file.capture = 'environment'; } catch {}
  file.style = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.appendChild(file);

  file.onchange = async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => { await compressAndPreview(reader.result); };
    reader.readAsDataURL(f);
  };

  const videoWrap = document.createElement('div');
  videoWrap.style = 'position:relative;';
  const video = document.createElement('video');
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  video.style = 'width:100%;border:1px solid var(--line);border-radius:10px;display:none;';
  videoWrap.appendChild(video);
  container.appendChild(videoWrap);

  function showMobileOnlyWarning(customText) {
    const existing = container.querySelectorAll('.camera-warning');
    existing.forEach(el => el.remove());
    const warn = document.createElement('div');
    warn.className = 'small camera-warning';
    warn.style = 'padding:10px;border:1px solid var(--line);border-radius:10px;background:#fff6f0;color:#9a4b00;';
    const parts = [];
    if (customText) parts.push(customText);
    else parts.push('Tire uma foto bem visivel com qualidade.');
    if (!isMobileDevice()) parts.push('Acesse pelo celular.');
    if (!isSecure()) parts.push('Requer HTTPS para abrir a câmera (ex.: https://seu-endereco).');
    warn.textContent = parts.join(' ');
    container.appendChild(warn);
  }

  function clearWarning() {
    container.querySelectorAll('.camera-warning').forEach(el => el.remove());
  }

  function compressAndPreview(dataUrl) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1280;
        const scale = Math.min(1, maxW / (img.width || maxW));
        const w = Math.round((img.width || maxW) * scale);
        const h = Math.round((img.height || (maxW * 0.75)) * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        preview.src = compressed;
        preview.style.display = 'block';
        btnRetake.disabled = false;
        stepData.set(stepId, { ...(stepData.get(stepId) || {}), photoData: compressed });
        onStateChange(stepId);
        resolve();
      };
      img.src = dataUrl;
    });
  }

  const resetCaptureState = () => {
    preview.style.display = 'none';
    preview.src = '';
    btnRetake.disabled = true;
    stepData.delete(stepId);
    onStateChange(stepId);
  };

  async function openCamera() {
    if (!ensureDriverSelected()) {
      showMobileOnlyWarning('Selecione um motorista antes de capturar a foto.');
      return;
    }
    try {
      const canMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      if (!isMobileDevice() || !canMedia || !isSecure()) {
        file.click();
        showMobileOnlyWarning('Modo desenvolvimento: abrindo seletor de imagem.');
        return;
      }
      clearWarning();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      video.srcObject = stream;
      video.style.display = 'block';
      preview.style.display = 'none';
      btnRetake.disabled = false;

      btnSnap.textContent = 'Capturar';
      btnSnap.onclick = async () => {
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings ? track.getSettings() : {};
        const w = settings.width || video.videoWidth || 1280;
        const h = settings.height || video.videoHeight || 720;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        stream.getTracks().forEach(t => t.stop());
        video.style.display = 'none';
        await compressAndPreview(dataUrl);
        btnSnap.textContent = 'Reabrir câmera';
        btnSnap.onclick = () => openCamera();
      };

      btnRetake.onclick = () => {
        try { stream.getTracks().forEach(t => t.stop()); } catch {}
        resetCaptureState();
        btnSnap.textContent = 'Abrir câmera';
        btnSnap.onclick = () => openCamera();
        openCamera();
      };
    } catch (err) {
      console.warn('Falha ao acessar câmera', err);
      showMobileOnlyWarning('Não foi possível abrir a câmera. Verifique permissões e tente novamente.');
    }
  }

  btnSnap.onclick = () => openCamera();
  btnRetake.onclick = () => {
    resetCaptureState();
    openCamera();
  };
  if (!isMobileDevice() || !isSecure()) showMobileOnlyWarning();

  const saved = stepData.get(stepId);
  if (saved?.photoData) {
    preview.src = saved.photoData;
    preview.style.display = 'block';
    btnRetake.disabled = false;
    onStateChange(stepId);
  }

  return container;
}

function buildNotesUI(stepId, onStateChange = () => {}) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <label class="small" style="display:block;margin-bottom:6px;">Observacoes da grafica (opcional)</label>
    <textarea id="graphicNotesField" rows="4" placeholder="Registre orientacoes importantes para o motorista" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:10px;"></textarea>
  `;
  const textarea = wrapper.querySelector('#graphicNotesField');
  const saved = stepData.get(stepId);
  if (saved?.notes) textarea.value = saved.notes;
  textarea.addEventListener('input', () => {
    stepData.set(stepId, { notes: textarea.value });
    onStateChange(stepId);
  });
  return wrapper;
}

async function uploadEvidence({ step, photoData, notes }) {
  if (!ensureDriverSelected()) throw new Error('Selecione um motorista.');
  const payload = { step };
  if (selectedDriverId && selectedDriverId !== '__new__') payload.driverId = selectedDriverId;
  if (selectedDriverId === '__new__' && tempDriverData) payload.driver = tempDriverData; // send driver data for creation
  if (photoData) payload.photoData = photoData;
  if (typeof notes === 'string') payload.notes = notes;

  if (typeof isRefazer !== 'undefined') payload.refazer = Boolean(isRefazer);

  const res = await authedFetch('/api/session/evidence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Falha ao registrar (${res.status})`);
  }
  return res.json();
}

function renderFlow(flow = currentFlow) {
  currentFlow = flow;
  const steps = Array.isArray(flow?.steps) ? flow.steps : [];

  if (!stepsContainer) return;

  if (!steps.length) {
    stepsContainer.innerHTML = '<p class="small muted">Nenhum fluxo configurado para a area da grafica.</p>';
    return;
  }

  if (!drivers.length) {
    stepsContainer.innerHTML = '<p class="small muted">Cadastre motoristas na campanha para liberar o envio.</p>';
    return;
  }

  if (!ensureDriverSelected()) {
    stepsContainer.innerHTML = '<p class="small muted">Selecione um motorista para iniciar o envio das fotos.</p>';
    return;
  }

  if (currentStepIndex >= steps.length) currentStepIndex = steps.length - 1;
  const step = steps[currentStepIndex];

  stepsContainer.innerHTML = '';
  requestAnimationFrame(() => {
    try { window.scrollTo({ top: 0, behavior: currentStepIndex === 0 ? 'auto' : 'smooth' }); } catch {}
  });
  const wrapper = document.createElement('div');
  wrapper.className = 'step-item';

  const head = document.createElement('div');
  head.className = 'step-head';
  head.innerHTML = `<h3>${step.label}</h3><span class="pill">${step.type}</span>`;
  wrapper.appendChild(head);

  const body = document.createElement('div');
  body.className = 'step-body';
  let navBusy = false;
  let refreshNextButtonState = () => {};

  const driverInfo = document.createElement('p');
  driverInfo.className = 'small muted';
  const driver = drivers.find(d => d.id === selectedDriverId);
  driverInfo.textContent = driver ? `Motorista selecionado: ${driver.name}` : '';
  body.appendChild(driverInfo);

  if (isPhotoStep(step)) {
    body.appendChild(buildSimplePhotoUI(step.id, () => refreshNextButtonState()));
  } else if (isTextStep(step)) {
    body.appendChild(buildNotesUI(step.id, () => refreshNextButtonState()));
  }

  const actions = document.createElement('div');
  actions.style = 'display:flex;gap:12px;margin-top:12px;justify-content:flex-end;';

  const btnPrev = document.createElement('button');
  btnPrev.className = 'btn';
  btnPrev.type = 'button';
  btnPrev.textContent = 'Voltar';
  btnPrev.disabled = currentStepIndex === 0;
  btnPrev.onclick = () => {
    if (navBusy) return;
    if (currentStepIndex > 0) {
      currentStepIndex -= 1;
      renderFlow(currentFlow);
      ensureGlobalMobileWarning();
    }
  };

  const btnNext = document.createElement('button');
  btnNext.className = 'btn btn--primary';
  btnNext.type = 'button';
  btnNext.textContent = currentStepIndex === steps.length - 1 ? 'Concluir' : 'Avançar';
  refreshNextButtonState = () => {
    btnPrev.disabled = navBusy || currentStepIndex === 0;
    if (navBusy) {
      btnNext.disabled = true;
      return;
    }
    if (!step.required) {
      btnNext.disabled = false;
      return;
    }
    if (isPhotoStep(step)) {
      btnNext.disabled = !hasPhotoForStep(step.id);
      return;
    }
    if (isTextStep(step)) {
      const raw = stepData.get(step.id)?.notes;
      btnNext.disabled = !(typeof raw === 'string' && raw.trim().length > 0);
      return;
    }
    btnNext.disabled = false;
  };
  refreshNextButtonState();
  btnNext.onclick = async () => {
    if (navBusy) return;
    if (!ensureDriverSelected()) {
      alert('Selecione um motorista para continuar.');
      return;
    }
    if (step.required && isPhotoStep(step) && !hasPhotoForStep(step.id)) {
      alert('Capture a foto antes de avançar.');
      return;
    }
    if (step.required && isTextStep(step)) {
      const raw = stepData.get(step.id)?.notes;
      if (!(typeof raw === 'string' && raw.trim().length > 0)) {
        alert('Digite as observações antes de avançar.');
        return;
      }
    }

    const data = stepData.get(step.id) || {};
    try {
      navBusy = true;
      refreshNextButtonState();
      showLoading(currentStepIndex === steps.length - 1 ? 'Concluindo...' : 'Enviando...');
      const hasPayload =
        (isPhotoStep(step) && data.photoData) ||
        (isTextStep(step) && typeof data.notes === 'string' && data.notes.trim().length);
      if (hasPayload) {
        await uploadEvidence({ step: step.id, ...data });
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Falha ao enviar. Tente novamente.');
      navBusy = false;
      hideLoading();
      refreshNextButtonState();
      return;
    }

    navBusy = false;
    if (currentStepIndex < steps.length - 1) {
      currentStepIndex += 1;
      hideLoading();
      renderFlow(currentFlow);
      ensureGlobalMobileWarning();
    } else {
      hideLoading();
      showSuccess('Registro finalizado com sucesso!');
    }
  };

  actions.append(btnPrev, btnNext);
  wrapper.appendChild(body);
  wrapper.appendChild(actions);
  stepsContainer.appendChild(wrapper);
}

function renderDriverOptions(list = []) {
  const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', ignorePunctuation: true });
  drivers = Array.isArray(list) ? [...list].sort((a, b) => collator.compare(a?.name || '', b?.name || '')) : [];

  driverSelect.innerHTML = '';
  if (!drivers.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Nenhum motorista disponivel';
    driverSelect.appendChild(option);
    driverSelect.disabled = true;
    selectedDriverId = '';
    updateDriverHint();
    stepsContainer.innerHTML = '<p class="small muted">Cadastre motoristas na campanha para liberar o envio.</p>';
    return;
  }

  driverSelect.disabled = false;
  drivers.forEach(driver => {
    const option = document.createElement('option');
    option.value = driver.id;
    option.textContent = driver.name || '(sem nome)';
    driverSelect.appendChild(option);
  });

  // Option to create a new motorista on-the-fly
  const addOpt = document.createElement('option');
  addOpt.value = '__new__';
  addOpt.textContent = 'Adicionar novo motorista...';
  driverSelect.appendChild(addOpt);

  if (!drivers.some(d => d.id === selectedDriverId)) {
    selectedDriverId = drivers[0]?.id || '';
  }

  driverSelect.value = selectedDriverId;
  updateDriverHint();
  resetFlowProgress();
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = {
    campaignCode: formData.get('campaignCode')?.trim(),
    name: formData.get('name')?.trim(),
  };

  if (!payload.campaignCode || !payload.name) {
    loginMessage.textContent = 'Informe o codigo da campanha e o nome do responsavel.';
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = 'Entrando...';
  loginMessage.textContent = '';

  try {
    const response = await fetch('/api/session/graphic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Nao foi possivel fazer login.');
    }
    const data = await response.json();
    setToken(data.token);
    currentProfile = data;
    await loadSession();
  } catch (err) {
    console.error(err);
    loginMessage.textContent = err.message || 'Falha ao fazer login.';
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Entrar';
  }
}

async function loadSession() {
  const token = getToken();
  if (!token) {
    showLogin();
    return;
  }

  try {
    stepsContainer.innerHTML = '<p class="small">Carregando dados da campanha...</p>';
    const [profileRes, driversRes, flowRes] = await Promise.all([
      authedFetch('/api/session/me'),
      authedFetch('/api/session/graphic/drivers'),
      authedFetch('/api/session/flow'),
    ]);

    const profile = await profileRes.json();
    const driversData = await driversRes.json();
    const flowData = await flowRes.json();
    currentProfile = profile;
    currentFlow = flowData;
    isRefazer = false;
    resetFlowProgress();

    welcomeEl.textContent = profile?.graphic?.responsible
      ? `Ola, ${profile.graphic.responsible}`
      : 'Grafica conectada';
    campaignInfoEl.textContent = profile?.campaign?.name
      ? `Campanha: ${profile.campaign.name}`
      : '';

    renderDriverOptions(driversData?.drivers || []);
    ensureGlobalMobileWarning();
    renderFlow(currentFlow);
    showApp();
  } catch (err) {
    console.error(err);
    setToken(null);
    showLogin(err.message || 'Sessao expirada. Faca login novamente.');
  }
}

function handleLogout() {
  setToken(null);
  drivers = [];
  selectedDriverId = '';
  currentProfile = null;
  currentFlow = null;
  resetFlowProgress();
  if (stepsContainer) stepsContainer.innerHTML = '<p class="small">Faca login para iniciar.</p>';
  showLogin('Voce saiu da sessao.');
}

document.addEventListener('DOMContentLoaded', () => {
  loginForm?.addEventListener('submit', handleLogin);
  logoutButton?.addEventListener('click', handleLogout);
  driverSelect?.addEventListener('change', event => {
    const prev = selectedDriverId;
    selectedDriverId = event.target.value || '';
    if (selectedDriverId === '__new__') {
      // prompt minimal info
      const name = window.prompt('Nome do motorista (obrigatorio):');
      if (!name || !String(name).trim()) {
        // cancel and revert
        selectedDriverId = prev || '';
        driverSelect.value = selectedDriverId;
        updateDriverHint();
        return;
      }
      const phone = window.prompt('Telefone do motorista (opcional):');
      const cpf = window.prompt('CPF do motorista (opcional):');
      const plate = window.prompt('Placa do veiculo (opcional):');
      const email = window.prompt('Email do motorista (opcional):');
      tempDriverData = { name: String(name).trim(), phone: String(phone || '').trim(), cpf: String(cpf || '').trim(), plate: String(plate || '').trim(), email: String(email || '').trim() };
      // keep selectedDriverId as special marker
      updateDriverHint();
      resetFlowProgress();
      renderFlow(currentFlow);
      ensureGlobalMobileWarning();
      return;
    }
    updateDriverHint();
    resetFlowProgress();
    renderFlow(currentFlow);
    ensureGlobalMobileWarning();
  });
  loadSession();
});
