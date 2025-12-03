const TOKEN_KEY = 'oddrive_driver_token';
const loginSection = document.getElementById('driverLogin');
const appSection = document.getElementById('driverApp');
const loginForm = document.getElementById('driverLoginForm');
const loginMessage = document.getElementById('driverLoginMessage');
const loginButton = document.getElementById('driverLoginSubmit');
const stepsContainer = document.getElementById('driverSteps');
const welcomeEl = document.getElementById('driverWelcome');
const campaignInfoEl = document.getElementById('driverCampaignInfo');
const logoutButton = document.getElementById('driverLogout');

const stepData = new Map(); // stepId -> { photoData?, odometerValue? }
let currentStepIndex = 0;
let currentFlow = null;
let isRefazer = false;

function isPhotoStep(step = {}) {
  const type = String(step.type || '').toLowerCase();
  const id = String(step.id || '').toLowerCase();
  return type === 'photo' || type === 'foto' || id.includes('photo');
}
function isNumberStep(step = {}) {
  const type = String(step.type || '').toLowerCase();
  const id = String(step.id || '').toLowerCase();
  return type === 'number' || type === 'numero' || id.includes('odometer-value');
}
function hasPhotoForStep(stepId) {
  return Boolean(stepData.get(stepId)?.photoData);
}
function normalizeNumericValue(stepId) {
  const raw = stepData.get(stepId)?.odometerValue;
  return Number(String(raw || '').replace(/\D+/g, ''));
}
function isNumericValueValid(stepId) {
  const num = normalizeNumericValue(stepId);
  return Number.isFinite(num) && num > 0;
}
function isStepRequirementMet(step) {
  if (!step?.required) return true;
  if (isPhotoStep(step)) return hasPhotoForStep(step.id);
  if (isNumberStep(step)) return isNumericValueValid(step.id);
  return true;
}

function getToken() { return localStorage.getItem(TOKEN_KEY); }

