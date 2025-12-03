# 📱 OD Drive - Apps Mobile

> Aplicativos nativos para iOS e Android - Motorista e Gráfica

---

## 🎯 Sobre

Este projeto contém os aplicativos mobile **OD Drive Motorista** e **OD Drive Gráfica**, desenvolvidos com [Capacitor](https://capacitorjs.com) para rodar nativamente em iOS e Android.

**Status:** ✅ Pronto para build e publicação

---

## 📖 Documentação

### 🚀 [COMECE AQUI](./COMECE_AQUI.md)
Guia rápido para seu primeiro build (30 minutos)

### 📋 [RESUMO DAS MODIFICAÇÕES](./RESUMO_MODIFICACOES.md)
Lista completa do que foi implementado

### 📦 [GUIA DE BUILD](./MOBILE_BUILD.md)
Documentação técnica completa (iOS, Android, troubleshooting)

### 📝 [TEXTOS PARA LOJAS](./APP_STORE_TEXTS.md)
Descrições, screenshots, notas de revisão prontas

### ⚡ [SCRIPTS E COMANDOS](./SCRIPTS_BUILD.md)
Comandos rápidos, workflow, troubleshooting

---

## ⚡ Quick Start

```powershell
# 1. Configure o backend
# Edite: frontend/js/config.js
# Altere: export const API_BASE = 'https://SEU-BACKEND.com';

# 2. Sincronize com Android
npx cap sync android

# 3. Abra no Android Studio
npx cap open android

# 4. Conecte celular e clique Run ▶️
```

---

## 🏗️ Estrutura

```
app_oficial_odrive/
├── frontend/              # Assets web (HTML, CSS, JS)
│   ├── js/
│   │   ├── config.js      # ⚠️ Configure API_BASE aqui
│   │   ├── driver-native.js
│   │   └── graphic-native.js
│   ├── driver-mobile.html
│   ├── graphic-mobile.html
│   └── assets/
│       ├── splash-*.svg   # ⚠️ Substitua com logo real
│       └── icon-*.svg     # ⚠️ Substitua com ícone real
├── android/               # Projeto Android
├── capacitor.config.json  # Config Capacitor
├── COMECE_AQUI.md        # 👈 Guia rápido
└── MOBILE_BUILD.md       # 👈 Documentação completa
```

---

## 🎨 Personalize

### 1. Backend
Edite `frontend/js/config.js`:
```javascript
export const API_BASE = 'https://api.seudominio.com';
```

### 2. Splash Screen
Substitua: `frontend/assets/splash-driver.svg` (2732x2732px)

### 3. Ícone
Substitua: `frontend/assets/icon-driver.svg` (1024x1024px)

---

## 🚀 Apps

### OD Drive - Motorista
- **AppId:** com.oddrive.motorista
- **Plataformas:** Android ✅ | iOS ⏳ (requer macOS)
- **Status:** Pronto para build

### OD Drive - Gráfica
- **AppId:** com.oddrive.grafica
- **Plataformas:** Android ⏳ | iOS ⏳
- **Status:** Scripts prontos, projeto não inicializado

---

## 📋 Checklist

- [ ] Configure `API_BASE` em `config.js`
- [ ] Substitua splash screen e ícone
- [ ] Teste em dispositivo Android real
- [ ] Capture screenshots (mínimo 2)
- [ ] Publique política de privacidade
- [ ] Gere build AAB de produção
- [ ] Submeta para Google Play Store
- [ ] (iOS) Build e submeta para App Store

---

## 🛠️ Tecnologias

- **Framework:** Capacitor 7.4.4
- **Linguagens:** JavaScript ES6+, HTML5, CSS3
- **Plugins:** Camera, Preferences, Splash Screen
- **Plataformas:** Android 7.0+, iOS 15.0+

---

## 📞 Suporte

- 📖 Docs Capacitor: https://capacitorjs.com
- 📱 Android: https://developer.android.com
- 🍎 iOS: https://developer.apple.com
- 📧 Suporte projeto: suporte@seudominio.com

---

## 📄 Licença

Proprietário © 2024 OD Drive. Todos os direitos reservados.

---

**Desenvolvido com ❤️ usando Capacitor**
