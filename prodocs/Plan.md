# Socratix — Final Implementation Plan

**Status:** Delivered (local development MVP)  
**Scope:** Corporate innovation platform with three-stage AI lifecycle, collaboration, and TR/EN support

This document describes the **final delivered implementation** organized by phase. An appendix below preserves the original early MVP planning record for academic traceability.

---

## How the MVP Evolved

The project began as a minimal innovation loop (create idea → feed → vote) with in-memory storage and placeholder AI hooks. Across weekly iterations it evolved into a full-stack product:

| Early MVP intent | Final delivered state |
|---|---|
| In-memory API prototype | PostgreSQL + SQLAlchemy persistence |
| Anonymous / demo usage | JWT authentication and user profiles |
| Placeholder AI mentor | AI Enhancement → AI Validation → AI Strategic Review |
| Single-language UI | Turkish / English with dynamic content translation |
| Basic feed | Draft/submitted lifecycle, voting, discussion, Employee Directory, messaging |

Prioritization focused on a demonstrable innovation workflow before enterprise extras (SSO, analytics, notifications). Root-level planning files document this evolution week by week.

---

## Phase 1 — Foundation

**Goal:** Establish a maintainable full-stack baseline for iterative product delivery.

| Deliverable | Status |
|---|---|
| React + Vite frontend (SPA, React Router) | Delivered |
| FastAPI backend (REST API, OpenAPI `/docs`) | Delivered |
| PostgreSQL database | Delivered |
| SQLAlchemy ORM models and session management | Delivered |
| CORS, environment configuration (`.env.example`) | Delivered |
| Lightweight column migrations (`db_migrations.py`) | Delivered |
| Database-compatible JSON columns (JSONB on PostgreSQL, JSON on SQLite for tests) | Delivered |

---

## Phase 2 — Authentication & Users

**Goal:** Secure, profile-aware employee accounts.

| Deliverable | Status |
|---|---|
| Email/password registration and login | Delivered |
| JWT access tokens (`/auth/register`, `/auth/login`, `GET /auth/me`) | Delivered |
| Profile management (`PUT /auth/me` — name, department, bio, job title) | Delivered |
| Avatar upload and removal (`POST` / `DELETE /auth/me/avatar`) | Delivered |
| Employee Directory (`GET /users`, `/users` UI) | Delivered |
| Innovation roles and job titles (display metadata) | Delivered |
| Password reset (full backend + email delivery) | Deferred — Forgot Password UI only; see Progress |

---

## Phase 3 — Innovation Workflow

**Goal:** End-to-end idea lifecycle from private draft to public innovation feed.

| Deliverable | Status |
|---|---|
| Idea CRUD API and UI | Delivered |
| Draft / submitted lifecycle with owner-only draft privacy | Delivered |
| Owner permissions (edit/delete restricted to author) | Delivered |
| Innovation feed with filters (all, department, popular, new) | Delivered |
| Voting (toggle, voter list with avatars) | Delivered |
| Discussion / comments on idea detail | Delivered |
| Accepted AI Enhancement cards on idea detail | Delivered |

---

## Phase 4 — AI Lifecycle

**Goal:** Structured AI support before and after idea submission.

| Stage | Purpose | Status |
|---|---|---|
| **AI Enhancement** | Improve draft ideas; structured accept/dismiss suggestions | Delivered |
| **AI Validation** | Feasibility/risk/business questions before publishing; stored responses; AI Validated badge | Delivered |
| **AI Strategic Review** | Post-submission analysis (impact, strengths, risks, validation summary, next steps, business value); persisted on idea | Delivered |
| OpenAI / OpenRouter integration with safe fallbacks | Delivered |

Product UI uses enterprise labels (AI Enhancement, AI Validation, AI Strategic Review). Some internal API route names retain legacy `devil-*` naming.

---

## Phase 5 — Collaboration

**Goal:** Help employees discover colleagues and communicate around innovation.

| Deliverable | Status |
|---|---|
| Employee-to-employee messaging (`messages` table, REST API) | Delivered |
| Employee Directory integration (discover colleagues, open chat) | Delivered |
| Profile-based interaction (avatars, names on feed, comments, messages) | Delivered |

---

## Phase 6 — Multilingual Experience

**Goal:** Turkish and English support for a bilingual corporate audience.

