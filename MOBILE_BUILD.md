# 📱 OD Drive - Apps Mobile (iOS & Android)

Este documento descreve como preparar, compilar e publicar os aplicativos **OD Drive Motorista** e **OD Drive Gráfica** nas lojas Apple App Store e Google Play Store.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Configuração do Backend](#configuração-do-backend)
5. [Build Android](#build-android)
6. [Build iOS](#build-ios)
7. [Personalizando Splash Screen e Ícones](#personalizando-splash-screen-e-ícones)
8. [Checklist para Publicação](#checklist-para-publicação)
9. [Notas para App Store Review](#notas-para-app-store-review)
10. [Troubleshooting](#troubleshooting)

---

## 🔍 Visão Geral

Este projeto utiliza **Capacitor** para empacotar o frontend HTML/JS em apps nativos para **Android** e **iOS**. 

### Diferenças dos apps nativos vs web:

- ✅ **Armazenamento seguro** de tokens (Capacitor Preferences)
- ✅ **Câmera nativa** via plugin Camera (melhor compatibilidade e performance)
- ✅ **Splash Screen** profissional com logo personalizado
- ✅ **Permissões nativas** configuradas (câmera, armazenamento)
- ✅ **APIs nativas** integradas (sem dependência de getUserMedia web)

---

## ⚙️ Pré-requisitos

### Para desenvolvimento e build Android:
- **Node.js** v18+ e npm
- **Android Studio** (última versão)
- **Java JDK** 17+ (instalado e configurado via Android Studio)
- Conta **Google Play Console** (US$ 25 taxa única)

### Para build iOS (OBRIGATÓRIO macOS):
- **macOS** (Ventura 13+ ou Sonoma 14+)
- **Xcode** 15+ (baixar da App Store)
- **CocoaPods** (`sudo gem install cocoapods`)
- Conta **Apple Developer** (US$ 99/ano)
- Certificado de desenvolvedor Apple configurado

### Ferramentas adicionais:
```powershell
# Instalar Capacitor CLI globalmente (opcional)
npm install -g @capacitor/cli
```

---

## 📁 Estrutura do Projeto

```
app_oficial_odrive/
├── frontend/                      # Assets web (HTML, CSS, JS)
│   ├── index.html                 # Redireciona para driver-mobile.html
│   ├── driver-mobile.html         # Página mobile do motorista
│   ├── graphic-mobile.html        # Página mobile da gráfica
│   ├── js/
│   │   ├── config.js              # ⚠️ CONFIGURE API_BASE AQUI
│   │   ├── driver-native.js       # Script nativo (Motorista)
│   │   └── graphic-native.js      # Script nativo (Gráfica)
│   └── assets/
│       ├── splash-driver.svg      # ⚠️ SUBSTITUA com logo real
│       ├── splash-graphic.svg     # ⚠️ SUBSTITUA com logo real
│       ├── icon-driver.svg        # ⚠️ SUBSTITUA com ícone real
│       └── icon-graphic.svg       # ⚠️ SUBSTITUA com ícone real
├── android/                       # Projeto Android (gerado)
├── ios/                           # Projeto iOS (gerado, requer macOS)
├── capacitor.config.json          # Config do app Motorista
├── capacitor.config.graphic.json  # Config do app Gráfica (preparado)
└── MOBILE_BUILD.md                # Este arquivo
```

---

## 🌐 Configuração do Backend

### 1. Configure o endereço do backend

Edite o arquivo **`frontend/js/config.js`**:

```javascript
export const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:5173'
  : 'https://api.seudominio.com'; // ⚠️ ALTERE AQUI
```

**IMPORTANTE:** 
- Substitua `https://api.seudominio.com` pelo endereço real do seu backend em produção
- O backend DEVE estar acessível por HTTPS (obrigatório para iOS e Android)
- Configure CORS no backend para aceitar requisições do app

### 2. Exemplo de configuração CORS (backend/server.js):

```javascript
app.use(cors({
  origin: ['https://api.seudominio.com', 'capacitor://localhost', 'ionic://localhost'],
  credentials: true
}));
```

---

## 📦 Build Android

### 1. Sincronizar arquivos web com Android:

```powershell
cd "d:\Clientes Agentes\OD Drive\Campanha CHECK\app_oficial_odrive"
npx cap sync android
```

### 2. Abrir no Android Studio:

```powershell
npx cap open android
```

### 3. No Android Studio:

1. **Build > Clean Project**
2. **Build > Rebuild Project**
3. Conecte um dispositivo ou use emulador
4. Clique em **Run** (ícone ▶️) para testar

### 4. Gerar APK/AAB para produção:

1. **Build > Generate Signed Bundle / APK**
2. Escolha **Android App Bundle (AAB)** (requerido pelo Play Store)
3. Crie ou selecione uma **keystore** (guarde em local seguro!)
4. Preencha as senhas e aliases
5. Escolha **release** variant
6. O arquivo AAB será gerado em `android/app/release/`

### 5. Upload para Play Console:

1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie um novo app ou selecione existente
3. Vá em **Produção > Criar nova versão**
4. Faça upload do arquivo `.aab`
5. Preencha descrições, screenshots, ícones
6. Envie para revisão

---

## 🍎 Build iOS (requer macOS)

### 1. Adicionar plataforma iOS:

```bash
npx cap add ios
```

### 2. Instalar dependências CocoaPods:

```bash
cd ios/App
pod install
cd ../..
```

### 3. Sincronizar arquivos:

```bash
npx cap sync ios
```

### 4. Abrir no Xcode:

```bash
npx cap open ios
```

### 5. Configurar permissões (Info.plist):

No Xcode, abra **ios/App/App/Info.plist** e adicione (se não existir):

```xml
<key>NSCameraUsageDescription</key>
<string>O app precisa acessar a câmera para capturar fotos de evidência durante as entregas.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>O app precisa acessar suas fotos para anexar evidências.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>O app precisa salvar fotos capturadas na galeria.</string>
```

### 6. Configurar assinatura:

1. No Xcode, selecione o projeto **App**
2. Aba **Signing & Capabilities**
3. Selecione seu **Team** (Apple Developer Account)
4. Marque **Automatically manage signing**
5. Escolha um **Bundle Identifier** único (ex: `com.oddrive.motorista`)

### 7. Build e teste em dispositivo:

1. Conecte um iPhone via USB
2. Selecione o dispositivo no topo do Xcode
3. Clique em **Run** (⌘R)

### 8. Build para produção (App Store):

1. **Product > Archive**
2. Aguarde o processo (pode levar vários minutos)
3. Na janela **Archives**, clique em **Distribute App**
4. Escolha **App Store Connect**
5. Siga o wizard (upload automático ou manual)

### 9. Enviar para revisão:

1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Selecione seu app
3. Crie uma nova versão
4. Preencha metadados, screenshots, descrições
5. Adicione build enviado
6. **Enviar para revisão**

---

## 🎨 Personalizando Splash Screen e Ícones

### Splash Screen

Atualmente há placeholders SVG em `frontend/assets/`. **Substitua** com imagens reais:

1. Crie uma imagem **2732x2732px** (formato PNG ou JPEG)
2. Coloque em `frontend/assets/splash-driver.png` e `frontend/assets/splash-graphic.png`
3. Use ferramentas como [Figma](https://figma.com) ou [Canva](https://canva.com) para design

**Dicas de design:**
- Fundo branco ou da cor da marca
- Logo centralizado e legível
- Evite texto pequeno (não será legível em todos os tamanhos)
- Formato quadrado (2732x2732) é ideal para iOS/Android

### Ícones do App

1. Crie ícone principal **1024x1024px** (PNG com transparência)
2. Use geradores de ícones:
   - [App Icon Generator](https://www.appicon.co)
   - [Icon Kitchen](https://icon.kitchen)
3. Esses geradores criarão todos os tamanhos necessários para iOS/Android

**Substituir ícones:**

#### Android:
Substitua os arquivos em `android/app/src/main/res/`:
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

#### iOS:
1. No Xcode, abra **ios/App/App/Assets.xcassets/AppIcon.appiconset**
2. Arraste e solte os ícones gerados

**Recomendação:** Use [Capacitor Assets](https://github.com/ionic-team/capacitor-assets) para gerar automaticamente:

```powershell
npm install -g @capacitor/assets
# Coloque icon.png (1024x1024) e splash.png (2732x2732) na raiz
npx capacitor-assets generate
```

---

## ✅ Checklist para Publicação

### Antes de fazer build final:

- [ ] **Backend configurado e acessível via HTTPS**
- [ ] **CORS configurado** no backend para aceitar apps mobile
- [ ] **API_BASE** configurado em `frontend/js/config.js`
- [ ] **Splash screens** substituídas com logo real
- [ ] **Ícones** substituídos com design profissional
- [ ] **Testes** em dispositivos reais (Android + iOS)
- [ ] **Permissões** funcionando (câmera, armazenamento)
- [ ] **Uploads** de fotos testados e funcionando

### Para Google Play Store:

- [ ] Conta **Google Play Console** criada (US$ 25)
- [ ] **Bundle AAB** assinado gerado
- [ ] **Screenshots** em alta resolução (mínimo 2, até 8)
- [ ] **Descrição curta** (até 80 caracteres)
- [ ] **Descrição completa** (até 4000 caracteres)
- [ ] **Ícone da loja** (512x512px)
- [ ] **Feature graphic** (1024x500px)
- [ ] **Política de privacidade** (URL pública)
- [ ] **Classificação de conteúdo** preenchida
- [ ] **Categoria** do app selecionada

### Para Apple App Store:

- [ ] Conta **Apple Developer** ativa (US$ 99/ano)
- [ ] **Certificados** e **provisioning profiles** configurados
- [ ] **Build IPA** enviado via Xcode
- [ ] **Screenshots** para iPhone e iPad (vários tamanhos)
- [ ] **App Preview** (vídeo, opcional mas recomendado)
- [ ] **Descrição** e **palavras-chave**
- [ ] **Ícone da loja** (1024x1024px, sem transparência)
- [ ] **Política de privacidade** (URL pública)
- [ ] **Notas de revisão** preenchidas (veja seção abaixo)
- [ ] **Conta de teste** fornecida (se necessário login)

---

## 📝 Notas para App Store Review

Cole este texto no campo **"App Review Information" > "Notes"** do App Store Connect:

```
SOBRE O APP:

Este é um aplicativo nativo para motoristas/entregas que utiliza funcionalidades 
essenciais do dispositivo móvel:

1. CÂMERA NATIVA: O app captura fotos de evidência de entregas/produções usando 
   a API nativa de câmera do iOS via Capacitor Camera plugin. As fotos são 
   essenciais para documentar o processo de entrega.

2. ARMAZENAMENTO SEGURO: Tokens de autenticação são armazenados usando 
   Capacitor Preferences (equivalente ao Keychain do iOS), não localStorage.

3. UPLOAD SEGURO: Fotos são enviadas via HTTPS para nosso backend com 
   autenticação JWT. O backend está em: https://api.seudominio.com

4. FUNCIONALIDADES OFFLINE: O app mantém dados localmente e sincroniza 
   quando a conexão é restabelecida.

5. PERMISSÕES: NSCameraUsageDescription é usada para capturar evidências 
   fotográficas durante entregas.

CREDENCIAIS DE TESTE:
Nome: João Teste
Telefone: (11) 99999-9999

OBSERVAÇÕES:
- O app requer backend funcional para login completo
- Fotos capturadas são comprimidas antes do upload (max 1280px)
- Este não é apenas um site empacotado - usa plugins nativos e armazenamento seguro

Obrigado pela revisão!
```

**⚠️ IMPORTANTE:** Adapte as credenciais de teste e URL do backend conforme seu ambiente real.

---

## 🐛 Troubleshooting

### Erro: "Could not find the android platform"
```powershell
npm install @capacitor/android --save
```

### Erro: "Pod install failed"
```bash
cd ios/App
pod repo update
pod install --repo-update
```

### Câmera não funciona no Android
- Verifique permissões em `AndroidManifest.xml`
- Teste em dispositivo real (emulador pode não ter câmera)
- Veja logs: `npx cap run android -l` (live reload com logs)

### Erro 401 ao fazer login
- Verifique se `API_BASE` em `config.js` está correto
- Confirme que o backend está rodando e acessível
- Verifique CORS no backend

### Splash screen não aparece
- Execute `npx cap sync`
- Limpe e rebuilde o projeto
- Verifique que `SplashScreen.hide()` está sendo chamado em `driver-native.js`

### Ícones não mudaram
- Após substituir ícones, execute:
  ```powershell
  npx cap sync
  ```
- Limpe cache do Android Studio: **Build > Clean Project**
- No iOS, delete app do dispositivo e reinstale

---

## 🎯 Próximos Passos

### Para criar o app da Gráfica:

1. Edite `capacitor.config.json` e mude:
   ```json
   {
     "appId": "com.oddrive.grafica",
     "appName": "OD Drive Gráfica"
   }
   ```

2. Edite `frontend/index.html` para redirecionar para `graphic-mobile.html`:
   ```javascript
   window.location.href = 'graphic-mobile.html';
   ```

3. Execute sync e builds novamente

**OU** crie projeto separado em outro diretório para evitar conflitos.

---

## 📞 Suporte

- Documentação Capacitor: https://capacitorjs.com
- Guia iOS: https://capacitorjs.com/docs/ios
- Guia Android: https://capacitorjs.com/docs/android
- Camera Plugin: https://capacitorjs.com/docs/apis/camera
- Preferences Plugin: https://capacitorjs.com/docs/apis/preferences

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados © 2024 OD Drive.

---

**Desenvolvido com ❤️ usando Capacitor**
