# 🧪 GUIA DE TESTE RÁPIDO

## ✅ PROBLEMAS CORRIGIDOS

1. ✅ **Admin voltou ao normal** - `index.html` restaurado
2. ✅ **API_BASE configurado** - páginas mobile apontam para http://192.168.1.19:5174
3. ✅ **Backend rodando** - servidor na porta 5174

---

## 📱 COMO TESTAR AGORA (3 opções)

### Opção 1: Teste no Navegador do PC (mais rápido)

**Admin (funcionando normalmente):**
```
http://localhost:5174/
```

**Motorista (versão web):**
```
http://localhost:5174/driver.html
```

**Motorista (versão mobile - scripts nativos):**
```
http://localhost:5174/driver-mobile.html
```

**Gráfica (versão mobile - scripts nativos):**
```
http://localhost:5174/graphic-mobile.html
```

---

### Opção 2: Teste no iPhone/Android (mesma rede Wi-Fi)

**No seu celular, abra o navegador e digite:**

**Admin:**
```
http://192.168.1.19:5174/
```

**Motorista (mobile):**
```
http://192.168.1.19:5174/driver-mobile.html
```

**Gráfica (mobile):**
```
http://192.168.1.19:5174/graphic-mobile.html
```

⚠️ **Observação sobre câmera:**
- Navegadores exigem HTTPS para usar câmera nativa
- Sem HTTPS, o app usa fallback (seletor de arquivos)
- Para testar câmera real, use Opção 3 (ngrok HTTPS)

---

### Opção 3: Teste com HTTPS (câmera funcionando)

**1. Instale ngrok:**
- Download: https://ngrok.com/download
- Extraia e coloque na pasta do projeto

**2. Execute no PowerShell:**
```powershell
# Na pasta do projeto
.\ngrok http 5174
```

**3. Ngrok vai mostrar algo como:**
```
Forwarding  https://abcd-1234-5678.ngrok-free.app -> http://localhost:5174
```

**4. Copie a URL HTTPS e use no celular:**
```
https://abcd-1234-5678.ngrok-free.app/driver-mobile.html
```

**5. IMPORTANTE - Atualize a meta tag:**
- Edite `frontend/driver-mobile.html` e `frontend/graphic-mobile.html`
- Mude a linha:
  ```html
  <meta name="api-base" content="http://192.168.1.19:5174" />
  ```
  Para:
  ```html
  <meta name="api-base" content="https://abcd-1234-5678.ngrok-free.app" />
  ```

Agora a câmera vai funcionar no navegador do celular!

---

## 🔍 O QUE TESTAR

### No Admin (http://localhost:5174/):
- ✅ Criar/editar campanhas
- ✅ Importar planilhas
- ✅ Gerenciar motoristas
- ✅ Ver relatórios

### No Motorista Mobile (driver-mobile.html):
- ✅ Login com nome e telefone
- ✅ Ver atividades pendentes
- ✅ Capturar fotos (com ngrok HTTPS)
- ✅ Enviar evidências
- ✅ Acompanhar progresso

### Na Gráfica Mobile (graphic-mobile.html):
- ✅ Login com código de campanha
- ✅ Selecionar motorista
- ✅ Capturar fotos (com ngrok HTTPS)
- ✅ Enviar para motorista
- ✅ Adicionar observações

---

## 🐛 DIFERENÇAS ENTRE VERSÕES

### `driver.html` (versão original web):
- Usa getUserMedia (web API)
- localStorage para tokens
- Precisa HTTPS para câmera

### `driver-mobile.html` (versão nativa - preparada para Capacitor):
- **No navegador:** ainda usa getUserMedia (com fallback)
- **No app nativo:** usa Camera plugin nativo
- **No navegador:** ainda usa localStorage
- **No app nativo:** usa Preferences (seguro)
- API_BASE configurável via meta tag

---

## 📊 STATUS ATUAL

| Item | Status | Observação |
|------|--------|------------|
| Admin web | ✅ Funcionando | http://localhost:5174/ |
| Backend | ✅ Rodando | Porta 5174 |
| Driver web | ✅ Funcionando | driver.html (versão original) |
| Driver mobile (navegador) | ✅ Testável | driver-mobile.html (sem HTTPS = sem câmera) |
| Driver mobile (HTTPS) | ⏳ Requer ngrok | Para testar câmera |
| Driver mobile (app nativo) | ⏳ Requer Android Studio | Compilar APK/AAB |
| Graphic mobile | ✅ Testável | graphic-mobile.html |

---

## ❓ FAQ

**P: Por que não funciona a câmera no celular?**
R: Navegadores exigem HTTPS. Use ngrok (Opção 3) ou compile o app nativo.

**P: Como volto para o admin?**
R: http://localhost:5174/ ou http://192.168.1.19:5174/

**P: O app mobile está diferente?**
R: No navegador, ainda usa APIs web com fallbacks. A mágica acontece no app nativo compilado (com Capacitor plugins).

**P: Como compilo o app nativo?**
R: Precisa do Android Studio instalado. Depois: `npx cap sync android` e `npx cap open android`

**P: Por que criou duas versões (driver.html e driver-mobile.html)?**
R: `driver.html` é a versão original (continua funcionando). `driver-mobile.html` é otimizada para mobile com scripts que usam plugins nativos quando compilado em app.

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Teste o admin - confirme que voltou ao normal
2. ✅ Teste driver-mobile.html no navegador do PC
3. ✅ Teste no celular (mesma rede Wi-Fi)
4. 🔄 Se quiser testar câmera: use ngrok (Opção 3)
5. 🔄 Se quiser compilar app: instale Android Studio

---

## 💡 DICA RÁPIDA

**Para testar AGORA sem complicação:**
1. Abra no PC: http://localhost:5174/driver-mobile.html
2. Faça login (nome + telefone)
3. Use o fallback de câmera (seletor de arquivo)
4. Teste o fluxo completo

**Tudo deve funcionar** (exceto câmera nativa, que precisa HTTPS ou app nativo).

---

_Última atualização: 8 de novembro de 2024_
