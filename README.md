### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

## Building for Production

Create a production build:

```bash
npm run build
```

Краткое описание.
1. Добавление через очередь с дедупликацией и гарантией что одно и то-же значение не будет добавлено повторно.
2. Батчинг добавления элементов раз в 10 сек, получения и изменения данных раз в секунду.

Результат можно посмотреть ``http://150.241.76.108``.