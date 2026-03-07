# twitter-bot-v2

PRD tabanli, coklu kampanya ve coklu hesap destekli bir Twitter botu.

## Hedef

- 15 urunu tek codebase icinde yonetmek
- 3 Twitter hesabina kategori bazli dagitim yapmak
- GitHub Actions uzerinden saatlik calistirmak
- Gemini ile farkli tonlarda tweet uretmek
- Gorsel zorunlulugu ve duplicate guard uygulamak

## Mevcut Durum

Proje su anda Faz 1 asamasinda. Temel domain modelleri, hesap yapisi ve moduler katalog dosyalari hazir. Bot orkestrasyonu, state yonetimi, icerik motoru, yayin katmani ve workflow henuz tamamlanmadi.

## Kurulum

```bash
npm install
```

Ortam degiskenleri icin:

```bash
cp .env.example .env
```

Bu asamada butun secret'larin dolu olmasi zorunlu degil. Gelistirme sirasinda ilgili faz geldikce tamamlanir.

## Kullanilabilir Komutlar

```bash
npm run start
npm run check
npm run import:excel -- ./path/to/catalog.xlsx
```

## Veri Yapisi

Katalog verisi tek dosya yerine moduler yapida tutulur:

```text
src/data/
├── accounts.ts
├── catalog.ts
├── products/
├── campaigns/
└── assets/
```

- `products/`: urun tanimlari
- `campaigns/`: kampanya detaylari
- `assets/`: kod, link ve referral asset tanimlari
- `catalog.ts`: geriye donuk tek giris noktasi

## Excel Import

`scripts/importFromExcel.ts`, tek seferlik katalog tasima ve guncelleme icin eklendi.

Beklenen workbook sayfalari:
- `products`
- `campaigns`
- `assets`

Beklenen kolonlar:

### `products`

- `id`
- `brand`
- `category`
- `color`
- `imagePath`
- `weight`
- `active`

### `campaigns`

- `productId`
- `bonus`
- `packageDetail`
- `priceHighlight`
- `textStrategy`
- `hashtags`
- `imagePath`
- `altText`
- `mediaRequired`

### `assets`

- `productId`
- `assetType`
- `code`
- `referralUrl`
- `urlTemplate`
- `status`
- `resetPolicy`
- `availabilityPolicy`
- `validFrom`
- `validUntil`

Ornek kullanim:

```bash
npm run import:excel -- ./catalog.xlsx
```

Script, `src/data/products/`, `src/data/campaigns/`, `src/data/assets/` altindaki dosyalari ve `src/data/catalog.ts` bridge dosyasini yeniden uretir.

## Dizin Ozeti

```text
src/
├── bot.ts
├── config/
├── data/
├── domain/
└── ...
scripts/
└── importFromExcel.ts
```

## Sonraki Adimlar

1. `history/` altinda state adapter yapisini eklemek
2. Icerik motorunu eklemek
3. Yayin katmani ve Actions workflow'unu tamamlamak