| Deliverable | Status |
|---|---|
| TR/EN static UI (`en.json`, `tr.json`, auth-screen language toggle) | Delivered |
| Dynamic translation for ideas, AI content, validation Q&A, strategic analysis, comments | Delivered |
| Translation APIs (`translate-batch`, `translate-texts`) | Delivered |
| Translation cache (`localStorage` + in-memory) and background preloading | Delivered |
| Display-only translation (database content never overwritten) | Delivered |

---

## Phase 7 — Testing & Delivery

**Goal:** Validate quality and prepare documentation for submission.

| Deliverable | Status |
|---|---|
| Backend pytest suite (45 tests — auth, ideas, AI, messages, translation, votes, avatars) | Delivered |
| SQLite-compatible test database (shared in-memory engine, `FlexibleJSON` columns) | Delivered |
| Frontend production build (`npm run build`) | Delivered |
| Final documentation package (`/prodocs`) | Delivered |
| Production deployment (Render, cloud storage, monitoring) | Not deployed — local MVP; see PRD future roadmap |

---

## Out of Scope for This Delivery (Future Phases)

These items remain in the product vision but were intentionally deferred:

- Enterprise SSO (Azure AD / Okta)
- Admin dashboard and advanced role management
- AI Daily Digest and push/email notifications
- Mixpanel/Amplitude analytics and innovation dashboards
- Cloud object storage for avatars
- Production email for password reset

See [PRD](./PRD.md) and [Progress](./Progress.md) for details.

---

## Appendix — Original Early MVP Planning Record (Preserved)

*The following sections are retained from the initial university project planning phase. They document original assumptions, scope boundaries, and weekly task history. They are not rewritten here so that planning evolution remains auditable.*

---

```yaml
name: Socratix Geliştirme Planı
overview: Kurum içi inovasyon platformu — PostgreSQL + FastAPI + React; kimlik, fikir API, şifre sıfırlama, çok dillilik ve pano filtreleri.
```

### Early task checklist (weekly progress artifact)

| Task area | Original intent | Final outcome |
|---|---|---|
| Backend / frontend scaffold | API + Vite SPA | Completed |
| Idea API (list, create, vote) | Core loop | Extended to full CRUD + lifecycle |
| PostgreSQL persistence | Replace in-memory | Completed |
| Auth JWT | Register/login/me | Completed |
| Users directory | People page | Completed as Employee Directory |
| Password reset | Full flow | UI only; backend deferred |
| i18n EN/TR | Static translations | Extended with dynamic translation |
| Dashboard filters | Sort/filter feed | Completed |
| User-scoped messages | Per-user threads | Completed with backend persistence |

---

# Socratix Ürün Geliştirme Planı (MVP / İlk Çalışan Sürüm)

## 1. Genel Bakış

Socratix, çalışanların fikirlerini paylaşıp diğer çalışanların fikirlerine destek verebildiği kurum içi bir inovasyon platformudur. İlk çalışan sürüm, en basit ve tamamlanmış fikir döngüsünü kanıtlamaya odaklanır: fikir gir, fikirler akışında gör, oy ver.

Bu plan mevcut ürün yönünü takip eder: AI destekli inovasyon iş akışı, güçlü günlük etkileşim hedefi ve pratik MVP teslimat hızı. İlk sürümde "AI mentorluğu" gerçek bir LLM entegrasyonu olarak değil; ürüne hazır bir yer tutucu (mock öneri + mimari kancalar) olarak temsil edilecektir.

Bu teslimatın amacı özellik eksiksizliği değildir. Amaç, şunları kanıtlayan kararlı bir iç MVP başlatmaktır:

- Çalışanlar fikirlerini hızlıca paylaşabilir.
- Fikirler bir akışta görünür olur.
- Çalışanlar oylayarak destek verebilir.
- Platform; AI mentorluğu, yorumlar ve durum iş akışlarına doğru evrilebilir.

## 2. Varsayımlar

Plan gerçekçi tutmak için aşağıdaki varsayımlara dayanmaktadır:

