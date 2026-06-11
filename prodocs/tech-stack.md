# Socratix — Teknoloji Yığını

**Proje:** Future Talent 2026 — Yapay Zeka ile Ürün Geliştirme Bitirme Projesi  
**Ürün:** Kurum içi AI destekli inovasyon platformu (web)  
**Durum:** MVP — canlı geliştirme sürümü

Bu doküman, repository'deki **gerçek implementasyona** dayanır. `PRD.md` içindeki uzun vadeli hedefler (SSO, Supabase SDK, Azure OpenAI vb.) burada yalnızca planlanmış olup henüz kodda yer almıyorsa belirtilmez.

---

## 1. Mimari Özet

```
┌─────────────────┐     HTTPS / JSON      ┌──────────────────────────┐
│  React + Vite   │ ◄──────────────────► │  FastAPI (Python)         │
│  (frontend/)    │   Bearer JWT         │  (backend/)               │
└─────────────────┘                       │                           │
                                          │  ┌─────────────────────┐ │
                                          │  │ SQLAlchemy ORM      │ │
                                          │  └──────────┬──────────┘ │
                                          │             │            │
                                          │  ┌──────────▼──────────┐ │
                                          │  │ PostgreSQL          │ │
                                          │  └─────────────────────┘ │
                                          │                           │
                                          │  ┌─────────────────────┐ │
                                          │  │ AIService (httpx)   │ │
                                          │  │ OpenAI / OpenRouter │ │
                                          │  └─────────────────────┘ │
                                          └──────────────────────────┘
```

Frontend ve backend ayrı klasörlerde (`/frontend`, `/backend`) tutulur; istemci yalnızca REST API üzerinden haberleşir.

---

## 2. Frontend

| Teknoloji | Sürüm / Not | Kullanım |
|---|---|---|
| **React** | 18.3 | Bileşen tabanlı SPA arayüzü |
| **Vite** | 8.x | Geliştirme sunucusu ve production build |
| **JavaScript (JSX)** | ES modules | TypeScript kullanılmıyor |
| **React Router DOM** | 6.28 | Sayfa yönlendirme (`/dashboard`, `/create`, `/ideas/:id` vb.) |
| **Vanilla CSS** | — | Tasarım sistemi: `tokens.css` + `design-system.css` (UI kütüphanesi yok) |
| **fetch API** | — | `frontend/src/services/api.js` üzerinden backend çağrıları |
| **localStorage** | — | JWT (`socratix_token`), dil tercihi, bildirim ayarları |
| **Özel i18n** | — | `en.json` / `tr.json` + `useTranslation()` hook'u |

### Ön yüz yapısı

- **Sayfalar:** `frontend/src/pages/` — Login, SignUp, Dashboard, CreateIdea, DevilsAdvocate (AI Review), IdeaDetail, EditIdea, Messages, Profile
- **Tasarım bileşenleri:** `frontend/src/components/ds/` — Button, Card, TextInput, Textarea, Select, Icon, SocratixLogo
- **Durum yönetimi:** React Context (`SocratixStoreProvider.jsx`); harici state kütüphanesi yok
- **Ortam değişkeni:** `VITE_API_BASE_URL` (varsayılan: `http://localhost:8000`)

### Seçim gerekçesi

React + Vite, haftalık iterasyon hızı ve bileşen yeniden kullanımı için seçildi. Harici UI framework'ü eklenmedi; kurumsal koyu tema ve cam efektli kartlar özel CSS ile kontrol altında tutuldu.

---

## 3. Backend

| Teknoloji | Sürüm / Not | Kullanım |
|---|---|---|
| **Python** | 3.x | API sunucusu |
| **FastAPI** | 0.136 | REST API, otomatik OpenAPI (`/docs`) |
| **Uvicorn** | 0.48 | ASGI sunucusu |
| **Pydantic** | 2.x | İstek/yanıt şema doğrulama |
| **SQLAlchemy** | 2.0 | ORM ve veritabanı oturumları |
| **psycopg2-binary** | 2.9 | PostgreSQL sürücüsü |
| **python-jose** | 3.5 | JWT üretimi ve doğrulama |
| **passlib** | 1.7 | Şifre hash (pbkdf2_sha256) |
| **httpx** | 0.28 | LLM API çağrıları (senkron HTTP istemcisi) |
| **python-multipart** | — | Avatar dosya yükleme |
| **pytest** | — | Backend entegrasyon testleri (`backend/tests/`) |

### Backend yapısı

```
backend/
├── app/
│   ├── api/          # auth, ideas, messages, users router'ları
│   ├── models/       # SQLAlchemy modelleri (User, Idea, Message, …)
│   ├── schemas/      # Pydantic şemaları
│   ├── services/     # auth_service, idea_service, ai_service, message_service, avatar_service
│   ├── config.py     # Ortam değişkenleri
│   ├── database.py   # Engine ve session factory
│   └── main.py       # FastAPI uygulaması, CORS, static /uploads
├── uploads/avatars/  # Profil görselleri (yerel dosya sistemi)
└── requirements.txt
```

