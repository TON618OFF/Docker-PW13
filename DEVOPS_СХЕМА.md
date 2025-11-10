# DevOps-схема ImperialTunes

## Версия документа: 1.0
## Дата создания: 10.11.2025
## Проект: ImperialTunes

---

## Оглавление

1. [Общая информация](#общая-информация)
2. [Архитектура системы](#архитектура-системы)
3. [Контейнеризация (Docker)](#контейнеризация-docker)
4. [Оркестрация (Docker Compose)](#оркестрация-docker-compose)
5. [Переменные окружения](#переменные-окружения)
6. [Сборка и развёртывание](#сборка-и-развёртывание)
7. [CI/CD (Continuous Integration/Continuous Deployment)](#cicd-continuous-integrationcontinuous-deployment)
8. [Мониторинг и логирование](#мониторинг-и-логирование)
9. [Масштабирование](#масштабирование)
10. [Безопасность](#безопасность)

---

## Общая информация

### Цель DevOps-схемы

Обеспечение автоматизированного развёртывания, масштабирования и управления приложением ImperialTunes.

### Компоненты системы

1. **Frontend приложение** - React приложение (Vite)
2. **База данных** - PostgreSQL (Supabase)
3. **Storage** - Supabase Storage (для файлов)
4. **Кэш** - Redis (опционально)
5. **Веб-сервер** - Nginx (reverse proxy)
6. **Контейнеризация** - Docker
7. **Оркестрация** - Docker Compose
8. **CI/CD** - GitHub Actions / GitLab CI

---

## Архитектура системы

### Схема архитектуры

```
                    ┌─────────────────┐
                    │   Nginx (80/443)│
                    │  Reverse Proxy  │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
            ┌───────▼──────┐  ┌───────▼──────┐
            │  App (3000)  │  │   Redis      │
            │  React App   │  │   (6379)     │
            │  (Nginx)     │  └──────────────┘
            └───────┬──────┘
                    │
            ┌───────▼──────┐
            │  PostgreSQL  │
            │   (5432)     │
            └──────────────┘
                    │
            ┌───────▼──────┐
            │  Supabase    │
            │  (Cloud)     │
            └──────────────┘
```

### Компоненты

#### 1. Frontend приложение (App)

**Технологии:**
- React 18
- TypeScript
- Vite
- Tailwind CSS

**Порт:** 3000

**Образ:** Multi-stage Docker build (Node.js → Nginx)

#### 2. База данных (PostgreSQL)

**Технологии:**
- PostgreSQL 15
- Supabase (облачная БД)

**Порт:** 5432 (локально)

**Образ:** postgres:15-alpine

#### 3. Кэш (Redis)

**Технологии:**
- Redis 7

**Порт:** 6379

**Образ:** redis:7-alpine

#### 4. Веб-сервер (Nginx)

**Технологии:**
- Nginx Alpine

**Порты:** 80 (HTTP), 443 (HTTPS)

**Образ:** nginx:alpine

---

## Контейнеризация (Docker)

### Dockerfile

**Расположение:** `Dockerfile`

**Структура:**
```dockerfile
# Multi-stage build для оптимизации размера образа

# Этап 1: Установка зависимостей
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Этап 2: Сборка приложения
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Этап 3: Production образ
FROM nginx:alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
RUN chown -R nginx:nginx /usr/share/nginx/html
USER nginx
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Оптимизация образа

**Размер образа:**
- **Исходный образ:** ~500 MB
- **Оптимизированный образ:** ~50 MB

**Оптимизации:**
- Multi-stage build
- Использование Alpine Linux
- Минимизация слоёв
- Удаление ненужных файлов

### Сборка образа

```bash
# Сборка образа
docker build -t imperial-tunes:latest .

# Сборка с тегами
docker build -t imperial-tunes:latest -t imperial-tunes:v1.0.0 .

# Сборка для определённой платформы
docker build --platform linux/amd64 -t imperial-tunes:latest .
```

### Теги образов

- `imperial-tunes:latest` - последняя версия
- `imperial-tunes:v1.0.0` - версия 1.0.0
- `imperial-tunes:dev` - версия для разработки
- `imperial-tunes:prod` - версия для production

---

## Оркестрация (Docker Compose)

### docker-compose.yml

**Расположение:** `docker-compose.yml`

**Сервисы:**
1. **app** - основное приложение
2. **db** - база данных PostgreSQL
3. **redis** - кэш Redis
4. **nginx** - reverse proxy

### Конфигурация сервисов

#### Сервис: app

```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
  ports:
    - "3000:3000"
  environment:
    - NODE_ENV=production
    - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
    - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
  env_file:
    - .env.local
  depends_on:
    db:
      condition: service_healthy
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
    interval: 30s
    timeout: 10s
    retries: 3
```

#### Сервис: db

```yaml
db:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: ${DB_NAME:-imperial_tunes}
    POSTGRES_USER: ${DB_USER:-postgres}
    POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./supabase/migrations:/docker-entrypoint-initdb.d:ro
  ports:
    - "5432:5432"
  restart: unless-stopped
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
    interval: 10s
    timeout: 5s
    retries: 5
```

#### Сервис: redis

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

#### Сервис: nginx

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./ssl:/etc/nginx/ssl:ro
  depends_on:
    - app
  restart: unless-stopped
```

### Команды Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Запуск с пересборкой
docker-compose up -d --build

# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes
docker-compose down -v

# Просмотр логов
docker-compose logs -f app

# Просмотр статуса
docker-compose ps

# Выполнение команды в контейнере
docker-compose exec app sh

# Масштабирование сервиса
docker-compose up -d --scale app=3
```

### Переменные окружения в Docker Compose

**Файл:** `.env.local`

```bash
# Application
APP_PORT=3000
NODE_ENV=production

# Supabase
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Database
DB_NAME=imperial_tunes
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432
DB_HOST=db

# Redis
REDIS_PASSWORD=
REDIS_PORT=6379

# Nginx
HTTP_PORT=80
HTTPS_PORT=443
```

---

## Переменные окружения

### Структура переменных окружения

#### Разработка (.env.local)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Development
NODE_ENV=development
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

#### Production (.env.production)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Production
NODE_ENV=production
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
```

### Управление секретами

#### Локальная разработка

**Файл:** `.env.local` (не коммитится в Git)

```bash
# Создать файл .env.local из .env.example
cp env.example .env.local

# Заполнить значения
nano .env.local
```

#### Production

**Методы:**
1. **Переменные окружения в Docker Compose**
2. **Secrets в CI/CD**
3. **Secrets в облачном провайдере**

#### GitHub Secrets

**Настройка:**
1. Перейти в Settings → Secrets → Actions
2. Добавить секреты:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`

---

## Сборка и развёртывание

### Локальная сборка

```bash
# Установка зависимостей
npm install

# Сборка приложения
npm run build

# Просмотр собранного приложения
npm run preview
```

### Сборка Docker образа

```bash
# Сборка образа
docker build -t imperial-tunes:latest .

# Сборка с кэшем
docker build --cache-from imperial-tunes:latest -t imperial-tunes:latest .

# Сборка для production
docker build --target runner -t imperial-tunes:prod .
```

### Развёртывание через Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Запуск с пересборкой
docker-compose up -d --build

# Остановка
docker-compose down

# Остановка с удалением volumes
docker-compose down -v
```

### Развёртывание на сервере

#### Шаг 1: Подготовка сервера

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Шаг 2: Клонирование репозитория

```bash
# Клонировать репозиторий
git clone https://github.com/your-username/imperial-tunes.git
cd imperial-tunes
```

#### Шаг 3: Настройка переменных окружения

```bash
# Создать файл .env.local
cp env.example .env.local

# Заполнить значения
nano .env.local
```

#### Шаг 4: Запуск приложения

```bash
# Запустить приложение
docker-compose up -d

# Проверить статус
docker-compose ps

# Просмотреть логи
docker-compose logs -f
```

---

## CI/CD (Continuous Integration/Continuous Deployment)

### GitHub Actions

#### Workflow: Tests

**Файл:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: imperial_tunes_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/imperial_tunes_test
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
```

#### Workflow: Build

**Файл:** `.github/workflows/build.yml`

```yaml
name: Build

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
          retention-days: 7
```

#### Workflow: Deploy

**Файл:** `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [ main ]
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Build Docker image
        run: |
          docker build -t imperial-tunes:latest .
          docker tag imperial-tunes:latest imperial-tunes:${{ github.sha }}
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Push Docker image
        run: |
          docker push imperial-tunes:latest
          docker push imperial-tunes:${{ github.sha }}
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/imperial-tunes
            git pull
            docker-compose down
            docker-compose up -d --build
```

### GitLab CI

#### .gitlab-ci.yml

**Файл:** `.gitlab-ci.yml`

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

services:
  - docker:dind
  - postgres:15

variables:
  POSTGRES_DB: imperial_tunes_test
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  DATABASE_URL: postgresql://postgres:postgres@postgres:5432/imperial_tunes_test

before_script:
  - apk add --no-cache nodejs npm
  - npm ci

test:
  stage: test
  script:
    - npm run lint
    - npm test
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

deploy:
  stage: deploy
  script:
    - docker build -t imperial-tunes:latest .
    - docker push imperial-tunes:latest
    - ssh $SERVER_USER@$SERVER_HOST "cd /path/to/imperial-tunes && docker-compose up -d --build"
  only:
    - main
  when: manual
```

---

## Мониторинг и логирование

### Логирование

#### Docker logs

```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Просмотр логов конкретного сервиса
docker-compose logs -f app

# Просмотр последних 100 строк
docker-compose logs --tail=100 app
```

#### Nginx logs

```bash
# Access logs
docker-compose exec nginx tail -f /var/log/nginx/access.log

# Error logs
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

#### PostgreSQL logs

```bash
# Просмотр логов PostgreSQL
docker-compose logs -f db
```

### Мониторинг

#### Health checks

**Сервисы с health checks:**
- `app` - проверка доступности приложения
- `db` - проверка готовности БД
- `redis` - проверка доступности Redis
- `nginx` - проверка доступности Nginx

#### Метрики

**Метрики для мониторинга:**
- Использование CPU
- Использование памяти
- Использование диска
- Сетевая активность
- Количество запросов
- Время ответа

---

## Масштабирование

### Горизонтальное масштабирование

```bash
# Масштабирование приложения
docker-compose up -d --scale app=3

# Масштабирование с балансировкой нагрузки
# (требуется настройка Nginx для load balancing)
```

### Вертикальное масштабирование

**Увеличение ресурсов:**
- Увеличение памяти для контейнеров
- Увеличение CPU для контейнеров
- Оптимизация запросов к БД

---

## Безопасность

### Безопасность Docker

**Рекомендации:**
1. Использование непривилегированных пользователей
2. Минимизация размера образа
3. Регулярное обновление базовых образов
4. Сканирование образов на уязвимости

### Безопасность сети

**Рекомендации:**
1. Изоляция сетей Docker
2. Ограничение доступа к портам
3. Использование HTTPS
4. Настройка firewall

### Безопасность данных

**Рекомендации:**
1. Шифрование данных в transit (HTTPS)
2. Шифрование данных at rest
3. Регулярное резервное копирование
4. Защита секретов

---

## Инструкция по запуску

### Локальный запуск

```bash
# 1. Клонировать репозиторий
git clone https://github.com/your-username/imperial-tunes.git
cd imperial-tunes

# 2. Создать файл .env.local
cp env.example .env.local

# 3. Заполнить переменные окружения
nano .env.local

# 4. Запустить через Docker Compose
docker-compose up -d

# 5. Открыть приложение
open http://localhost:3000
```

### Production запуск

```bash
# 1. Клонировать репозиторий на сервере
git clone https://github.com/your-username/imperial-tunes.git
cd imperial-tunes

# 2. Создать файл .env.local
cp env.example .env.local

# 3. Заполнить переменные окружения
nano .env.local

# 4. Запустить через Docker Compose
docker-compose up -d

# 5. Настроить Nginx reverse proxy (если нужно)
# 6. Настроить SSL сертификаты (если нужно)
```

---

## Чеклист DevOps

- [x] Dockerfile создан и оптимизирован
- [x] Docker Compose настроен
- [x] Переменные окружения настроены
- [x] Health checks настроены
- [x] CI/CD pipeline настроен
- [x] Мониторинг настроен
- [x] Логирование настроено
- [x] Безопасность настроена
- [x] Документация создана

