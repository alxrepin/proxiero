<div align="center">

<img src="public/icon/128.png" width="72" alt="Логотип Proxiero" />

# Proxiero

**Переключение прокси в один клик для Chrome и Firefox**

Ведите список прокси-серверов, проверяйте их пинг, включайте нужный одним кликом —
и он останется включённым после перезапуска браузера.

[English version](README.md)

</div>

## Возможности

- **Список серверов** — HTTP, HTTPS, SOCKS4, SOCKS5, опционально логин/пароль.
- **Проверка пинга** — при открытии попапа все серверы пингуются, статус и задержка видны в списке.
- **Переживает перезапуск** — состояние хранится локально и заново применяется при старте браузера.
- **Умная вставка** — вставьте `socks5://user:pass@1.2.3.4:1080` в поле адреса, и строка сама разложится по полям.
- **Автосохранение черновика** — форма не теряет введённое, даже если попап закрылся при потере фокуса.
- **Локализация** — русский и английский, переключается в интерфейсе, по умолчанию — язык браузера.
- **Светлая и тёмная темы** — автоматически по системной настройке.
- **Лёгкий** — одна кодовая база (WXT + Svelte 5), ~90 КБ в распакованном виде, ноль рантайм-зависимостей.

## Установка

```bash
git clone https://github.com/alxrepin/proxiero.git
cd proxiero
npm install
npm run build            # Chrome  → .output/chrome-mv3/
npm run build:firefox    # Firefox → .output/firefox-mv2/
```

| Браузер | Как установить |
|---|---|
| **Chrome** | `chrome://extensions` → «Режим разработчика» → «Загрузить распакованное» → `.output/chrome-mv3` |
| **Firefox** | `about:debugging#/runtime/this-firefox` → «Загрузить временное дополнение» → любой файл из `.output/firefox-mv2` |
| **Zen Browser** | Та же сборка, что для Firefox. Для постоянной установки: `npm run zip:firefox`, в `about:config` выключить `xpinstall.signatures.required`, поставить zip через `about:addons` |

## Разработка

```bash
npm run dev            # Chrome с HMR
npm run dev:firefox    # Firefox
npm run dev:zen        # Zen Browser (путь к бинарнику — в web-ext.config.ts)
npm run lint           # Biome: линтер + форматер + сортировка импортов
npm run lint:fix       # то же с автоисправлением
npm run check          # svelte-check (типы)
npm run icons          # перегенерация иконок (PNG-генератор без зависимостей)
```

## Как это устроено

Попап не трогает API прокси. Он пишет состояние в `storage.local`; фоновый скрипт
ловит `storage.onChanged` и применяет его:

| | Chrome | Firefox / Zen |
|---|---|---|
| Маршрутизация | `chrome.proxy.settings` (`fixed_servers`) | `proxy.onRequest` — решение на каждый запрос, не требует доступа к приватным окнам |
| Авторизация | `webRequest.onAuthRequired` (`asyncBlocking`) | то же, `blocking`; для SOCKS5 логин/пароль идут прямо в `proxyInfo` |
| Локальный трафик | `bypassList` | проверка hostname в обработчике |
| Перезапуск | `runtime.onStartup` заново применяет сохранённое состояние | так же |

### Структура проекта

```
entrypoints/
  background/            # фон, разбит по ответственности
    index.ts             #   оркестрация: события браузера → applyAll()
    context.ts           #   состояние из storage + подписка на изменения
    routing.ts           #   Firefox onRequest / Chrome settings
    auth.ts              #   авторизация на прокси (onAuthRequired)
    icon.ts              #   динамическая иконка (зелёная/серая)
  popup/
    App.svelte           # тонкий корень: выбор вида + автосохранение черновика
components/              # UI-компоненты (без <style> — стили в assets/styles)
stores/                  # реактивное состояние на рунах Svelte 5
  app.svelte.ts          #   прокси / активный / включено + действия
  form.svelte.ts         #   поля формы, черновик, редактирование
  pings.svelte.ts        #   статусы пинга
utils/                   # чистые модули: типы, storage, пинг, парсинг, i18n
assets/styles/           # токены (темы), база, стили компонентов, шрифты
locales/                 # словари интерфейса (en, ru)
scripts/gen-icons.mjs    # генератор PNG-иконок без зависимостей
```

## Ограничения

- Пока прокси активен, пинг остальных серверов идёт через него.
- В Chrome управление прокси может перехватить другое расширение с более высоким приоритетом (например, VPN).
- Пароли хранятся в `storage.local` в открытом виде — как и в большинстве подобных расширений.

## Шрифт

Интерфейс рассчитан на **TT Interphases Pro** (коммерческий, TypeType) с фоллбеком на системный
шрифт. Файлы шрифта в репозиторий не входят: установите шрифт в систему либо положите
`TTInterphasesPro-{Regular,Medium,DemiBold,Bold}.woff2` в `public/fonts/`
(см. `assets/styles/font.css`).

## Участие

Issues и пулл-реквесты приветствуются — см. [CONTRIBUTING.md](CONTRIBUTING.md).

## Лицензия

[MIT](LICENSE) © Alexander Repin