### Seçim gerekçesi

FastAPI; tip güvenliği, hızlı geliştirme ve Swagger dokümantasyonu sağlar. AI mantığı `ai_service.py` içinde izole edilmiştir; API katmanı yalnızca servisi çağırır.

---

## 4. Veritabanı

| Öğe | Detay |
|---|---|
| **Motor** | PostgreSQL |
| **Bağlantı** | `DATABASE_URL` ortam değişkeni (`postgresql+psycopg2://…`) |
| **ORM** | SQLAlchemy 2.0 declarative modeller |
| **Şema oluşturma** | `Base.metadata.create_all()` — Alembic yok |
| **Hafif migrasyon** | `db_migrations.py` — eksik sütunları `ALTER TABLE` ile ekler |

### Ana tablolar

| Tablo | Amaç |
|---|---|
| `users` | Kayıt, profil, avatar URL, departman, rol |
| `ideas` | Fikir içeriği, oy sayısı, durum, JSONB alanlar (voters, comments, devilQuestions, devilAnswers) |
| `messages` | Kullanıcılar arası doğrudan mesajlaşma |
| `password_reset_tokens` | Şema mevcut; reset endpoint'leri henüz tamamlanmadı |

JSONB alanları (`voters`, `comments`, `devilQuestions`, `devilAnswers`) ilişkisel tablo yerine MVP hızı için fikir kaydına gömülü tutulur.

---

## 5. Kimlik Doğrulama (Authentication)

MVP'de **e-posta + şifre** tabanlı kimlik doğrulama kullanılır. PRD'de planlanan kurumsal SSO (Azure AD / OIDC) henüz implemente edilmemiştir.

### Akış

1. **Kayıt:** `POST /auth/register` → kullanıcı oluşturulur, JWT döner
2. **Giriş:** `POST /auth/login` (OAuth2 password form: `username` = e-posta) → JWT döner
3. **Oturum:** `GET /auth/me` — Bearer token ile mevcut kullanıcı
4. **Profil:** `PUT /auth/me`, avatar `POST/DELETE /auth/me/avatar`

### Teknik detaylar

| Öğe | Değer |
|---|---|
| Token formatı | JWT (HS256) |
| Secret | `SECRET_KEY` (.env) |
| Süre | 24 saat (`ACCESS_TOKEN_EXPIRE_MINUTES`) |
| Şifre hash | passlib `pbkdf2_sha256` |
| İstemci depolama | `localStorage` → `socratix_token` |
| Korumalı route | `ProtectedRoute.jsx` + backend `get_current_user` dependency |

Korumalı tüm endpoint'ler `Authorization: Bearer <token>` header'ı bekler.

---

## 6. Yapay Zeka Entegrasyonu (Ürün)

AI, uygulamanın çekirdek mantığına **backend API katmanı** üzerinden entegre edilmiştir. Frontend doğrudan LLM servisine bağlanmaz; tüm istekler FastAPI üzerinden gider.

### Servis sağlayıcı

| Sağlayıcı | Yapılandırma |
|---|---|
| **OpenAI** (varsayılan) | `AI_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_BASE_URL` |
| **OpenRouter** (alternatif) | `AI_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL` |
| **Model** | `AI_MODEL` (varsayılan: `gpt-4o-mini`) |

`backend/app/services/ai_service.py` içindeki `AIService` sınıfı, OpenAI uyumlu `/chat/completions` endpoint'ine `httpx` ile istek atar. Yanıtlar JSON olarak parse edilir; API anahtarı yoksa veya çağrı başarısız olursa güvenli **fallback** metinler döner (graceful degradation).

### AI endpoint'leri

| Endpoint | Amaç | UI karşılığı |
|---|---|---|
| `POST /ideas/ai-improve` | Fikir geliştirme önerileri ve benzer fikir uyarıları | Create Idea → "AI Improve" |
| `POST /ideas/{id}/devil-questions` | Yayın öncesi 3 kritik soru üretimi | AI Review ekranı (`/devil/:id`) |
| `POST /ideas/{id}/devil` | Sorulara yanıt veya atlama; fikir `submitted` olur | AI Review gönderimi |
| `POST /ideas/{id}/devil-advocate` | Risk, iyileştirme ve uygulanabilirlik skoru | Idea Detail → "AI Analysis" paneli |
| `POST /ideas/{id}/mentor` | Yer tutucu ("AI mentorluğu yakında") | Henüz aktif değil |

### Fikir yaşam döngüsü ve AI

1. Kullanıcı taslak oluşturur (`progressStatus: draft`)
2. İsteğe bağlı AI Improve ile önerileri kabul/red eder
3. "Devam" → fikir kaydedilir → AI Review ekranına yönlendirilir
4. AI 3 soru üretir; kullanıcı yanıtlar veya atlar
5. Fikir `submitted` statüsüne geçer; `aiReviewed` bayrağı set edilebilir
6. Taslaklar yalnızca sahibine görünür (sunucu tarafı gizlilik kuralı)

