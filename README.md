# ⚡ CupomZap — Plataforma de Cupons, Cashback e Ofertas

Plataforma completa de afiliados inspirada no modelo Cuponomia, com identidade visual própria,
código original e arquitetura moderna pronta para produção.

---

## 🗂 Estrutura do Projeto

```
cupomzap/
├── backend/                  # API REST (Node.js + Express + PostgreSQL)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js   # Pool PostgreSQL + helpers de transação
│   │   │   └── migrate.js    # Migrations: todas as tabelas e índices
│   │   ├── controllers/
│   │   │   ├── authController.js      # Registro, login, JWT, reset senha
│   │   │   ├── couponController.js    # CRUD, busca FTS, votos, tracking
│   │   │   ├── storeController.js     # CRUD de lojas
│   │   │   ├── cashbackController.js  # Saldo, transações, saques Pix
│   │   │   ├── userController.js      # Perfil, favoritos, notificações
│   │   │   ├── alertController.js     # Alertas de preço
│   │   │   └── adminController.js     # Dashboard, usuários, aprovações
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verify + RBAC (user/editor/admin)
│   │   │   └── errorHandler.js  # Handler global de erros padronizado
│   │   ├── routes/
│   │   │   └── index.js         # Todas as rotas com validações
│   │   ├── services/
│   │   │   ├── emailService.js    # Nodemailer + templates HTML
│   │   │   ├── affiliateService.js # Rakuten, Impact, CJ Affiliate
│   │   │   └── scheduler.js       # Cron jobs (sync, limpeza, alertas)
│   │   └── utils/
│   │       ├── logger.js    # Winston (dev pretty / prod JSON)
│   │       └── response.js  # Helpers de resposta + classes de erro
│   ├── tests/
│   │   └── auth.test.js     # Testes de integração com supertest
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend-admin/
│   └── src/
│       └── AdminApp.jsx     # Dashboard admin React completo
├── nginx/
│   └── nginx.conf           # Reverse proxy + SSL + rate limiting
└── docker-compose.yml       # Stack completa: API + DB + Redis + Nginx
```

---

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (ou via Docker)

### 1. Clonar e configurar

```bash
git clone https://github.com/seu-usuario/cupomzap.git
cd cupomzap/backend
cp .env.example .env
# Edite .env com suas credenciais
```

### 2. Subir com Docker (recomendado)

```bash
# Na raiz do projeto
docker-compose up -d

# Rodar migrations
docker-compose exec api node src/config/migrate.js
```

### 3. Desenvolvimento local

```bash
cd backend
npm install
npm run migrate   # Cria tabelas no PostgreSQL
npm run seed      # (opcional) Dados de exemplo
npm run dev       # Servidor com hot-reload em :3001
```

---

## 📡 API Reference

### Base URL
```
https://cupomzap.com.br/api/v1
```

### Autenticação
Todos os endpoints protegidos requerem:
```
Authorization: Bearer <access_token>
```

---

