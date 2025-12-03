# Scripts de Build - OD Drive Mobile

## Comandos Rápidos

### Desenvolvimento Local (Web)
```powershell
# Rodar backend
npm start

# Testar frontend web (sem Capacitor)
# Abrir no navegador: http://localhost:5173/driver-mobile.html
```

### Sincronizar com Android
```powershell
# Copiar assets web para Android e atualizar plugins
npx cap sync android

# Abrir no Android Studio
npx cap open android
```

### Sincronizar com iOS (macOS apenas)
```bash
# Copiar assets e atualizar plugins
npx cap sync ios

# Instalar pods
cd ios/App && pod install && cd ../..

# Abrir no Xcode
npx cap open ios
```

### Live Reload durante desenvolvimento
```powershell
# Android com live reload (requer dispositivo/emulador rodando)
npx cap run android -l --external

# iOS com live reload (macOS)
npx cap run ios -l --external
```

### Limpar cache e rebuildar
```powershell
# Android
cd android
./gradlew clean
cd ..
npx cap sync android

# iOS (macOS)
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..
npx cap sync ios
```

### Gerar build de produção Android
```powershell
# 1. Sync
npx cap sync android

# 2. Abrir Android Studio
npx cap open android

# 3. No Android Studio:
# Build > Generate Signed Bundle / APK > Android App Bundle
# Escolha keystore, senha, alias
# Release variant
# Arquivo AAB será gerado em android/app/release/
```

### Preparar para App da Gráfica

Para criar o segundo app (Gráfica), você tem duas opções:

#### Opção 1: Modificar capacitor.config.json (não recomendado - sobrescreve)
```json
{
  "appId": "com.oddrive.grafica",
  "appName": "OD Drive Gráfica",
  "webDir": "frontend"
}
```
Depois altere `frontend/index.html` para redirecionar para `graphic-mobile.html`

#### Opção 2: Criar projeto separado (RECOMENDADO)
```powershell
# Criar nova pasta
mkdir ..\app_grafica
cd ..\app_grafica

# Copiar arquivos necessários
Copy-Item ..\app_oficial_odrive\frontend . -Recurse
Copy-Item ..\app_oficial_odrive\package.json .
Copy-Item ..\app_oficial_odrive\package-lock.json .

# Inicializar Capacitor para Gráfica
npm install
npx cap init "OD Drive Gráfica" "com.oddrive.grafica" --web-dir=frontend

# Editar frontend/index.html para redirecionar para graphic-mobile.html
# Instalar plataformas
npm install @capacitor/android @capacitor/ios @capacitor/camera @capacitor/preferences @capacitor/splash-screen --save
npx cap add android
# npx cap add ios (se no macOS)
```

### Verificar erros e logs

```powershell
# Android logs em tempo real
npx cap run android -l

# Ver logs do Capacitor
npx cap doctor

# Verificar plugins instalados
npx cap ls
```

### Atualizar Capacitor e plugins
```powershell
# Atualizar todas as dependências
npm update

# Atualizar Capacitor especificamente
npm install @capacitor/core@latest @capacitor/cli@latest
npm install @capacitor/android@latest @capacitor/ios@latest
npm install @capacitor/camera@latest @capacitor/preferences@latest @capacitor/splash-screen@latest

# Sync após atualizar
npx cap sync
```

### Troubleshooting comum

```powershell
# Erro: "Could not find @capacitor/android"
npm install @capacitor/android --save

# Erro: permissões negadas (Android)
# Verifique AndroidManifest.xml - veja MOBILE_BUILD.md

# Erro: Pod install failed (iOS)
cd ios/App
pod repo update
pod install --repo-update
cd ../..

# Erro: Build failed Android
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Comandos úteis Git

```powershell
# Ignorar node_modules e builds nativos (adicione ao .gitignore)
node_modules/
android/build/
android/app/build/
ios/App/Pods/
ios/App/build/

# Commit antes de builds
git add .
git commit -m "feat: adicionar suporte mobile Capacitor"
git push
```

## Workflow Recomendado

1. **Desenvolver no web primeiro**
   ```powershell
   npm start
   # Testar em http://localhost:5173/driver-mobile.html
   ```

2. **Testar em dispositivo**
   ```powershell
   npx cap sync android
   npx cap run android -l
   ```

3. **Ajustar e iterar**
   - Edite arquivos em `frontend/`
   - Live reload sincroniza automaticamente

4. **Build final**
   ```powershell
   npx cap sync android
   npx cap open android
   # Build > Generate Signed Bundle
   ```

5. **Upload para loja**
   - Google Play Console: upload AAB
   - App Store Connect: upload via Xcode

## Próximos Passos

1. ✅ Substitua splash screens em `frontend/assets/`
2. ✅ Substitua ícones (use generator online)
3. ✅ Configure `API_BASE` em `frontend/js/config.js`
4. ✅ Teste em dispositivo real
5. ✅ Gere screenshots para as lojas
6. ✅ Publique política de privacidade
7. ✅ Siga checklist em `APP_STORE_TEXTS.md`

---

📚 **Documentação completa:** MOBILE_BUILD.md
📝 **Textos para lojas:** APP_STORE_TEXTS.md
🐛 **Problemas?** Veja seção Troubleshooting em MOBILE_BUILD.md