- **Kurum içi kullanım bağlamı:** Platform başlangıçta bir şirket veya ekip tarafından, sınırlı eş zamanlı kullanıcıyla kullanılır.
- **v1'de kimlik doğrulama yok:** Tüm aksiyonlar sistem açısından anonimdir. İlk demo için tek kullanıcı simülasyonu kabul edilebilir.
- **v1'de kalıcı veritabanı yok:** Ürün akışını doğrulamak için in-memory depolama yeterlidir; yeniden başlatmada veri kaybı kabul edilebilir.
- **Web-öncelikli MVP:** Hız için React web uygulaması kullanılır; uzun vadeli ürün native istemciler içerse de.
- **AI aşamalıdır:** İlk sürümde canlı model çağrısı yapılmaz; API kontratları hazırlanır, böylece AI büyük bir yeniden yazım gerektirmeden entegre edilebilir.
- **Orta kalite çıtası:** Fonksiyonel ve demo'ya hazır, temiz hata yönetimiyle; kurumsal sertleştirme henüz değil.
- **Kısa yayın döngüsü:** Ekip, günler içinde uçtan uca teslimata öncelik verir, ardından iç geri bildirimlere göre iteratif iyileştirme yapar.

*Note: Several early assumptions (no auth, in-memory storage, placeholder-only AI) were superseded during implementation. See phases above for the delivered state.*

## 3. Socratix'te Mutlaka Olması Gerekenler

İlk sürümün anlamlı biçimde "Socratix" olarak adlandırılabilmesi için şu minimum ürün yeteneklerini içermesi zorunludur:

**Fikir oluşturma**

Çalışan fikir başlığı ve açıklaması girebilir. Zorunlu alanlar ve maksimum uzunluk gibi temel doğrulama aktiftir.

**Fikir akışı**

Çalışanlar tüm gönderilmiş fikirleri tek bir günlük tarz akışta görüntüleyebilir. Yeni fikirler oluşturulduktan hemen sonra akışta belirir.

**Oylama**

Çalışanlar fikirlere oy verebilir. Oy sayısı görünür olur ve aksiyondan sonra güncellenir.

**AI'a hazır dokunuş noktası (yer tutucu)**

Ürün dili ve veri modeli gelecekteki AI öneri alanlarına izin vermelidir. Basit bir yer tutucu yanıt gösterilebilir: "AI mentorluğu yakında."

**Temel durum takibi**

Fikirler tam anlamıyla etkileşimli olmasa da bir durum alanı içermelidir (`yeni`, `incelemede`, `oylamada`). Bu alan gelecekteki iş akışını destekler.

**Günlük etkileşim niyeti**

Akış ve oy etkileşimleri, tekrarlı günlük kontrolü teşvik edecek kadar sürtünmesiz olmalıdır.

## 4. MVP Kapsamı

### 4.1 Temel Kullanıcı Akışları (Mutlaka Teslim Edilecek)

**Fikir oluşturma akışı**

1. Kullanıcı sayfayı açar.
2. Başlık ve açıklama doldurur.
3. Formu gönderir.
4. Başarı durumu alır.
5. Fikir akışta belirir.

**Feed keşif akışı**

1. Kullanıcı sayfaya girer ve güncel fikirleri görür; sıralama: en yeni önce.
2. Her kart başlık, özet/açıklama, oy sayısı ve durum gösterir.

**Oy verme akışı**

1. Kullanıcı fikir kartındaki oy butonuna tıklar.
2. Başarılı API yanıtından sonra oy sayacı arayüzde artar.
3. Oy başarısız olursa hata mesajı gösterilir.

### 4.2 Yakın Dönem Genişletilmiş Akışlar (Tasarla, Tam İnşa Etme)

Bu akışlar katı MVP inşa kapsamı dışındadır; ancak plan ve mimaride yansıtılmalıdır:

- **AI mentorluğu akışı (sonraki):** Kullanıcı fikir geliştirme talep eder. Backend AI servisini çağırır. Öneriler depolanır ve fikir detayında gösterilir.
- **Fikir yaşam döngüsü akışı (sonraki, yönetici/yönetici):** Yönetici durumu değiştirir (`yeni → inceleme → oylama → onaylandı`). Durum geçmişi görünür hale gelir.
- **Etkileşim akışı genişletmeleri (sonraki):** Yer imleri ve yorumlar. Günlük özet listesi (en iyi/yeni fikirler).

*Several "next" items above were later implemented (AI lifecycle, comments, draft/submitted workflow, messaging, multilingual).*

## 5. Önerilen Teknik Mimari

MVP mimarisi kasıtlı olarak basit, ancak temiz biçimde ayrılabilir tutulmalıdır.

