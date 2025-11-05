#!/usr/bin/env node

/**
 * Скрипт для загрузки бэкапов в облачное хранилище
 * Поддерживает: AWS S3, Google Drive (через rclone), общий S3-совместимый API
 * 
 * Использование:
 *   node scripts/upload-to-cloud.js <backup_directory_or_archive>
 * 
 * Требуемые переменные окружения (в зависимости от провайдера):
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET - для AWS S3
 *   RCLONE_CONFIG - для rclone (Google Drive, Dropbox и т.д.)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const backupPath = process.argv[2];

if (!backupPath) {
  console.error('❌ Ошибка: Не указан путь к бэкапу');
  console.error('📖 Использование: node scripts/upload-to-cloud.js <backup_path>');
  process.exit(1);
}

/**
 * Загрузка в AWS S3
 */
async function uploadToS3(backupPath) {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!bucket || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('⚠️  AWS credentials не настроены, пропускаем S3');
    return false;
  }

  console.log(`\n📤 Загрузка в AWS S3: s3://${bucket}...`);

  const fileName = path.basename(backupPath);
  const s3Path = `s3://${bucket}/imperial-tunes-backups/${fileName}`;

  return new Promise((resolve) => {
    const command = `aws s3 cp "${backupPath}" "${s3Path}" --region ${region}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Ошибка загрузки в S3:', error.message);
        resolve(false);
      } else {
        console.log(`✅ Загружено в S3: ${s3Path}`);
        resolve(true);
      }
    });
  });
}

/**
 * Загрузка через rclone (Google Drive, Dropbox, OneDrive и т.д.)
 */
async function uploadViaRclone(backupPath) {
  if (!process.env.RCLONE_REMOTE) {
    console.log('⚠️  RCLONE_REMOTE не настроен, пропускаем rclone');
    return false;
  }

  console.log(`\n📤 Загрузка через rclone в ${process.env.RCLONE_REMOTE}...`);

  const fileName = path.basename(backupPath);
  const remotePath = `${process.env.RCLONE_REMOTE}:imperial-tunes-backups/${fileName}`;

  return new Promise((resolve) => {
    const command = `rclone copy "${backupPath}" "${remotePath}" --progress`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Ошибка загрузки через rclone:', error.message);
        console.error('   Убедитесь, что rclone установлен и настроен');
        resolve(false);
      } else {
        console.log(`✅ Загружено через rclone: ${remotePath}`);
        resolve(true);
      }
    });
  });
}

/**
 * Главная функция
 */
async function main() {
  console.log('☁️  Загрузка бэкапа в облачное хранилище...');
  console.log(`📁 Файл: ${backupPath}\n`);

  // Проверка существования файла/директории
  try {
    await fs.access(backupPath);
  } catch (error) {
    console.error(`❌ Ошибка: Путь не найден: ${backupPath}`);
    process.exit(1);
  }

  const results = {
    s3: false,
    rclone: false
  };

  // Пробуем загрузить в S3
  results.s3 = await uploadToS3(backupPath);

  // Пробуем загрузить через rclone
  results.rclone = await uploadViaRclone(backupPath);

  if (!results.s3 && !results.rclone) {
    console.log('\n⚠️  Не удалось загрузить ни в одно облачное хранилище');
    console.log('   Настройте переменные окружения для AWS S3 или rclone');
    process.exit(1);
  }

  console.log('\n✅ Загрузка завершена!');
}

main();

