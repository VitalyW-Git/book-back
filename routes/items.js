var express = require('express');
var router = express.Router();

// Хранение состояния в памяти
let selectedItems = new Set(); // Set выбранных ID
let selectedOrder = []; // Порядок выбранных элементов
let allItems = new Map(); // Map для хранения всех элементов (ID -> {id, ...})
let nextId = 1000001; // Следующий ID для новых элементов

const MAX_ID = 1000000;

// Функция для получения элемента
function getItem(id) {
  return allItems.get(id);
}

// Инициализация: создаем 1 000 000 элементов
// Создаем элементы синхронно при загрузке модуля
console.log('Инициализация элементов...');
for (let i = 1; i <= MAX_ID; i++) {
  allItems.set(i, { id: i });
}
console.log('Инициализация завершена');
// selectedOrder изначально пустой - заполняется при выборе элементов

// Очередь запросов с дедупликацией
const requestQueue = {
  add: new Map(),
  get: new Map(),
  update: new Map(),
};

let addBatchTimer = null;
let getBatchTimer = null;
let updateBatchTimer = null;

// Батчинг добавления (раз в 10 секунд)
function processAddBatch() {
  if (requestQueue.add.size === 0) {
    addBatchTimer = null;
    return;
  }

  const itemsToAdd = Array.from(requestQueue.add.values());
  requestQueue.add.clear();

    itemsToAdd.forEach(item => {
      if (!allItems.has(item.id)) {
        allItems.set(item.id, item);
        if (item.id >= nextId) {
          nextId = item.id + 1;
        }
      }
    });

  addBatchTimer = setTimeout(processAddBatch, 10000);
}

// Батчинг получения (раз в секунду)
function processGetBatch() {
  if (requestQueue.get.size === 0) {
    getBatchTimer = null;
    return;
  }

  requestQueue.get.clear();
  getBatchTimer = setTimeout(processGetBatch, 1000);
}

// Батчинг обновления (раз в секунду)
function processUpdateBatch() {
  if (requestQueue.update.size === 0) {
    updateBatchTimer = null;
    return;
  }

  const updates = Array.from(requestQueue.update.values());
  requestQueue.update.clear();

  updates.forEach(update => {
    if (update.type === 'select') {
      selectedItems.add(update.id);
      if (!selectedOrder.includes(update.id)) {
        selectedOrder.push(update.id);
      }
    } else if (update.type === 'deselect') {
      selectedItems.delete(update.id);
      selectedOrder = selectedOrder.filter(id => id !== update.id);
    } else if (update.type === 'reorder') {
      selectedOrder = update.order;
    }
  });

  updateBatchTimer = setTimeout(processUpdateBatch, 1000);
}