function buildSimplePhotoUI(stepId, onStateChange = () => {}) {
  const container = document.createElement('div');
  container.style = 'display:flex;flex-direction:column;gap:10px;';

  const preview = document.createElement('img');
  preview.alt = 'Prévia';
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

  // Fallback DEV: input file invisível mas clicável por script (iOS não aceita display:none)
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
    if (existing.length) existing.forEach(el => el.remove());
    const warn = document.createElement('div');
    warn.className = 'small camera-warning';
    warn.style = 'padding:10px;border:1px solid var(--line);border-radius:10px;background:#fff6f0;color:#9a4b00;';
    const parts = [];
    if (customText) parts.push(customText);
    else parts.push('Tire uma foto bem visível com qualidade.');
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
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
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
    try {
      // Prefer getUserMedia quando possível; senão, usar fallback do input[file]
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

  const existing = stepData.get(stepId);
  if (existing?.photoData) {
    preview.src = existing.photoData;
    preview.style.display = 'block';
    btnRetake.disabled = false;
    onStateChange(stepId);
  }

  return container;
}

function ensureGlobalMobileWarning() {
  if (isMobileDevice() || !stepsContainer) return;
  let warn = document.getElementById('driverMobileWarning');
  if (!warn) {
    warn = document.createElement('div');
    warn.id = 'driverMobileWarning';
    warn.className = 'small';
    warn.style = 'margin:10px 0;padding:10px;border:1px solid var(--line);border-radius:10px;background:#fff6f0;color:#9a4b00;';
    warn.textContent = 'Use a área do motorista pelo celular. A câmera só funciona via HTTPS.';
    const parent = stepsContainer.parentNode;
    if (parent) parent.insertBefore(warn, stepsContainer);
  }
}


function isMobileDevice() {
  try {
    const ua = (navigator.userAgent || navigator.vendor || window.opera || "").toLowerCase();
    const isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints || 0) > 0;
    return /android|iphone|ipad|ipod|windows phone|mobile/.test(ua) || isTouch;
  } catch {
    return false;
  }
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
    throw new Error('Sessão expirada. Faça login novamente.');
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

// Loading / success overlay
let overlayEl = null;
function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.className = 'overlay';
  overlayEl.innerHTML = `
    <div class="overlay-card" id="overlayCard">
      <div class="spinner"></div>
      <div id="overlayText" class="small">Enviando...</div>
    </div>`;
  document.body.appendChild(overlayEl);
  return overlayEl;
}
function showLoading(text='Enviando...') {
  ensureOverlay();
  overlayEl.querySelector('#overlayText').textContent = text;
  overlayEl.classList.add('show');
}
function hideLoading() {
  if (overlayEl) overlayEl.classList.remove('show');
}
function showSuccess(message='Concluído com sucesso! Obrigado.') {
  ensureOverlay();
  const card = overlayEl.querySelector('#overlayCard');
  card.innerHTML = `<div style="font-size:48px;">âœ…</div><h3 style="margin:8px 0;">${message}</h3>`;
  overlayEl.classList.add('show');
  // Brief overlay, then insert a persistent in-app success panel with 'refazer'
  setTimeout(() => {
    try {
      overlayEl.classList.remove('show');
      if (typeof stepsContainer !== 'undefined' && stepsContainer) {
        stepsContainer.innerHTML = '';
        const done = document.createElement('article');
        done.id = 'persistentSuccessPanel';
        done.innerHTML = `
          <div class="step-head">
            <h3>Processo realizado com sucesso!</h3>
            <span class="pill">ok</span>
          </div>
          <div class="step-body">
            <p class="small">Obrigado! Suas fotos foram enviadas com sucesso.</p>
            <div style="margin-top:12px;display:flex;gap:12px;justify-content:flex-end;">
              <button id="btnRefazer" class="btn">refazer</button>
            </div>
          </div>`;
        stepsContainer.appendChild(done);

        const btn = document.getElementById('btnRefazer');
        if (btn) btn.addEventListener('click', () => {
          try { stepData.clear?.(); } catch {}
          isRefazer = true;
          currentStepIndex = 0;
          stepsContainer.innerHTML = '';
          ensureGlobalMobileWarning?.();
          renderFlow(currentFlow);
        });
      }
    } catch (err) { console.error(err); }
    // reset transient flag (will be set only when user clicks refazer)
    isRefazer = false;
  }, 700);
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = {
    name: formData.get('name')?.trim(),
    phone: formData.get('phone')?.trim(),
  };

  if (!payload.name || !payload.phone) {
    loginMessage.textContent = 'Informe seu nome e número de celular.';
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = 'Entrando...';
  loginMessage.textContent = '';

  try {
    const response = await fetch('/api/session/driver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Não foi possível fazer login.');
    }
    const data = await response.json();
    setToken(data.token);
    await loadSession();
  } catch (err) {
    console.error(err);
    loginMessage.textContent = err.message || 'Falha ao fazer login.';
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Entrar';
  }
}

function isSecure() {
  try { return window.isSecureContext; } catch { return false; }
}