### 5.1 Yüksek Düzey Yapı

- **Frontend:** React + Vite tek sayfa uygulaması.
- **Backend:** FastAPI REST API.
- **Depolama:** In-memory Python yapıları (liste/sözlük).
- **Entegrasyon:** CORS etkin endpoint'ler üzerinden frontend'den backend'e doğrudan HTTP.
- **Week 4 Demo Modu:** Frontend mock veriyle backend'e bağımlı olmadan çalışabilmelidir.

### 5.2 Frontend Katmanı Sorumlulukları

- Arayüz render'ı (form, akış, oy).
- Yerel durum yönetimi (`useState`, `useEffect`).
- API servis katmanı (`GET /ideas`, `POST /ideas`, `POST /ideas/{id}/vote`).
- Kullanıcı geri bildirim durumları: yükleniyor, hata, başarı.

### 5.3 Backend Katmanı Sorumlulukları

- İstek doğrulama (Pydantic şemaları).
- İş kuralları (fikir oluşturma, oy artırma).
- In-memory veri sahipliği.
- Gelecekteki DB destekli implementasyona yetecek kadar kararlı yanıt kontratları.

### 5.4 Gelecekteki AI için Mimari Kararlar

Canlı AI entegrasyonu olmadan bile backend şu uzantı noktalarını tanımlamalıdır:

- `idea.ai_suggestions` alanı (isteğe bağlı liste/metin yer tutucusu).
- Gelecekte isteğe bağlı endpoint yer tutucusu: `POST /ideas/{id}/mentor`.
- LLM entegrasyonunu izole etmek için ileride `ai_service.py` servis soyutlaması planlanır.

## 6. Önerilen Veri Modeli

MVP için gelecekteki ürün ihtiyaçlarını yine de yansıtan kompakt bir veri modeli kullanılır.

### 6.1 Fikir Varlığı (MVP)

