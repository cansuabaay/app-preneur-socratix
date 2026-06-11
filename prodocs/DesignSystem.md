# Socratix — Tasarım Sistemi

**Sürüm:** MVP (dark glassy edition)  
**Kaynak dosyalar:** `frontend/src/styles/tokens.css`, `frontend/src/styles/design-system.css`  
**Bileşenler:** `frontend/src/components/ds/`

Bu doküman, repository'deki gerçek CSS token'larına ve React bileşen yapısına dayanır. Harici UI kütüphanesi (MUI, Chakra, Tailwind vb.) kullanılmamaktadır.

---

## 1. Tasarım Felsefesi

Socratix arayüzü **koyu tema + cam efektli (glassmorphism) kartlar** üzerine kuruludur. Hedef:

- Kurumsal inovasyon bağlamında güven veren, ciddi ama modern bir görünüm
- AI özelliklerini vurgulayan mavi–mor gradyan aksanlar
- Düşük sürtünmeli günlük kullanım (feed kaydırma, tek tıkla oy, hızlı fikir girişi)
- Mobil uyumlu responsive düzen (nav etiketleri dar ekranda gizlenir)

Sayfa arka planı çok katmanlı radial gradyanlarla "nebula" hissi verir; içerik cam kartlar üzerinde okunabilir kalır.

---

## 2. Renk Paleti

Tüm renkler `tokens.css` içindeki CSS custom property'ler olarak tanımlıdır.

### 2.1 Marka mavileri (navy scale)

| Token | Hex | Kullanım |
|---|---|---|
| `--color-navy-950` | `#060d1a` | En koyu yüzey, sayfa tabanı |
| `--color-navy-900` | `#0a1628` | — |
| `--color-navy-800` | `#0f2348` | — |
| `--color-navy-700` | `#163060` | — |
| `--color-navy-600` | `#1d3f80` | — |
| `--color-navy-500` | `#2554a8` | — |

### 2.2 Birincil aksan (electric blue-violet)

| Token | Hex / Değer | Kullanım |
|---|---|---|
| `--color-brand` | `#4f8ef7` | Linkler, aktif nav, odak halkası |
| `--color-brand-vivid` | `#6366f1` | Gradyan ikinci ton |
| `--color-brand-glow` | `rgba(79, 142, 247, 0.22)` | Glow gölgesi |
| `--color-brand-soft` | `rgba(99, 102, 241, 0.14)` | Yumuşak vurgu arka planı |

Birincil buton gradyanı: `linear-gradient(135deg, #4f8ef7 0%, #6366f1 100%)`

### 2.3 İkincil aksanlar

| Token | Hex | Kullanım |
|---|---|---|
| `--color-purple` | `#a855f7` | FAB gradyanı, marka logosu metni |
| `--color-purple-soft` | `rgba(168, 85, 247, 0.14)` | Badge arka planı |
| `--color-teal` | `#14b8a6` | Başarı/aksan badge |
| `--color-teal-soft` | `rgba(20, 184, 166, 0.15)` | Teal badge arka planı |

### 2.4 Yüzeyler (dark theme)

| Token | Hex | Kullanım |
|---|---|---|
| `--color-surface-0` | `#060d1a` | Sayfa arka planı |
| `--color-surface-1` | `#0d1b2e` | Kart arka planı |
| `--color-surface-2` | `#132036` | Yükseltilmiş kart |
| `--color-surface-3` | `#1a2942` | En yüksek katman |

Cam efekti: `--glass-bg: rgba(13, 27, 46, 0.7)` + `backdrop-filter: blur(20px) saturate(160%)`

### 2.5 Metin

| Token | Hex | Kullanım |
|---|---|---|
| `--color-text-primary` | `#f0f6ff` | Başlıklar, ana metin |
| `--color-text-secondary` | `#94a3b8` | Gövde metni, alt başlıklar |
| `--color-text-muted` | `#4a6080` | Meta bilgi, placeholder |
| `--color-white` | `#ffffff` | Buton metni |

### 2.6 Anlamsal (semantic) renkler