### 🔐 Auth

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/register` | Criar conta | — |
| POST | `/auth/login` | Login | — |
| POST | `/auth/refresh` | Renovar token | — |
| POST | `/auth/forgot-password` | Enviar email reset | — |
| POST | `/auth/reset-password` | Redefinir senha | — |
| GET | `/auth/verify-email/:token` | Verificar email | — |
| GET | `/auth/me` | Perfil atual | ✅ |

**Exemplo – Registro:**
```bash
curl -X POST https://api.cupomzap.com.br/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@email.com","password":"Senha123"}'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Account created — check your email to verify",
  "data": {
    "user": { "id": "uuid", "name": "João", "email": "joao@email.com", "role": "user" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### 🏷️ Cupons

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/coupons` | Listar com filtros e paginação | Opcional |
| GET | `/coupons/featured` | Cupons em destaque | — |
| GET | `/coupons/:id` | Detalhe do cupom | Opcional |
| POST | `/coupons` | Criar cupom | Editor+ |
| PATCH | `/coupons/:id` | Atualizar cupom | Editor+ |
| DELETE | `/coupons/:id` | Desativar cupom | Admin |
| POST | `/coupons/:id/use` | Registrar uso | Opcional |
| POST | `/coupons/:id/vote` | Votar (1 ou -1) | ✅ |

**Query params GET /coupons:**
```
?q=desconto          # Busca full-text (português)
&type=coupon|cashback|deal|frete_gratis
&category=moda       # Slug da categoria
&store=amazon        # Slug da loja
&badge=hot|new|cashback|exclusive
&sort=popular|newest|discount|expiring|success
&featured=true
&verified=true
&expiring=true       # Expirando nos próximos 3 dias
&page=1&limit=20
```

---

### 💰 Cashback

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/cashback/balance` | Saldo e estatísticas | ✅ |
| GET | `/cashback/transactions` | Histórico | ✅ |
| GET | `/cashback/withdrawals` | Histórico de saques | ✅ |
| POST | `/cashback/withdraw` | Solicitar saque Pix | ✅ |
| POST | `/cashback/admin/confirm/:id` | Confirmar transação | Admin |

**Solicitar saque:**
```bash
curl -X POST .../cashback/withdraw \
  -H "Authorization: Bearer TOKEN" \
  -d '{"amount": 50.00, "pix_key": "seu@email.com"}'
```

---

### 🏪 Lojas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/stores` | Listar lojas |
| GET | `/stores/:slug` | Detalhe da loja |
| POST | `/stores` | Criar (Admin) |
| PATCH | `/stores/:id` | Atualizar (Admin) |

---

### 👤 Usuário

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/users/profile` | Perfil |
| PATCH | `/users/profile` | Atualizar perfil |
| POST | `/users/change-password` | Alterar senha |
| GET | `/users/favorites` | Cupons favoritos |
| POST | `/users/favorites/:couponId` | Adicionar favorito |
| DELETE | `/users/favorites/:couponId` | Remover favorito |
| GET | `/users/notifications` | Notificações |

---

### 🔔 Alertas de Preço

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/alerts` | Listar alertas |
| POST | `/alerts` | Criar alerta |
| PATCH | `/alerts/:id` | Atualizar alerta |
| DELETE | `/alerts/:id` | Deletar alerta |

---

### 🛡️ Admin

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/dashboard` | Métricas gerais |
| GET | `/admin/users` | Listar usuários |
| PATCH | `/admin/users/:id` | Editar papel/status |
| GET | `/admin/withdrawals` | Listar saques |
| PATCH | `/admin/withdrawals/:id` | Processar saque |
| POST | `/admin/sync-coupons` | Disparar sync afiliados |

---

## 🗃 Banco de Dados

### Diagrama de entidades

```
users
  id · name · email · password · role · cashback_balance · total_saved

categories
  id · name · slug · icon

stores
  id · name · slug · website_url · affiliate_url · cashback_rate

coupons
  id · store_id → stores · category_id → categories
  code · type · discount_value · expires_at · success_rate · uses_count

coupon_votes
  coupon_id → coupons · user_id → users · vote (1|-1)

coupon_uses
  coupon_id → coupons · user_id → users · user_ip · success

cashback_transactions
  user_id → users · store_id → stores · amount · cashback_amount · status

cashback_withdrawals
  user_id → users · amount · pix_key · status

price_alerts
  user_id → users · product_url · target_price · current_price

user_favorites
  user_id → users · coupon_id → coupons

notifications
  user_id → users · type · title · body · is_read
```

---

## ⚙️ Cron Jobs

| Job | Frequência | Descrição |
|-----|------------|-----------|
| Sync afiliados | A cada 6h | Rakuten, Impact, CJ → DB |
| Limpeza de expirados | A cada 1h | Desativa cupons vencidos |
| Alertas de preço | A cada 30min | Dispara emails |
| Reconciliação | Diário 03h | Confirma transações afiliados |
| Contadores | Diário 02h | Atualiza `total_coupons` das lojas |

---

## 🔒 Segurança

- **Helmet** — headers HTTP de segurança
- **CORS** configurado por origem
- **Rate limiting** por IP (geral + auth específico)
- **JWT** com access (7d) + refresh token (30d)
- **bcrypt** com salt rounds 12
- **Proteção SQL injection** — parameterized queries (pg)
- **Validação** — express-validator em todos endpoints
- **RBAC** — user / editor / admin
- **Nginx** — TLS 1.2+, HSTS, bloqueio de paths sensíveis
- **Graceful shutdown** — fecha pool antes de sair

---

## 🔗 Redes de Afiliados

| Rede | Status | Lojas |
|------|--------|-------|
| Rakuten Advertising | ✅ Integrado | ~42 lojas BR |
| Impact Radius | ✅ Integrado | ~78 lojas BR |
| CJ Affiliate | 🔧 Em config | — |

Configure as credenciais em `.env`:
```env
RAKUTEN_API_KEY=...
IMPACT_ACCOUNT_SID=...
IMPACT_AUTH_TOKEN=...
CJ_AFFILIATE_API_KEY=...
```

---

## 🧪 Testes

```bash
cd backend
npm test
```

Cobertura:
- `POST /auth/register` — sucesso, email duplicado, senha fraca
- `POST /auth/login` — credenciais válidas/inválidas
- `GET /auth/me` — com/sem token
- `GET /coupons` — listagem, filtros, busca
- `GET /health` — status da API

---

## 🚢 Deploy em Produção

```bash
# 1. Configure SSL (certbot recomendado)
certbot certonly --standalone -d cupomzap.com.br

# 2. Configure .env de produção
cp backend/.env.example backend/.env
# Edite com valores reais

# 3. Subir stack completa
docker-compose up -d --build

# 4. Migrations
docker-compose exec api node src/config/migrate.js

# 5. Verificar saúde
curl https://cupomzap.com.br/api/v1/health
```

---

## 📦 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DB_HOST` | Host PostgreSQL | `localhost` |
| `DB_NAME` | Nome do banco | `cupomzap` |
| `DB_PASSWORD` | Senha do banco | `secret` |
| `JWT_SECRET` | Segredo JWT (64+ chars) | `...` |
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `FRONTEND_URL` | URL do frontend | `https://cupomzap.com.br` |
| `RAKUTEN_API_KEY` | Chave Rakuten | `...` |
| `IMPACT_ACCOUNT_SID` | SID Impact | `...` |

Ver `.env.example` para lista completa.

---

## 🛣 Roadmap

- [ ] App mobile React Native (iOS + Android)
- [ ] Extensão Chrome para captura automática de cupons
- [ ] Notificações push (Firebase)
- [ ] Integração com Pix automático (Gerencianet/EFi)
- [ ] Painel de analytics avançado
- [ ] Sistema de reviews de lojas
- [ ] API pública para parceiros

---

## 📄 Licença

Proprietary — © 2025 CupomZap. Todos os direitos reservados.