function renderFlow(flow) {
  currentFlow = flow || currentFlow;
  const steps = Array.isArray(currentFlow?.steps) ? currentFlow.steps : [];
  if (!steps.length) {
    stepsContainer.innerHTML = '<p class="small">Nenhuma atividade pendente no momento.</p>';
    return;
  }
  stepsContainer.innerHTML = '';
  requestAnimationFrame(() => {
    try {
      window.scrollTo({ top: 0, behavior: currentStepIndex === 0 ? 'auto' : 'smooth' });
    } catch {}
  });

  const step = steps[currentStepIndex];
  const wrapper = document.createElement('div');
  wrapper.className = 'step-item';

  const head = document.createElement('div');
  head.className = 'step-head';
  head.innerHTML = `<h3>${step.label}</h3><span class="pill ${step.required ? 'pill-required' : ''}">${step.type}</span>`;
  wrapper.appendChild(head);

  const body = document.createElement('div');
  body.className = 'step-body';
  let navBusy = false;
  let refreshNextButtonState = () => {};

  if (isPhotoStep(step)) {
    body.appendChild(buildSimplePhotoUI(step.id, () => refreshNextButtonState()));
  }
  if (isNumberStep(step)) {
    body.appendChild(
      buildNumberInputUI(step.id, 'Informe a quilometragem do odômetro', () => refreshNextButtonState()),
    );
  }

  const actions = document.createElement('div');
  actions.style = 'display:flex;gap:12px;margin-top:12px;justify-content:flex-end';
  const btnPrev = document.createElement('button');
  btnPrev.className = 'btn';
  btnPrev.type = 'button';
  btnPrev.textContent = 'Voltar';
  btnPrev.disabled = currentStepIndex === 0;
  btnPrev.onclick = () => {
    if (navBusy) return;
    if (currentStepIndex > 0) {
      currentStepIndex -= 1;
      renderFlow(flow);
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
    if (isNumberStep(step)) {
      btnNext.disabled = !isNumericValueValid(step.id);
      return;
    }
    btnNext.disabled = false;
  };
  refreshNextButtonState();

  btnNext.onclick = async () => {
    if (navBusy) return;
    const s = steps[currentStepIndex];
    if (s.required && isPhotoStep(s) && !hasPhotoForStep(s.id)) {
      alert(`Capture ${s.label || 'a imagem'} antes de avançar.`);
      return;
    }
    if (s.required && isNumberStep(s) && !isNumericValueValid(s.id)) {
      alert('Informe a quilometragem válida antes de continuar.');
      return;
    }

    // upload per step
    try {
      navBusy = true;
      refreshNextButtonState();
      showLoading(currentStepIndex === steps.length - 1 ? 'Concluindo...' : 'Enviando...');
      const payload = stepData.get(s.id) || {};
      if (Object.keys(payload).length) {
        await uploadEvidence({ step: s.id, ...payload, refazer: Boolean(isRefazer) });
      }
    } catch (e) {
      console.error(e);
      alert('Falha ao enviar evidência. Tente novamente.');
      navBusy = false;
      hideLoading();
      refreshNextButtonState();
      return;
    }

    navBusy = false;
    if (currentStepIndex < steps.length - 1) {
      hideLoading();
      currentStepIndex += 1;
      ensureGlobalMobileWarning();
      renderFlow(flow);
    } else {
      hideLoading();
      showSuccess('Processo realizado com sucesso! Obrigado!');
    }
  };
  actions.appendChild(btnPrev);
  actions.appendChild(btnNext);

  wrapper.appendChild(body);
  wrapper.appendChild(actions);
  stepsContainer.appendChild(wrapper);
}

function buildNumberInputUI(stepId, label, onStateChange = () => {}) {
  const c = document.createElement('div');
  c.innerHTML = `
    <label class="small" style="display:block;margin-bottom:6px;">${label}</label>
    <input type="tel" inputmode="numeric" pattern="[0-9]*" placeholder="Ex: 123456" class="driver-input" id="odometerInput" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:10px;" />
  `;
  const input = c.querySelector('#odometerInput');
  input.value = stepData.get(stepId)?.odometerValue || '';
  input.addEventListener('input', () => {
    stepData.set(stepId, { odometerValue: input.value });
    onStateChange(stepId);
  });
  return c;
}


async function uploadEvidence({ step, photoData, odometerValue, refazer } = {}) {
  const res = await authedFetch('/api/session/evidence', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step, photoData, odometerValue, refazer })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
  return res.json();
}

async function loadSession() {
  const token = getToken();
  if (!token) {
    showLogin();
    return;
  }

  try {
    const [profileRes, flowRes] = await Promise.all([
      authedFetch('/api/session/me'),
      authedFetch('/api/session/flow'),
    ]);

    const profile = await profileRes.json();
    const flow = await flowRes.json();
    currentFlow = flow;
    isRefazer = false;
    stepData.clear();
    currentStepIndex = 0;

    welcomeEl.textContent = profile?.driver?.name
      ? `Olá!, ${profile.driver.name}!`
      : 'Olá!, motorista!';

    campaignInfoEl.textContent = profile?.campaign?.name
      ? `Campanha: ${profile.campaign.name}`
      : '';

    ensureGlobalMobileWarning();
    renderFlow(currentFlow);
    showApp();
  } catch (err) {
    console.error(err);
    setToken(null);
    showLogin(err.message || 'Sessão expirada. Faça login novamente.');
  }
}

function handleLogout() {
  setToken(null);
  showLogin('Você saiu da sessão.');
}

document.addEventListener('DOMContentLoaded', () => {
  loginForm?.addEventListener('submit', handleLogin);
  logoutButton?.addEventListener('click', handleLogout);
  loadSession();
});













