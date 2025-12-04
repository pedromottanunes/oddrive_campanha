import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const USERNAME = 'Pedro';
const NEW_PASS = '12345678'; // 8 chars to satisfy validator

(async ()=>{
  try{
    const { findAdminUserByUsername, createAdminUser, updateAdminUser } = await import('../services/db.js');
    const normalized = String(USERNAME).toLowerCase().trim();
    const existing = await findAdminUserByUsername(normalized);
    const passwordHash = await bcrypt.hash(NEW_PASS, 10);
    if (existing){
      console.log('Usuário já existe. Atualizando senha para teste...');
      await updateAdminUser(existing._id, { passwordHash });
      console.log('Senha atualizada.');
    } else {
      console.log('Criando usuário admin:', normalized);
      const user = await createAdminUser({ username: normalized, passwordHash, name: USERNAME, email: null, role: 'admin', active: true, createdBy: 'script' });
      console.log('Usuário criado com id:', user._id);
    }
    console.log(`Credenciais de teste: ${USERNAME} / ${NEW_PASS}`);
    process.exit(0);
  }catch(e){
    console.error('Erro ao garantir usuário admin:', e.message || e);
    process.exit(1);
  }
})();