- `id` (int)
- `title` (string)
- `description` (string)
- `votes` (int)
- `status` (string enum-like; varsayılan `yeni`)
- `created_at` (datetime string)
- `ai_suggestions` (isteğe bağlı; MVP'de null veya boş)

### 6.2 İsteğe Bağlı Destekleyici Varlık (Sonraki)

- `vote_events` (analitik ve kötüye kullanım önleme kuralları için gelecekte)
  - `idea_id`, `timestamp`, `actor_id` (kimlik doğrulama mevcut olduğunda)

### 6.3 Bu Model Neden

- Mevcut MVP özelliklerini doğrudan destekler.
- Durum takibi ve AI mentorluğu eklenirken yeniden tasarımı önler.
- Veritabanına geçişi kolaylaştırır (alan uyumlu yaklaşım).

## 7. Backend Geliştirme Fazları

### Faz B1 — Temel

- FastAPI uygulamasını ve proje yapısını başlat.
- Frontend origin'leri için CORS yapılandırması ekle.
- Oluşturma/listeleme/oy yanıtları için Pydantic şemalarını tanımla.
- Temel sağlık temeliyle kurulum yap (`/docs` ve opsiyonel root sağlık mesajı).

### Faz B2 — Çekirdek Fikir API'leri

- `GET /ideas` endpoint'ini yaz.
- `POST /ideas` endpoint'ini yaz.
- `POST /ideas/{id}/vote` endpoint'ini yaz.
- Temel hata yönetimi ekle: eksik fikir için `404`, doğrulama hataları için `422`.

### Faz B3 — MVP için Ürün Kuralları

- Oluşturmada varsayılan durum ekle (`yeni`).
- Girdi metnini normalize et ve kırp.
- Akışta deterministik sıralama sağla (ör. en yeni önce).
- Oy güncellemelerinin tek süreç çalışma zamanında atomik olmasını sağla.

### Faz B4 — MVP Sertleştirme

- API yanıt tutarlılığını iyileştir.
- Şunlar için hafif testler ekle: oluşturma başarı/başarısızlık, liste davranışı, oy başarı/bulunamadı.
- Gelecekteki AI alanları için minimal uzantı yer tutucusu hazırla.

## 8. Frontend Geliştirme Fazları

### Faz F1 — Uygulama İskeleti

- React + Vite projesini önyükle.
- Bölümlerle tek sayfalık düzen oluştur: fikir oluşturma formu, fikir akış listesi.
- Okunabilirlik ve kullanılabilirlik için temel stil ekle.

### Faz F2 — Backend Entegrasyonu

- Liste/oluşturma/oy için API çağrılarını uygula.
- Sayfa açıldığında fikirleri yükle.
- Oluşturma ve oy işlemlerinden sonra listeyi yenile.

### Faz F3 — Etkileşim Kalitesi

- Form doğrulama geri bildirimi (zorunlu alanlar).
- Yükleniyor ve devre dışı buton durumları.
- Hata geri bildirim banner'ı/mesajı.
- Fikir yoksa boş durum.

### Faz F4 — MVP UX Tamamlama

- Durum ve oy sayısını her fikir kartında net göster.
- Günlük kullanım için etkileşimleri düşük sürtünmeli tut.
- Backend kapalı/hata durumunu kullanıcıya anlaşılır şekilde sun.

## 9. MVP Sonrası Önerilen Modüller

Bu modüller MVP doğrulama sonrasında planlanmalı ve geliştirilmelidir:

**AI Mentorluğu Modülü:** Gerçek öneri üretimi (geliştirme, şeytanın avukatı istemleri). Öneri kabul takibi.

**Fikir Detayı ve Durum İş Akışı:** Detay görüntüleme sayfası. Yönetici/admin durum geçişleri. Durum zaman çizelgesi/geçmişi.

**Sosyal Etkileşim Modülü:** Yorumlar. Yer imleri. Kişiselleştirilmiş akış sıralaması.

**Kimlik ve İzinler:** SSO veya temel kimlik doğrulama. Rol modeli (çalışan, yönetici, admin). Denetim izi.

**Kalıcılık ve Analitik:** In-memory'den PostgreSQL'e geçiş. Ürün olay takibi ekleme (oluşturma, oy, etkileşim derinliği). KPI dashboard desteği ekleme.

## 10. Uygulama Sırası

İlk çalışan ürüne en hızlı ulaşmak için önerilen yürütme sırası:

1. MVP kontratlarını sonuçlandır (fikir şeması ve üç API endpoint'i).
2. In-memory veriyle backend API'lerini inşa et.
3. Frontend sayfa yapısını inşa et.
4. Frontend'i backend API'leriyle entegre et.
5. Doğrulama/yükleniyor/hata durumları ekle.
6. Fikir kartlarında durum alanı görünürlüğü ekle.
7. Uçtan uca manuel test senaryoları yürüt.
8. Kararlı hale getir ve çalıştırma talimatlarını belgele.
9. Örnek fikir verileriyle iç demo gerçekleştir.
10. Geri bildirimleri topla ve MVP sonrası modüllere öncelik sırası ver.

## 11. İlk Teslimat İçin Başarı Kriterleri

### 11.1 Fonksiyonel Kriterler

- Kullanıcı arayüzden fikir oluşturup anında akışta görebilir.
- Kullanıcı fikre oy verebilir ve güncel sayıyı görebilir.
- Akış güvenilir biçimde backend API'sinden yüklenir.
- Backend tüm zorunlu endpoint'leri destekler: `GET /ideas`, `POST /ideas`, `POST /ideas/{id}/vote`.

### 11.2 Ürün Kriterleri

- Akış, onboarding olmaksızın ilk kez kullanan iç kullanıcılar için sezgiseldir.
- Temel değer 2 dakika içinde görünür: "Fikirlerimi paylaşabilir ve başkalarını destekleyebilirim."
- Platform, AI destekli bir inovasyon motoru için temel gibi hissettirmeye hazırdır.

### 11.3 Teknik Kriterler

- Uygulama basit kurulumla yerel olarak çalışır.
- Normal oluşturma/listeleme/oy kullanımında bloke edici runtime hatası yoktur.
- API hataları kullanıcı arayüzünde zarif biçimde yönetilir.
- Kod yapısı, AI ve DB entegrasyonuna yeniden yazım gerektirmeden izin verir.

### 11.4 MVP Çıkış Kararı

İç pilot kullanım sonrasında MVP, şu koşullar sağlandığında tamamlanmış sayılabilir:

- Temel akışlar kararlıdır.
- İç paydaşlar değeri onaylamıştır.
- MVP sonrası ilk 3 öncelik tanımlanmıştır (tipik olarak: AI mentorluğu, kimlik doğrulama, kalıcılık).
