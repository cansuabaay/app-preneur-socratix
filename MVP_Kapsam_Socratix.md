# MVP Kapsam Dokümani: Socratix — Kurum İçi AI Destekli İnovasyon Platformu

---

## 1. Proje Vizyonu ve Hedef

Çalışanların fikirlerini AI mentorluğu ile olgunlaştırdığı, demokratik bir oylama sistemiyle kurum kültürünü dönüştüren ve günlük etkileşimi teşvik eden bir inovasyon motoru oluşturmak.

---

## 2. Temel Kullanıcı Personası (Özet)

- Persona: 25-45 yaş, İstanbul, kurumsal çalışan.
- Temel Motivasyon: Takdir edilmek, etki yaratmak ve profesyonel gelişim.
- Engel: Zaman kısıtı ve kurumsal sessizlik.

---

## 3. Günlük Alışkanlık Döngüsü (The Hook Model)

Kullanıcının her gün girmesini sağlamak için şu döngüyü MVP'ye entegre ediyoruz:

1. Tetikleyici (Trigger): AI'dan gelen "Fikrine yeni bir yorum geldi" veya "Günün İnovasyon Özeti" bildirimi.
2. Eylem (Action): Uygulamaya giriş ve 30 saniyelik bir kaydırma (feed kontrolü).
3. Değişken Ödül (Reward): Kendi fikrinin aldığı oylar veya AI'nın sunduğu yeni bir içgörü.
4. Yatırım (Investment): Bir başkasının fikrine yorum yapma veya kendi fikrini güncelleme.

---

## 4. MVP Fonksiyonel Gereksinimler (Kritik 10 Özellik)

### A. Fikir Üretimi ve AI Mentorluk

- F1. Akıllı Fikir Girişi: Kullanıcı taslak girerken AI'nın gerçek zamanlı öneriler sunması (geliştirme önerisi, benzer fikir uyarısı).
- F2. AI "Şeytanın Avukatı": Fikir yayınlanmadan önce AI'nın kritik sorular sorarak fikri olgunlaştırması.
- F3. Durum Şeffaflığı: Fikrin hangi aşamada olduğunun (İnceleme, Oylama, Onay) görsel takibi.

### B. Sosyal Etkileşim ve Günlük Akış

- F4. İnovasyon Akışı (Daily Feed): Şirketteki en yeni ve en popüler fikirlerin kaydırılabilir listesi.
- F5. Hızlı Etkileşim (Oylama/Reaksiyon): Tek dokunuşla fikirleri destekleme veya kaydetme.
- F6. Günlük Smart Digest: AI tarafından hazırlanan, kullanıcının ilgi alanına giren 3 fikrin sabah bildirimi olarak gönderilmesi.

### C. Kurumsal Entegrasyon ve Güvenlik

- F7. SSO (Single Sign-On): Şirket hesabı ile şifresiz, hızlı giriş.
- F8. Fikir Sahipliği Mühürü: Her fikrin ilk giriş anından itibaren kullanıcıyla eşleşmesi (güvenlik).

### D. Takip ve Analiz

- F9. Kullanıcı Davranış Loglama (Tracking):
  - Hangi fikirlerin ne kadar süre okunduğu.
  - AI önerilerinin hangilerinin kabul edildiği / reddedildiği.
  - Formun hangi aşamasında yazmaktan vazgeçildiği (drop-off).
- F10. Isı Haritası ve Clickstream: Kullanıcının uygulama içindeki rotasının izlenmesi.

---

## 5. MVP Teknik Kısıtlar ve Seçimler

- Platform: iOS Native (Swift) — kurumsal çalışanların mobil cihaz kullanım alışkanlıkları ve premium kullanıcı deneyimi hedefi doğrultusunda.
- AI Modeli: Şirket verisini korumak adına Azure OpenAI (GPT-4o) birincil seçenek; air-gapped kurumlar için self-hosted Llama 3 yedek seçenek olarak planlanmaktadır.
- Loglama Altyapısı: Mixpanel veya Amplitude (davranış analizi) + Sentry (hata takibi).

---

## 6. Başarı Metrikleri (KPIs)

| Metrik | Açıklama | Hedef |
|---|---|---|
| DAU/MAU Oranı | Günlük aktif kullanıcının aylık aktif kullanıcıya oranı | %30+ |
| Fikir Dönüşüm Oranı | Taslak fikirlerin AI desteğiyle "Tamamlandı" statüsüne ulaşma oranı | %45+ |
| Ortalama Etkileşim Süresi | Kullanıcının günlük akışta geçirdiği ortalama süre | 4 dakika+ |
| AI Kabul Oranı | AI geliştirme önerilerinin kullanıcılar tarafından uygulanma oranı | %35+ |

---

## 7. Neden Bu Özellikleri Seçtik? (Ürün Geliştirici Notu)

Kullanıcının her gün girmesini istiyorsak, ona her gün yeni bir şey göstermeliyiz. Bu yüzden F6 (Günlük Özet) ve F4 (İnovasyon Akışı) MVP'nin merkezindedir. Eğer kullanıcı sadece kendi fikrini girip çıksaydı, uygulama ayda bir kullanılan bir forma dönüşürdü. Ancak başkalarının fikirlerini oylayıp AI analizlerini görmek, uygulamayı bir iş zekası sosyal medyasına dönüştürür.