---

## 7. API Mimarisi

### Genel kurallar

- **Stil:** REST, JSON request/response
- **Base URL:** `http://localhost:8000` (geliştirme); production'da `VITE_API_BASE_URL` ile eşleştirilir
- **Dokümantasyon:** FastAPI otomatik Swagger UI → `/docs`
- **CORS:** `localhost:5173` ve `127.0.0.1:5173` origin'leri izinli
- **Statik dosyalar:** `/uploads/...` — avatar görselleri

### Router özeti

| Prefix | Dosya | Temel endpoint'ler |
|---|---|---|
| `/auth` | `api/auth.py` | register, login, me, avatar |
| `/ideas` | `api/ideas.py` | CRUD, vote, AI improve/review/analysis, comments |
| `/messages` | `api/messages.py` | kullanıcı listesi, konuşma, mesaj gönder |
| `/users` | `api/users.py` | kayıtlı kullanıcı dizini |
| `/` | `main.py` | health check |

### Hata yönetimi

- `404` — kayıt bulunamadı
- `403` — yetkisiz erişim (ör. başkasının taslağı)
- `401` — geçersiz veya eksik JWT
- `409` — e-posta zaten kayıtlı
- `422` — Pydantic doğrulama hatası

Frontend `api.js` içindeki `ApiError` sınıfı HTTP hatalarını kullanıcıya banner/toast ile iletir.

---

## 8. Geliştirme Sürecinde AI Kullanımı

Bu bölüm, **ürün içi AI** değil; projeyi geliştirirken yapay zeka araçlarının nasıl kullanıldığını özetler.

### Araçlar ve rol dağılımı

| Araç / Yöntem | Kullanım alanı |
|---|---|
| **Cursor AI Agent** | Kod iskeleti, endpoint implementasyonu, test yazımı, hata ayıklama |
| **prodocs/** klasörü | AI ajanları için referans: PRD, Plan, Progress, bu dosya, DesignSystem |
| **İteratif planlama** | `Plan.md` todo listesi — haftalık adımlar tamamlandıkça işaretlendi |

### Geliştirme evreleri (Progress.md ile uyumlu)

1. **Hafta 1–2 — İskelet:** FastAPI + React/Vite kurulumu, in-memory fikir API'si, temel feed ve oy akışı
2. **Hafta 3 — Kalıcılık:** PostgreSQL + SQLAlchemy modelleri; frontend gerçek API'ye bağlandı
3. **Hafta 4 — UI:** Ekran görüntüleri (`screenshots/`), tasarım sistemi (`tokens.css`, `design-system.css`), auth sayfaları
4. **Sonraki iterasyonlar:** JWT auth, mesajlaşma, profil/avatar, i18n (EN/TR), AI servis entegrasyonu, pytest test paketi

### AI destekli geliştirici kararları

- **AI servis soyutlaması:** LLM çağrıları baştan `ai_service.py`'de toplandı; API route'ları ince tutuldu. Böylece OpenAI → OpenRouter geçişi yalnızca config değişikliğiyle mümkün oldu.
- **Fallback stratejisi:** API anahtarı olmadan da uygulama çalışır; demo ve CI testleri kesintisiz devam eder.
- **Mock sınırı:** `mockData.js` yalnızca kategori/departman listeleri için kullanılır; kullanıcı, oy ve mesaj verisi gerçek backend'den gelir.
- **Test önceliği:** AI endpoint'leri için `test_ai_improve`, `test_devil_advocate`, `test_devil_flow` yazıldı; regresyon riski azaltıldı.

### Henüz tamamlanmayanlar

- Şifre sıfırlama backend endpoint'leri (`ForgotPasswordPage` UI mevcut, API bağlı değil)
- PRD'deki SSO, günlük digest bildirimi, Mixpanel/Sentry entegrasyonları

---

## 9. Yerel Çalıştırma

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # DATABASE_URL, SECRET_KEY, OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000
npm run dev            # http://localhost:5173
```

### PostgreSQL

Yerel PostgreSQL örneği `backend/.env.example` içindeki `DATABASE_URL` ile yapılandırılır. Tablolar uygulama başlangıcında otomatik oluşturulur.

---

## 10. İlgili Dosyalar

| Dosya | İçerik |
|---|---|
| `prodocs/PRD.md` | Ürün vizyonu ve uzun vadeli hedefler |
| `prodocs/Plan.md` | Kullanıcı hikayelerine bölünmüş teknik adımlar |
| `prodocs/Progress.md` | Tamamlanan işler ve kararlar |
| `prodocs/DesignSystem.md` | Renk, tipografi, bileşen kuralları |
| `backend/.env.example` | Backend ortam değişkeni şablonu |
| `frontend/.env.example` | Frontend API URL şablonu |