| Token | Hex | Kullanım |
|---|---|---|
| `--color-danger` | `#f87171` | Hata mesajları, tehlikeli aksiyon |
| `--color-danger-soft` | `rgba(248, 113, 113, 0.12)` | Hata banner arka planı |
| `--color-warning` | `#fb923c` | Uyarı badge |
| `--color-warning-soft` | `rgba(251, 146, 60, 0.12)` | — |
| `--color-success` | `#34d399` | Başarı toast, tamamlanmış adım |
| `--color-success-soft` | `rgba(52, 211, 153, 0.12)` | Başarı banner |

### 2.7 Kenarlık

| Token | Değer |
|---|---|
| `--color-border` | `rgba(255, 255, 255, 0.08)` |
| `--color-border-strong` | `rgba(79, 142, 247, 0.45)` |

---

## 3. Tipografi

### Font ailesi

```css
--font-sans: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

Inter birincil font olarak tanımlıdır; yüklenemezse sistem fontlarına düşer. Harici Google Fonts import'u `index.html`'de yok — production'da Inter eklenmesi önerilir.

### Boyut skalası

| Token | Rem | Piksel (16px taban) | Kullanım |
|---|---|---|---|
| `--text-xs` | 0.6875rem | 11px | Badge, label, meta |
| `--text-sm` | 0.8125rem | 13px | Buton, input, gövde küçük |
| `--text-base` | 0.9375rem | 15px | Varsayılan gövde |
| `--text-lg` | 1.0625rem | 17px | Alt başlık, nav marka |
| `--text-xl` | 1.25rem | 20px | Kart başlığı |
| `--text-2xl` | 1.5rem | 24px | Sayfa alt başlığı |
| `--text-3xl` | 1.875rem | 30px | H1 (mobil) |
| `--text-4xl` | 2.25rem | 36px | H1 (desktop) |
| `--text-5xl` | 3rem | 48px | Hero (nadir) |

### Satır yüksekliği

| Token | Değer |
|---|---|
| `--leading-tight` | 1.2 |
| `--leading-snug` | 1.35 |
| `--leading-normal` | 1.55 |
| `--leading-relaxed` | 1.7 |

### Hazır tipografi sınıfları

| Sınıf | Ağırlık | Kullanım |
|---|---|---|
| `.ds-heading-1` | 800 | Sayfa ana başlığı |
| `.ds-heading-2` | 700 | Bölüm başlığı |
| `.ds-heading-3` | 600 | Kart içi başlık |
| `.ds-body` | normal | Açıklama paragrafı |
| `.ds-body-sm` | normal | Küçük açıklama |
| `.ds-label` | 700, uppercase, letter-spacing 0.06em | Form etiketleri |

---

## 4. Boşluk, Köşe ve Gölge

### Spacing (`--space-*`)

4px tabanlı skala: `--space-1` (4px) … `--space-16` (64px)

### Border radius

| Token | Değer | Kullanım |
|---|---|---|
| `--radius-sm` | 6px | Badge |
| `--radius-md` | 10px | Buton, input |
| `--radius-lg` | 16px | Mesaj balonu |
| `--radius-xl` | 22px | Kart |
| `--radius-2xl` | 28px | Auth kartı |
| `--radius-full` | 9999px | Avatar, chip, FAB |

### Gölgeler

| Token | Kullanım |
|---|---|
| `--shadow-sm` … `--shadow-xl` | Derinlik katmanları |
| `--shadow-glow` | Odak / primary buton halkası |
| `--shadow-glow-purple` | Mor vurgu odak |

### Geçişler (motion)

| Token | Süre |
|---|---|
| `--transition-fast` | 140ms |
| `--transition-base` | 220ms |
| `--transition-slow` | 350ms |

Sayfa giriş animasyonu: `ds-page-enter` (opacity + translateY)

---

## 5. UI Bileşen Yapısı

### 5.1 Katmanlar

```
frontend/src/
├── components/ds/          # Yeniden kullanılabilir primitives
│   ├── Button.jsx          # variant: primary | secondary | ghost | danger | floating
│   ├── Card.jsx            # ds-card wrapper, interactive mod
│   ├── TextInput.jsx
│   ├── Textarea.jsx
│   ├── Select.jsx
│   ├── Icon.jsx            # Inline SVG ikon seti
│   └── SocratixLogo.jsx
├── components/layout/
│   └── AppShell.jsx        # Sticky header, nav, toast, dil toggle
├── components/ideas/
│   └── IdeaFeedCard.jsx    # Feed kartı (domain-specific)
├── components/profile/
│   └── ProfileAvatar.jsx
└── components/AiSuggestionsSection/
    └── AiSuggestionsSection.jsx
