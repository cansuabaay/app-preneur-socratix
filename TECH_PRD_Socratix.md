# Socratix — Technical PRD

**Platform:** iOS Native (Swift)
**Aşama:** Faz 1 — MVP
**Durum:** Onaylandı

---

## İçindekiler

1. [Ürün Vizyonu ve İş Hedefleri](#1-ürün-vizyonu-ve-iş-hedefleri)
2. [Teknoloji Yığını ve Mimari](#2-teknoloji-yığını-ve-mimari)
3. [Veritabanı Şeması](#3-veritabanı-şeması)
4. [API Uç Noktaları](#4-api-uç-noktaları)
5. [Ekranlar ve Kullanıcı Akışı](#5-ekranlar-ve-kullanıcı-akışı)
6. [User Stories & Acceptance Criteria](#6-user-stories--acceptance-criteria)
7. [Kapsam Dışı](#7-kapsam-dışı-faz-1-için)

---

## 1. Ürün Vizyonu ve İş Hedefleri (Özet)

Socratix, kurumsal çalışanların fikirlerini AI mentorluğuyla olgunlaştırdığı, demokratik bir oylama sistemiyle en değerli fikirlerin yüzeye çıktığı ve her gün açılmak istenen bir inovasyon motoru iOS uygulamasıdır.

**Kuzey Yıldızı Metriği:** Platforma girilen ve AI desteğiyle "Tamamlandı" statüsüne ulaşan fikir sayısı.

**Günlük Alışkanlık Metriği:** DAU / MAU oranı — Hedef: %30+

---

## 2. Teknoloji Yığını ve Mimari

MVP aşamasında hız, kurumsal veri güvenliği ve native iOS deneyimi dengesi gözetilmiştir.

| Katman | Teknoloji | Amaç |
|---|---|---|
| Mobil İstemci | iOS Native (Swift 5.9+, SwiftUI) | Akıcı animasyonlar, native UX |
| Backend API | FastAPI (Python) | Tüm iş mantığı ve AI yönlendirme |
| Sunucu | Render | FastAPI deployment |
| Veritabanı | Supabase (PostgreSQL) | İlişkisel veri |
| AI Motoru | Azure OpenAI GPT-4o | Fikir mentorluğu (kurumsal DPA ile) |
| AI Yedek | Llama 3 8B (Ollama, self-hosted) | Air-gapped kurumlar için |
| Dosya Depolama | Supabase Storage | Profil görselleri |
| Analitik | Mixpanel veya Amplitude | Davranışsal event tracking |
| Hata Takibi | Sentry | iOS crash ve API hata izleme |
| Bildirimler | APNs (Apple Push Notification) | Günlük digest, fikir durum bildirimleri |
| Test Ortamı | Apple TestFlight | Beta dağıtım |

> **Auth Notu:** Kurumsal SSO (SAML 2.0 / OIDC — Azure AD, Okta) birincil giriş yöntemi olarak planlanmaktadır. iOS tarafında `ASWebAuthenticationSession` ile entegre edilecektir. Karar Sprint 0'da netleştirilecektir.

---

## 3. Veritabanı Şeması (Supabase / PostgreSQL)

FastAPI üzerinden Supabase'e yazılacak ilişkisel veri modeli aşağıdaki gibidir.

### users

| Sütun | Veri Tipi | Özellikler | Açıklama |
|---|---|---|---|
| id | UUID | Primary Key, Auto-gen | Kullanıcının eşsiz kimliği |
| sso_sub_id | VARCHAR | Unique, Not Null | SSO sağlayıcısından dönen benzersiz ID |
| email | VARCHAR | Unique, Not Null | Kurumsal e-posta |
| full_name | VARCHAR(100) | Not Null | Ad Soyad |
| department | VARCHAR(100) | Nullable | Departman (SSO claim'den çekilir) |
| role | ENUM | Not Null | employee / manager / admin |
| created_at | TIMESTAMPTZ | Default: NOW() | Kayıt tarihi |

### ideas

| Sütun | Veri Tipi | Özellikler | Açıklama |
|---|---|---|---|
| id | UUID | Primary Key, Auto-gen | Fikrin eşsiz kimliği |
| author_id | UUID | Foreign Key -> users(id) | Fikri giren çalışan |
| title | VARCHAR(200) | Not Null | Fikir başlığı |
| description | TEXT | Not Null | Fikrin açıklaması |
| status | ENUM | Not Null | draft / review / voting / approved / archived |
| category | VARCHAR(100) | Nullable | Departman veya konu kategorisi |
| ownership_hash | VARCHAR(64) | Not Null | SHA-256 (user_id + content + timestamp) |
| created_at | TIMESTAMPTZ | Default: NOW() | İlk taslak tarihi |
| published_at | TIMESTAMPTZ | Nullable | Yayınlanma tarihi |

### ai_suggestions

| Sütun | Veri Tipi | Özellikler | Açıklama |
|---|---|---|---|
| id | UUID | Primary Key, Auto-gen | Öneri kaydı ID'si |
| idea_id | UUID | Foreign Key -> ideas(id) | Hangi fikre ait |
| suggestion_type | ENUM | Not Null | improvement / similar_warning / devils_advocate |
| content | TEXT | Not Null | AI'nın ürettiği öneri metni |
| accepted | BOOLEAN | Nullable | Kullanıcı kabul etti mi (null = henüz yanıt yok) |
| created_at | TIMESTAMPTZ | Default: NOW() | Üretim zamanı |

### votes

| Sütun | Veri Tipi | Özellikler | Açıklama |
|---|---|---|---|
| id | UUID | Primary Key, Auto-gen | Oy kaydı ID'si |
| idea_id | UUID | Foreign Key -> ideas(id) | Oylanan fikir |
| user_id | UUID | Foreign Key -> users(id) | Oy kullanan kullanıcı |
| created_at | TIMESTAMPTZ | Default: NOW() | Oy zamanı |

> Kısıt: (idea_id, user_id) çifti UNIQUE olmalıdır. Kullanıcı kendi fikrine oy veremez; bu kural backend tarafında enforce edilir.

### bookmarks

| Sütun | Veri Tipi | Özellikler | Açıklama |
|---|---|---|---|
| id | UUID | Primary Key, Auto-gen | Kaydetme kaydı ID'si |
| idea_id | UUID | Foreign Key -> ideas(id) | Kaydedilen fikir |
| user_id | UUID | Foreign Key -> users(id) | Kaydeden kullanıcı |
| created_at | TIMESTAMPTZ | Default: NOW() | Kaydetme zamanı |

### comments

| Sütun | Veri Tipi | Özellikler | Açıklama |
|---|---|---|---|
| id | UUID | Primary Key, Auto-gen | Yorum ID'si |
| idea_id | UUID | Foreign Key -> ideas(id) | Hangi fikre ait |
| author_id | UUID | Foreign Key -> users(id) | Yorum yapan kullanıcı |
| content | TEXT | Not Null | Yorum metni |
| created_at | TIMESTAMPTZ | Default: NOW() | Yorum zamanı |

### events (Davranış Loglama)

| Sütun | Veri Tipi | Özellikler | Açıklama |
|---|---|---|---|
| id | UUID | Primary Key, Auto-gen | Event ID'si |
| user_id | UUID | Foreign Key -> users(id) | Aksiyonu yapan kullanıcı |
| event_name | VARCHAR(100) | Not Null | idea_draft_started, vote_cast vb. |
| properties | JSONB | Nullable | Event'e özel meta veri |
| created_at | TIMESTAMPTZ | Default: NOW() | Event zamanı |

---

## 4. API Uç Noktaları (FastAPI — REST/JSON)

Swift uygulamasının haberleşeceği temel uç noktalar. Tüm korumalı endpoint'ler `Authorization: Bearer <JWT>` header'ı gerektirir.

### POST /api/v1/auth/sso

Payload: `{ "identity_token": "string", "provider": "azure_ad" }`

İşlem: SSO token'ı doğrulanır. Kullanıcı Supabase'de yoksa yaratılır, varsa getirilir. Geriye sisteme özel JWT döner. Token cihazda Keychain'e kaydedilir.

---

### GET /api/v1/feed

Parametreler: `filter` (all / my_dept / popular / newest), `cursor` (sayfalama), `limit` (default: 20)

İşlem: JWT üzerinden tespit edilen kullanıcının kişiselleştirilmiş fikir akışını döner. Sıralama algoritması: `(oy x 0.4) + (yorum x 0.3) + (yenilik x 0.2) + (kişisel ilgi x 0.1)`

---

### POST /api/v1/ideas

Payload: `{ "title": "string", "description": "string", "category": "string" }`

İşlem (Core Logic):
- ideas tablosuna status: "draft" olarak kaydedilir.
- Ownership hash üretilir: SHA-256(user_id + title + description + timestamp).
- AI servisine fikir gönderilir (async). improvement ve similar_warning tipi öneriler ai_suggestions tablosuna yazılır.
- Yanıtta oluşturulan fikir ve AI önerileri birlikte döner.

---

### POST /api/v1/ideas/:id/publish

İşlem (Core Logic):
- AI'dan devils_advocate tipi 3-5 kritik soru üretilir.
- Sorular ai_suggestions tablosuna yazılır.
- Yanıtta sorular döner; kullanıcı yanıtlayacak veya atlayacak.

---

### PATCH /api/v1/ideas/:id/publish/confirm

Payload: `{ "answers": [{ "suggestion_id": "uuid", "answer": "string" }] }`

İşlem: Kullanıcının yanıtları kaydedilir. Fikrin status'u "review"a güncellenir. Atlanmış sorular skipped: true olarak loglanır.

---

### POST /api/v1/ideas/:id/vote

İşlem: Oy kaydedilir. Yanıtta güncel oy sayısı döner. Günlük 20 oy limitini aşan istekler 429 koduyla reddedilir.

---

### POST /api/v1/ai/suggestions/:id/respond

Payload: `{ "accepted": true }`

İşlem: AI önerisinin kabul veya red durumu ai_suggestions tablosuna yazılır.

---

### GET /api/v1/digest/daily

İşlem: Kullanıcının ilgi alanına göre AI tarafından seçilmiş günün 3 fikrini döner. APNs bildirimi bu endpoint'e deep link içerir.

---

## 5. Ekranlar ve Kullanıcı Akışı

Arayüz tasarımı native iOS tasarım sistemine uygundur: SF Symbols, UIBlurEffect tabanlı buzlu cam kartları, UIImpactFeedbackGenerator haptic feedback ve Lottie animasyonları kullanılacaktır.

### Splash & Login Ekranı

Temiz, beyaz arka plan. Ortada yalnızca uygulama logosu. Alt kısımda tek bir buton: "Kurumsal Hesapla Giriş Yap". ASWebAuthenticationSession ile SSO akışı başlatılır.

### Onboarding — İlk Kullanım Ekranı

SSO'dan gelen ad ve departman bilgisi gösterilir, kullanıcı onaylar. İlgi alanı seçimi (kategori çoktan seçme) yapılır; bu seçim Digest kişiselleştirmede kullanılır.

### Dashboard (Ana Ekran)

Üst Bar: Uygulama adı, bildirim ikonu ve profil avatarı.

Filtre: UISegmentedControl ile Tümü / Departmanım / Popüler / Yeni seçenekleri.

Fikir Kartı: Başlık, yazar adı, departman, yayın zamanı, durum etiketi, oy ve yorum sayacı, kaydet ikonu. Tek dokunuşla oy verilebilir (optimistic UI).

Floating Action Button: Sağ alt köşede sabit "Fikir Ekle" butonu.

### Fikir Oluşturma Ekranı

Tam ekran metin girişi (başlık ve açıklama). Kullanıcı yazarken 800ms debounce ile AI öneri paneli UISheetPresentationController aracılığıyla ekranın altından açılır. Panelde "Uygula" ve "Reddet" aksiyonları yer alır. Benzer fikir uyarısı inline banner olarak gösterilir.

### Devil's Advocate Ekranı

Kullanıcı "Yayınla"ya bastığında bottom sheet açılır. AI, fikrin kategorisine özel 3-5 kritik soru üretir. Kullanıcı soruları yanıtlayabilir ya da "Atla" ile geçebilir. Her iki durumda da fikir yayınlanır.

### Fikir Detay Ekranı

Başlık, açıklama, yazar bilgisi ve yayın tarihi gösterilir. Durum adımları görsel olarak takip edilir: Taslak > İnceleme > Oylama > Onay. AI analizi bölümünde Devil's Advocate soruları ve kullanıcı yanıtları listelenir. Yorum bölümü ve yorum yazma alanı yer alır. Yönetici görünümünde "Durumu Değiştir" aksiyonu ve zorunlu not alanı gösterilir.

### Günlük Digest Bildirimi

Her sabah 08:30'da APNs push bildirimi gönderilir. Bildirime dokunulduğunda deep link ile GET /digest/daily çağrılır ve günün 3 fikri listelenir. Kullanıcı ayarlardan saat ve sıklık tercihini değiştirebilir.

---

## 6. User Stories & Acceptance Criteria (Backlog)

### EPIC 1: Kimlik Doğrulama

**US 1.1 — Kurumsal SSO ile Giriş**

Hikaye: Bir çalışan olarak, ayrı şifre oluşturmak yerine şirket hesabımla uygulamaya giriş yapmak istiyorum.

Kabul Kriterleri:
- Given: Kullanıcı uygulamayı ilk kez açmıştır.
- When: "Kurumsal Hesapla Giriş Yap" butonuna basar ve ASWebAuthenticationSession ile SSO akışını tamamlarsa;
- Then: FastAPI tarafında token doğrulanmalı, Supabase'de users tablosunda kayıt yoksa oluşturulmalıdır.
- And: JWT cihazın Keychain'ine kaydedilmeli; kullanıcı ilgi alanı seçmemişse Onboarding ekranına yönlendirilmelidir.
- Hata Durumu: İnternet yoksa UIAlertController ile "Bağlantı hatası, lütfen tekrar deneyin" uyarısı gösterilmelidir.

---

### EPIC 2: Fikir Üretimi ve AI Mentorluk

**US 2.1 — Akıllı Fikir Girişi**

Hikaye: Bir çalışan olarak, fikir yazarken AI'nın gerçek zamanlı öneriler sunmasını istiyorum; böylece fikrimi daha güçlü şekilde yayınlayabileyim.

Kabul Kriterleri:
- Given: Kullanıcı "Fikir Ekle" ekranını açmıştır.
- When: Başlık veya açıklama alanına 3 veya daha fazla kelime girerse (debounce: 800ms);
- Then: POST /ideas çağrılmalı; AI öneri paneli ekranın altından UISheetPresentationController ile açılmalıdır.
- And: Öneri P95 latency < 3 saniye içinde görünmelidir.
- And: Kullanıcı "Uygula" veya "Reddet"e her bastığında POST /ai/suggestions/:id/respond çağrılmalıdır.
- And: Benzer fikir mevcutsa inline banner gösterilmeli ve ilgili fikre link verilmelidir.

**US 2.2 — AI Devil's Advocate**

Hikaye: Bir çalışan olarak, fikrimi yayınlamadan önce AI'nın zayıf noktalarımı görmeme yardımcı olmasını istiyorum.

Kabul Kriterleri:
- Given: Kullanıcı taslak fikri tamamlamış ve "Yayınla"ya basmıştır.
- When: POST /ideas/:id/publish çağrılırsa;
- Then: Bottom sheet açılmalı; AI fikrin kategorisine özel 3-5 soru üretmelidir. Generic sorular kabul edilmez.
- And: Kullanıcı soruları yanıtlayabilmeli ya da "Atla" ile geçebilmelidir.
- And: PATCH /ideas/:id/publish/confirm çağrılmalı; fikir "review" statüsüne geçmelidir.
- And: Verilen yanıtlar fikrin detay sayfasında herkese görünür olmalıdır.
- Hata Durumu: AI servisi yanıt vermezse sorular atlanmalı, fikir yayınlanmaya devam etmelidir (graceful degradation).

---

### EPIC 3: Sosyal Etkileşim ve Günlük Akış

**US 3.1 — İnovasyon Akışını Keşfetme**

Hikaye: Bir çalışan olarak, şirketteki popüler ve yeni fikirleri kaydırarak keşfetmek istiyorum.

Kabul Kriterleri:
- Given: Kullanıcı Dashboard'u açmıştır.
- When: Ekran yüklenir;
- Then: GET /feed çağrılmalı; ilk yükleme P95 < 2 saniye içinde tamamlanmalıdır.
- And: Kartlar sıralama algoritmasına göre listelenmeli; filtre değiştirildiğinde liste animasyonlu olarak yenilenmelidir.
- And: Kullanıcı aşağı kaydırdıkça cursor tabanlı infinite scroll ile yeni kartlar yüklenmelidir.

**US 3.2 — Tek Dokunuşla Oy Verme**

Hikaye: Bir çalışan olarak, beğendiğim fikirlere tek dokunuşla oy vermek istiyorum.

Kabul Kriterleri:
- Given: Kullanıcı feed'de bir fikir kartı görüntülemektedir.
- When: Oy ikonuna dokunursa;
- Then: Optimistic UI ile oy sayacı anında güncellenmeli; UIImpactFeedbackGenerator ile hafif titreşim verilmelidir.
- And: POST /ideas/:id/vote async olarak çağrılmalıdır.
- And: Kullanıcı kendi fikrine dokunamazsa buton devre dışı olmalı ve açıklayıcı bir tooltip gösterilmelidir.
- And: Günlük 20 oy limitine ulaşılırsa "Günlük oy limitine ulaştınız" banner'ı gösterilmelidir.
- Hata Durumu: API başarısız olursa optimistic update geri alınmalı; sayaç eski değerine dönmelidir.

**US 3.3 — Günlük Digest Bildirimi**

Hikaye: Bir çalışan olarak, her sabah ilgi alanıma göre seçilmiş 3 fikri bildirim olarak almak istiyorum; böylece uygulamaya girmek için her gün bir nedenim olsun.

Kabul Kriterleri:
- Given: Kullanıcı bildirim iznini vermiştir.
- When: Sabah 08:30'da APNs bildirimi gelir ve kullanıcı bildirimi açarsa;
- Then: Deep link ile GET /digest/daily çağrılmalı; günün 3 fikri listelenmelidir.
- And: Her kart ilgili fikrin detay ekranına yönlendirmelidir.
- And: Kullanıcı ayarlardan bildirim saatini (08:00–12:00 arası) ve sıklığını (günlük / haftalık) değiştirebilmelidir.

---

### EPIC 4: Kurumsal Entegrasyon ve Güvenlik

**US 4.1 — Fikir Sahipliği Mühürü**

Hikaye: Bir çalışan olarak, fikrimin bana ait olduğunun değiştirilemez şekilde kayıt altına alındığını bilmek istiyorum.

Kabul Kriterleri:
- Given: Kullanıcı yeni bir fikir oluşturmuştur.
- When: POST /ideas çağrılırsa;
- Then: Server-side SHA-256 hash (user_id + içerik + timestamp) üretilmeli; ideas.ownership_hash alanına yazılmalıdır.
- And: Fikrin detay sayfasında sahip adı, tarih ve hash bilgisi görünür olmalıdır.
- And: Fikir güncellense de orijinal hash ve içerik korunmalıdır (versiyon geçmişi).

---

### EPIC 5: Takip ve Analiz

**US 5.1 — Kullanıcı Davranış Loglama**

Hikaye: Ürün ekibi olarak, AI önerilerinin ne oranda kabul edildiğini ve fikir formunun hangi adımında terk edildiğini ölçmek istiyoruz.

Kabul Kriterleri:
- Given: Herhangi bir kullanıcı aksiyonu gerçekleşir.
- When: Aşağıdaki event'lerden biri tetiklenir;
- Then: events tablosuna ve Mixpanel / Amplitude'a ilgili event kaydedilmelidir.

İzlenen Event'ler:

| Event | Tetikleyici |
|---|---|
| idea_draft_started | Fikir Ekle ekranı açıldı |
| idea_published | Fikir review statüsüne geçti |
| idea_draft_abandoned | Ekran kapatıldı, taslak tamamlanmadı |
| ai_suggestion_shown | AI öneri paneli açıldı |
| ai_suggestion_accepted | Kullanıcı Uygula'ya bastı |
| ai_suggestion_dismissed | Kullanıcı Reddet'e bastı |
| vote_cast | Oy verildi |
| bookmark_added | Fikir kaydedildi |
| feed_item_engaged | Kart 5 saniyeden uzun görüntülendi |
| digest_notification_tapped | APNs bildirimine dokunuldu |

> KVKK Notu: Tüm event'ler anonim user_id (UUID) ile loglanır. İsim veya e-posta analitik platformuna gönderilmez. Mixpanel / Amplitude ile veri işleme sözleşmesi (DPA) imzalanmalıdır.

---

## 7. Kapsam Dışı (Faz 1 İçin)

- Android uygulaması (Faz 1 iOS ile doğrulama yapılacak)
- Yönetim paneli ve gelişmiş analitik dashboard
- Jira / Confluence entegrasyonu
- AI ile fikir birleştirme (merge) özelliği
- Rozet ve puan sistemi (gamification)
- Canlı mesajlaşma ve direkt mesajlaşma
- Çok dilli AI çıktısı
- In-App Purchase ve premium üyelik modeli