// GET /api/items - получение элементов с пагинацией и фильтрацией
router.get('/', function(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filterId = req.query.filterId ? parseInt(req.query.filterId) : null;
    const excludeSelected = req.query.excludeSelected === 'true';

    // Получаем все элементы из Map
    let items = Array.from(allItems.values());

    // Фильтрация по ID
    if (filterId) {
      items = items.filter(item => item.id.toString().includes(filterId.toString()));
    }

    // Исключение выбранных элементов
    if (excludeSelected) {
      items = items.filter(item => !selectedItems.has(item.id));
    }

    // Сортировка по ID
    items.sort((a, b) => a.id - b.id);

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = items.slice(start, end);

    // Добавляем в очередь получения для статистики (батчинг раз в секунду)
    const queueKey = `${page}-${limit}-${filterId}-${excludeSelected}`;
    if (!requestQueue.get.has(queueKey)) {
      requestQueue.get.set(queueKey, { page, limit, filterId, excludeSelected });
      if (!getBatchTimer) {
        getBatchTimer = setTimeout(processGetBatch, 1000);
      }
    }

    // Возвращаем результат сразу (GET запросы не батчатся)
    res.json({
      items: paginatedItems,
      total: items.length,
      page,
      limit,
      hasMore: end < items.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/items/selected - получение выбранных элементов
router.get('/selected', function(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filterId = req.query.filterId ? parseInt(req.query.filterId) : null;

    // Получаем только выбранные элементы в порядке сортировки
    let items = selectedOrder
      .filter(id => selectedItems.has(id))
      .map(id => allItems.get(id))
      .filter(item => item !== undefined);

    // Фильтрация по ID
    if (filterId) {
      items = items.filter(item => item.id.toString().includes(filterId.toString()));
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = items.slice(start, end);

    // Добавляем в очередь получения для статистики (батчинг раз в секунду)
    const queueKey = `selected-${page}-${limit}-${filterId}`;
    if (!requestQueue.get.has(queueKey)) {
      requestQueue.get.set(queueKey, { page, limit, filterId, selected: true });
      if (!getBatchTimer) {
        getBatchTimer = setTimeout(processGetBatch, 1000);
      }
    }

    // Возвращаем результат сразу (GET запросы не батчатся)
    res.json({
      items: paginatedItems,
      total: items.length,
      page,
      limit,
      hasMore: end < items.length,
      order: selectedOrder
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/items - добавление нового элемента
router.post('/', function(req, res, next) {
  try {
    const { id } = req.body;

    if (!id || typeof id !== 'number') {
      return res.status(400).json({ error: 'ID is required and must be a number' });
    }

    // Дедупликация: проверяем, не добавлен ли уже этот ID
    const queueKey = `add-${id}`;
    if (requestQueue.add.has(queueKey)) {
      return res.json({ message: 'Item already in queue', id });
    }

    // Проверяем, существует ли элемент с таким ID (в диапазоне 1..MAX_ID или уже создан)
    if (id <= MAX_ID || allItems.has(id)) {
      return res.status(400).json({ error: 'Item with this ID already exists' });
    }

    const newItem = { id };
    requestQueue.add.set(queueKey, newItem);

    // Запускаем батчинг, если еще не запущен
    if (!addBatchTimer) {
      addBatchTimer = setTimeout(processAddBatch, 10000);
    }

    res.json({ message: 'Item queued for addition', id });
  } catch (error) {
    next(error);
  }
});

// PUT /api/items/selected - обновление выбранных элементов
router.put('/selected', function(req, res, next) {
  try {
    const { action, id, order } = req.body;

    if (action === 'select' || action === 'deselect') {
      if (!id || typeof id !== 'number') {
        return res.status(400).json({ error: 'ID is required for select/deselect' });
      }

      const queueKey = `${action}-${id}`;
      if (!requestQueue.update.has(queueKey)) {
        requestQueue.update.set(queueKey, { type: action, id });
        if (!updateBatchTimer) {
          updateBatchTimer = setTimeout(processUpdateBatch, 1000);
        }
      }

      // Применяем изменения сразу для отклика
      if (action === 'select') {
        selectedItems.add(id);
        if (!selectedOrder.includes(id)) {
          selectedOrder.push(id);
        }
      } else {
        selectedItems.delete(id);
        selectedOrder = selectedOrder.filter(itemId => itemId !== id);
      }

      res.json({ message: `Item ${action}ed`, id });
    } else if (action === 'reorder') {
      if (!Array.isArray(order)) {
        return res.status(400).json({ error: 'Order must be an array' });
      }

      const queueKey = 'reorder';
      requestQueue.update.set(queueKey, { type: 'reorder', order });
      if (!updateBatchTimer) {
        updateBatchTimer = setTimeout(processUpdateBatch, 1000);
      }

      // Применяем изменения сразу
      selectedOrder = order.filter(id => selectedItems.has(id));

      res.json({ message: 'Order updated', order: selectedOrder });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/items/state - получение полного состояния (для восстановления)
router.get('/state', function(req, res, next) {
  try {
    res.json({
      selectedItems: Array.from(selectedItems),
      selectedOrder: selectedOrder
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