```

**Kural:** Genel UI primitives `ds/` altında; sayfa/alan özel bileşenler kendi klasörlerinde. Stil önceliği CSS sınıflarıdır (`.ds-*`); bileşenler sınıf adlarını birleştirir.

### 5.2 Buton varyantları

| Varyant | CSS sınıfı | Görünüm |
|---|---|---|
| Primary | `.ds-btn-primary` | Mavi–indigo gradyan, beyaz metin |
| Secondary | `.ds-btn-secondary` | Cam outline, şeffaf arka plan |
| Ghost | `.ds-btn-ghost` | Metin only, hover'da hafif arka plan |
| Danger | `.ds-btn-danger` | Kırmızı yumuşak arka plan |
| Floating (FAB) | `.ds-btn-floating` | Sabit sağ alt; mavi–mor gradyan |

Boyut modları: `.ds-btn-sm`, `.ds-btn-block`

### 5.3 Kartlar

| Sınıf | Kullanım |
|---|---|
| `.ds-card` | Genel cam kart |
| `.ds-card-interactive` | Hover'da yükselme; tıklanabilir feed kartları |
| `.ds-card-auth` | Login/SignUp — daha parlak kenarlık ve gölge |

### 5.4 Form elemanları

| Sınıf | Bileşen |
|---|---|
| `.ds-input` | TextInput |
| `.ds-textarea` | Textarea |
| `.ds-select` | Select |
| `.ds-input-error` | Doğrulama hatası |
| `.ds-field-error` | Hata metni |

Odak durumu: mavi border + `box-shadow: 0 0 0 3px rgba(79, 142, 247, 0.2)`

### 5.5 Navigasyon ve filtreler

| Sınıf | Kullanım |
|---|---|
| `.ds-header-bar` | Sticky üst bar (blur) |
| `.ds-nav-link` / `.ds-nav-link-active` | Ana navigasyon |
| `.ds-tabs` / `.ds-tab` / `.ds-tab-active` | Dashboard filtre sekmeleri |
| `.ds-chip` / `.ds-chip-selected` | Kayıt ilgi alanı seçimi |

### 5.6 Badge'ler

| Sınıf | Renk |
|---|---|
| `.ds-badge-navy` | Mavi — Draft |
| `.ds-badge-accent` | Teal — Submitted |
| `.ds-badge-purple` | Mor — AI Reviewed |
| `.ds-badge-warning` | Turuncu |
| `.ds-badge-success` | Yeşil |
| `.ds-badge-danger` | Kırmızı |

### 5.7 Diğer

| Sınıf | Kullanım |
|---|---|
| `.ds-alert` / `.ds-alert-error` / `.ds-alert-success` | Banner mesajları |
| `.ds-avatar` | Gradyan dairesel avatar |
| `.ds-progress-steps` | Fikir durum zaman çizelgesi |
| `.ds-toggle` | Profil bildirim ayarları |
| `.msg-bubble-me` / `.msg-bubble-other` | Mesajlaşma balonları |

### 5.8 İkonografi

`Icon.jsx` özel inline SVG seti sağlar; harici ikon kütüphanesi yok.

Desteklenen ikonlar: `sparkles`, `plus`, `dashboard`, `comment`, `user`, `chevronRight`, `heart`, `edit`, `trash`, `send` ve diğerleri.

İkonlar `currentColor` ile boyanır; nav ve butonlarda 16–20px boyut kullanılır.

---

## 6. Düzen (Layout) Kuralları

### Sayfa iskeleti

| Sınıf | Max-width | Kullanım |
|---|---|---|
| `.ds-page` | — | Tam sayfa; üst/alt padding |
| `.ds-container` | 980px | Ana içerik (dashboard, detay) |
| `.ds-container-narrow` | 480px | Auth formları |

### Stack / Row

| Sınıf | Gap |
|---|---|
| `.ds-stack-sm` | `--space-3` |
| `.ds-stack` | `--space-4` |
| `.ds-stack-lg` | `--space-6` |
| `.ds-row` / `.ds-row-between` | `--space-3` |

### Z-index katmanları

| Token | Değer | Öğe |
|---|---|---|
| `--z-header` | 30 | Sticky header |
| `--z-fab` | 40 | Floating action button |
| `--z-modal` | 50 | Modal (rezerve) |

---

## 7. Ekran Tasarım Prensipleri

### 7.1 Auth ekranları (Login, SignUp, Forgot)

- Ortalanmış `.ds-container-narrow` + `.ds-card-auth`
- Üstte `SocratixLogo` ve gradyan marka adı
- Minimal alan sayısı; birincil CTA `.ds-btn-primary` tam genişlik
- Hata durumları `.ds-alert-error` ile form üstünde

### 7.2 Dashboard (Ana akış)

- Hoş geldin başlığı + sağ üstte "Fikir Ekle" birincil buton
- Pill tab filtreler: Tümü / Departmanım / Popüler / Yeni
- Kart listesi `.ds-stack` ile dikey; her kart `IdeaFeedCard`
- Boş durum: emoji + yönlendirici link
- Mobil: nav etiket metinleri gizlenir, yalnızca ikon kalır (`max-width: 540px`)

### 7.3 Fikir oluşturma (Create Idea)

- Tam genişlik form: başlık input + açıklama textarea
- Kategori seçimi `Select` bileşeni
- AI Improve ayrı aksiyon; sonuçlar `AiSuggestionsSection` panelinde
- Kabul/Reddet butonları her öneri kartında
- "Devam" → fikir kaydı + AI Review ekranına yönlendirme

### 7.4 AI Review (`/devil/:id`)

- AI tarafından üretilen 3 soru kart halinde
- Her soru için textarea yanıt alanı
- "Atla" seçeneği — graceful degradation (AI başarısız olsa da akış devam eder)
- Tamamlandığında fikir `submitted` olur

### 7.5 Fikir detayı

- Başlık, açıklama, yazar meta satırı
- Durum badge'leri: Draft / Submitted / AI Reviewed
- AI Analysis paneli (riskler, öneriler, uygulanabilirlik skoru 1–10)
- Yorum listesi + yorum ekleme alanı
- Oy toggle butonu

### 7.6 Mesajlaşma

- Sol: kullanıcı listesi; sağ: konuşma
- Balonlar: `.msg-bubble-me` (gradyan, sağa hizalı) / `.msg-bubble-other` (cam, sola hizalı)

### 7.7 Profil

- Avatar yükleme (`ProfileAvatar` + dosya input)
- Toggle satırları bildirim tercihleri için
- Çıkış aksiyonu

---

## 8. Kullanıcı Deneyimi Kararları

### 8.1 AI entegrasyonu UX'i

| Karar | Gerekçe |
|---|---|
| AI çağrısı kullanıcı tetiklemeli ("AI Improve" butonu) | Otomatik debounce yerine bilinçli aksiyon; gereksiz API maliyeti önlenir |
| Önerileri tek tek Kabul/Reddet | Kullanıcı kontrolü; hangi AI önerisinin uygulandığı izlenebilir |
| AI Review zorunlu değil (atlanabilir) | Sürtünmeyi azaltır; AI servisi kapalıyken bile yayın mümkün |
| UI'da "AI Analysis" etiketi | İç route adı `devil-advocate` olsa da kullanıcıya nötr/olumlu dil |
| Fallback mesajları | API anahtarı yokken uygulama kırılmaz; yapılandırma yönlendirmesi gösterilir |

### 8.2 Gizlilik ve güven

| Karar | Gerekçe |
|---|---|
| Taslak fikirler yalnızca sahibine görünür | Erken fikirleri koruma; sunucu tarafı 403 kuralı |
| JWT ile korumalı tüm hassas endpoint'ler | Oturum yönetimi standart Bearer token |
| Avatar yerel `/uploads` | MVP hızı; harici depolama bağımlılığı yok |

### 8.3 Günlük kullanım (habit loop)

| Karar | Gerekçe |
|---|---|
| Feed'de tek tıkla oy toggle | Düşük sürtünme; optimistic UI store katmanında |
| Dashboard filtre sekmeleri | Hızlı keşif: departman, popülerlik, yenilik |
| Toast bildirimleri (2.6s) | Aksiyon geri bildirimi; engelleyici modal değil |
| FAB / header'da "Fikir Ekle" | Fikir girişi her ekrandan erişilebilir |

### 8.4 Erişilebilirlik ve i18n

| Karar | Gerekçe |
|---|---|
| `role="tablist"` / `aria-selected` filtre sekmelerinde | Klavye ve ekran okuyucu desteği temeli |
| `focus-visible` glow halkası butonlarda | Klavye navigasyonu görünür |
| EN / TR dil desteği | Kurumsal Türkiye bağlamı; `localStorage` ile kalıcılık |
| `color-scheme: dark` | Tarayıcı native UI uyumu |

### 8.5 Responsive

| Breakpoint | Davranış |
|---|---|
| `max-width: 480px` | H1 boyutu küçülür |
| `max-width: 540px` | Nav metin etiketleri gizlenir |
| `min-width: 640px` | Sayfa yatay padding artar |

---

## 9. Ekran Envanteri

| Route | Sayfa | Shell |
|---|---|---|
| `/login` | LoginPage | Auth kartı (AppShell yok) |
| `/signup` | SignUpPage | Auth kartı |
| `/forgot` | ForgotPasswordPage | Auth kartı |
| `/dashboard` | DashboardPage | AppShell |
| `/create` | CreateIdeaPage | AppShell |
| `/devil/:ideaId` | DevilsAdvocatePage | AppShell |
| `/ideas/:ideaId` | IdeaDetailPage | AppShell |
| `/ideas/:ideaId/edit` | EditIdeaPage | AppShell |
| `/messages` | MessagesPage | AppShell |
| `/profile` | ProfilePage | AppShell |

Referans ekran görüntüleri: `screenshots/` klasörü (login, signup, dashboard, create-idea, idea-detail, messages, profile).

---

## 10. Yeni Bileşen Ekleme Kuralları

1. **Renk/spacing** için yeni hard-coded hex yerine `tokens.css` değişkenlerini kullan
2. **Genel UI** için önce `.ds-*` CSS sınıfının var olup olmadığını kontrol et; yoksa `design-system.css`'e ekle
3. **React wrapper** gerekiyorsa `components/ds/` altına koy
4. **Domain-specific** kartlar `components/{alan}/` altında kalsın
5. Metinler `en.json` / `tr.json` üzerinden `t()` ile çevrilsin
6. Animasyonlar `--transition-*` token'larını kullansın; aşırı hareketten kaçın

---

## 11. PRD ile Farklar (bilinçli MVP kararları)

| PRD hedefi | MVP gerçekliği |
|---|---|
| Beyaz arka planlı login | Koyu cam temalı auth kartı |
| SSO giriş | E-posta + şifre |
| 800ms debounce ile otomatik AI paneli | Manuel "AI Improve" butonu |
| Micro-interaction animasyonları (kapsamlı) | Sayfa giriş + kart hover; minimal set |
| Web push digest bildirimi | Profil'de toggle UI; backend digest yok |

Bu farklar tasarım borcu olarak `Progress.md` ve `Plan.md` ile uyumludur; sonraki sürümlerde kapatılabilir.
