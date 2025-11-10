import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileText, Database, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CSVPreviewRow {
  [key: string]: string | number | null;
}

interface ImportResult {
  success: number;
  errors: number;
  messages: string[];
}

const DataImport = () => {
  const [importType, setImportType] = useState<"csv" | "sql">("csv");
  const [csvTable, setCsvTable] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreviewRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [sqlContent, setSqlContent] = useState<string>("");
  const [sqlPreview, setSqlPreview] = useState<string>("");
  const [sqlErrors, setSqlErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tables = [
    { value: "artists", label: "Artists" },
    { value: "genres", label: "Genres" },
    { value: "albums", label: "Albums" },
    { value: "tracks", label: "Tracks" },
    { value: "playlists", label: "Playlists" },
    { value: "users", label: "Users" },
  ];

  // Улучшенный парсер CSV с поддержкой кавычек и экранированных значений
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Экранированная кавычка
          current += '"';
          i += 2;
        } else {
          // Начало или конец значения в кавычках
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Разделитель вне кавычек
        values.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Добавляем последнее значение
    values.push(current.trim());

    return values;
  };

  const parseCSV = (text: string): { headers: string[]; rows: CSVPreviewRow[]; errors: string[] } => {
    const errors: string[] = [];
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      errors.push("CSV файл пуст");
      return { headers: [], rows: [], errors };
    }

    // Парсим заголовки
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.replace(/^"|"$/g, ""));
    
    if (headers.length === 0) {
      errors.push("Не найдены заголовки в CSV файле");
      return { headers: [], rows: [], errors };
    }

    // Парсим строки данных
    const rows: CSVPreviewRow[] = [];
    for (let i = 1; i < Math.min(lines.length, 11); i++) { // Показываем первые 10 строк для предпросмотра
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, ""));
      
      if (values.length !== headers.length) {
        errors.push(`Строка ${i + 1}: количество колонок не соответствует заголовкам (${values.length} вместо ${headers.length})`);
        continue;
      }

      const row: CSVPreviewRow = {};
      headers.forEach((header, index) => {
        const value = values[index] || null;
        // Преобразуем пустые строки в null
        row[header] = value === '' ? null : value;
      });
      rows.push(row);
    }

    return { headers, rows, errors };
  };

  const handleCSVFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Выберите CSV файл");
      return;
    }

    setCsvFile(file);
    setCsvPreview([]);
    setCsvHeaders([]);
    setCsvErrors([]);
    setImportResult(null);

    try {
      const text = await file.text();
      const { headers, rows, errors } = parseCSV(text);
      
      setCsvHeaders(headers);
      setCsvPreview(rows);
      setCsvErrors(errors);

      if (errors.length > 0) {
        toast.warning(`Найдено ${errors.length} ошибок в CSV файле`);
      } else {
        toast.success(`CSV файл загружен: ${headers.length} колонок, ${rows.length} строк для предпросмотра`);
      }
    } catch (error: any) {
      toast.error(`Ошибка чтения CSV файла: ${error.message}`);
    }
  };

  const handleSQLContentChange = (content: string) => {
    setSqlContent(content);
    setSqlPreview("");
    setSqlErrors([]);
    setImportResult(null);

    if (!content.trim()) {
      return;
    }

    // Простая проверка SQL
    const errors: string[] = [];
    const upperContent = content.toUpperCase();

    // Проверяем на опасные операции
    if (upperContent.includes("DROP DATABASE") || upperContent.includes("DROP TABLE")) {
      errors.push("Обнаружены команды DROP DATABASE или DROP TABLE. Импорт таких команд запрещен из соображений безопасности.");
    }

    if (upperContent.includes("TRUNCATE")) {
      errors.push("Обнаружена команда TRUNCATE. Импорт таких команд запрещен из соображений безопасности.");
    }

    // Показываем предпросмотр (первые 500 символов)
    const preview = content.substring(0, 500);
    setSqlPreview(preview + (content.length > 500 ? "..." : ""));

    setSqlErrors(errors);
  };

  const validateCSVData = async (): Promise<boolean> => {
    if (!csvTable || !csvFile) {
      toast.error("Выберите таблицу и CSV файл");
      return false;
    }

    if (csvErrors.length > 0) {
      toast.error("Исправьте ошибки в CSV файле перед импортом");
      return false;
    }

    // Дополнительная валидация в зависимости от таблицы
    const requiredFields: { [key: string]: string[] } = {
      artists: ["artist_name"],
      genres: ["genre_name"],
      albums: ["album_title", "artist_id"],
      tracks: ["track_title", "album_id", "track_duration"],
      playlists: ["playlist_title", "user_id"],
      users: ["username", "id"],
    };

    const required = requiredFields[csvTable];
    if (required) {
      const missingFields = required.filter(field => !csvHeaders.includes(field));
      if (missingFields.length > 0) {
        toast.error(`Отсутствуют обязательные поля: ${missingFields.join(", ")}`);
        return false;
      }
    }

    return true;
  };

  const importCSV = async () => {
    if (!(await validateCSVData())) {
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const text = await csvFile!.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error("CSV файл пуст");
      }

      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine).map(h => h.replace(/^"|"$/g, ""));
      
      const rows: CSVPreviewRow[] = [];
      const errors: string[] = [];
      let successCount = 0;
      let errorCount = 0;

      // Парсим все строки
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, ""));
        
        if (values.length !== headers.length) {
          errors.push(`Строка ${i + 1}: количество колонок не соответствует заголовкам (${values.length} вместо ${headers.length})`);
          errorCount++;
          continue;
        }

        const row: CSVPreviewRow = {};
        headers.forEach((header, index) => {
          const value = values[index] || null;
          
          // Преобразуем пустые строки в null
          if (value === '' || value === null) {
            row[header] = null;
          } else {
            // Пытаемся преобразовать в число, если это возможно
            const numValue = Number(value);
            if (!isNaN(numValue) && value.trim() !== "" && !value.includes(' ')) {
              row[header] = numValue;
            } else {
              row[header] = value;
            }
          }
        });
        rows.push(row);
      }

      // Импортируем данные батчами
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from(csvTable)
          .insert(batch);

        if (error) {
          errors.push(`Батч ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      setImportResult({
        success: successCount,
        errors: errorCount,
        messages: errors.slice(0, 10), // Показываем первые 10 ошибок
      });

      if (errorCount === 0) {
        toast.success(`Успешно импортировано ${successCount} записей`);
      } else {
        toast.warning(`Импортировано ${successCount} записей, ошибок: ${errorCount}`);
      }

      // Очищаем форму
      setCsvFile(null);
      setCsvPreview([]);
      setCsvHeaders([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast.error(`Ошибка импорта: ${error.message}`);
      setImportResult({
        success: 0,
        errors: 0,
        messages: [error.message],
      });
    } finally {
      setImporting(false);
    }
  };

  const importSQL = async () => {
    if (!sqlContent.trim()) {
      toast.error("Введите SQL скрипт");
      return;
    }

    if (sqlErrors.length > 0) {
      toast.error("Исправьте ошибки в SQL скрипте перед импортом");
      return;
    }

    // Подтверждение
    const confirmed = window.confirm(
      "Вы уверены, что хотите выполнить этот SQL скрипт? Это действие может изменить данные в базе данных."
    );

    if (!confirmed) {
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      // Разбиваем SQL на отдельные команды
      const commands = sqlContent
        .split(";")
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith("--") && !cmd.startsWith("/*"));

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Выполняем команды по очереди
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i].trim();
        if (!command) continue;
        
        try {
          // Проверяем, что это INSERT команда
          if (!command.toUpperCase().startsWith("INSERT INTO")) {
            errors.push(`Команда ${i + 1}: поддерживаются только INSERT команды. Пропущено.`);
            errorCount++;
            continue;
          }

          // Парсим INSERT команду
          // Поддерживаем формат: INSERT INTO table (col1, col2) VALUES (val1, val2)
          const insertMatch = command.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
          if (!insertMatch) {
            errors.push(`Команда ${i + 1}: не удалось распарсить INSERT команду. Проверьте синтаксис.`);
            errorCount++;
            continue;
          }

          const tableName = insertMatch[1].trim();
          const columnsStr = insertMatch[2];
          const valuesStr = insertMatch[3];

          // Парсим колонки
          const columns = columnsStr.split(",").map(c => c.trim());

          // Парсим значения (учитываем кавычки и NULL)
          const values: (string | null)[] = [];
          let currentValue = '';
          let inQuotes = false;
          let quoteChar = '';

          for (let j = 0; j < valuesStr.length; j++) {
            const char = valuesStr[j];
            const nextChar = valuesStr[j + 1];

            if ((char === "'" || char === '"') && !inQuotes) {
              inQuotes = true;
              quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
              if (nextChar === quoteChar) {
                // Экранированная кавычка
                currentValue += char;
                j++;
              } else {
                // Конец значения
                inQuotes = false;
                quoteChar = '';
              }
            } else if (char === ',' && !inQuotes) {
              // Разделитель значений
              const trimmedValue = currentValue.trim();
              if (trimmedValue.toUpperCase() === 'NULL') {
                values.push(null);
              } else {
                values.push(trimmedValue);
              }
              currentValue = '';
            } else {
              currentValue += char;
            }
          }

          // Добавляем последнее значение
          const trimmedValue = currentValue.trim();
          if (trimmedValue.toUpperCase() === 'NULL') {
            values.push(null);
          } else {
            values.push(trimmedValue);
          }

          if (columns.length !== values.length) {
            errors.push(`Команда ${i + 1}: количество колонок (${columns.length}) не соответствует количеству значений (${values.length})`);
            errorCount++;
            continue;
          }

          // Создаем объект для вставки
          const row: any = {};
          columns.forEach((col, index) => {
            const value = values[index];
            // Преобразуем значения
            if (value === null) {
              row[col] = null;
            } else {
              // Пытаемся преобразовать в число
              const numValue = Number(value);
              if (!isNaN(numValue) && value !== '' && !value.includes(' ')) {
                row[col] = numValue;
              } else {
                // Убираем кавычки из строковых значений
                row[col] = value.replace(/^['"]|['"]$/g, '');
              }
            }
          });

          // Вставляем данные
          const { error } = await supabase.from(tableName).insert([row]);
          if (error) {
            errors.push(`Команда ${i + 1}: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error: any) {
          errors.push(`Команда ${i + 1}: ${error.message}`);
          errorCount++;
        }
      }

      setImportResult({
        success: successCount,
        errors: errorCount,
        messages: errors,
      });

      if (errorCount === 0) {
        toast.success(`Успешно выполнено ${successCount} команд`);
      } else {
        toast.warning(`Выполнено ${successCount} команд, ошибок: ${errorCount}`);
      }

      // Очищаем форму
      setSqlContent("");
      setSqlPreview("");
    } catch (error: any) {
      toast.error(`Ошибка импорта SQL: ${error.message}`);
      setImportResult({
        success: 0,
        errors: 0,
        messages: [error.message],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Импорт данных</h2>
        <p className="text-muted-foreground">
          Импортируйте данные в базу данных из CSV файлов или SQL скриптов
        </p>
      </div>

      <Tabs value={importType} onValueChange={(value) => setImportType(value as "csv" | "sql")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv">
            <FileText className="w-4 h-4 mr-2" />
            CSV импорт
          </TabsTrigger>
          <TabsTrigger value="sql">
            <Database className="w-4 h-4 mr-2" />
            SQL импорт
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-6">
          <Card className="p-6 bg-card/50 backdrop-blur">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-table">Таблица</Label>
                <Select value={csvTable} onValueChange={setCsvTable}>
                  <SelectTrigger id="csv-table">
                    <SelectValue placeholder="Выберите таблицу" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table.value} value={table.value}>
                        {table.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV файл</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleCSVFileSelect}
                  className="bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Выберите CSV файл с данными для импорта
                </p>
              </div>

              {csvErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ошибки в CSV файле</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2">
                      {csvErrors.slice(0, 10).map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <Label>Предпросмотр данных (первые 10 строк)</Label>
                  <div className="border border-border rounded-md overflow-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {csvHeaders.map((header, index) => (
                            <th key={index} className="px-4 py-2 text-left font-semibold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-t border-border">
                            {csvHeaders.map((header, colIndex) => (
                              <td key={colIndex} className="px-4 py-2">
                                {row[header]?.toString() || ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Button
                onClick={importCSV}
                disabled={!csvTable || !csvFile || importing || csvErrors.length > 0}
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Импорт...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Импортировать CSV
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sql" className="space-y-6">
          <Card className="p-6 bg-card/50 backdrop-blur">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Важно</AlertTitle>
                <AlertDescription>
                  SQL импорт через UI поддерживает только простые INSERT команды для одной таблицы за раз.
                  Для сложных SQL операций (UPDATE, DELETE, CREATE, ALTER и т.д.) используйте скрипты восстановления
                  из директории <code className="text-xs bg-muted px-1 py-0.5 rounded">scripts/</code> или Supabase CLI.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="sql-content">SQL скрипт (только INSERT команды)</Label>
                <textarea
                  id="sql-content"
                  value={sqlContent}
                  onChange={(e) => handleSQLContentChange(e.target.value)}
                  placeholder="INSERT INTO artists (artist_name, artist_bio) VALUES ('Artist Name', 'Bio');"
                  rows={10}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Введите SQL INSERT команды. Каждая команда должна быть на отдельной строке и заканчиваться точкой с запятой.
                  Пример: <code className="text-xs bg-muted px-1 py-0.5 rounded">INSERT INTO artists (artist_name) VALUES ('Artist');</code>
                </p>
              </div>

              {sqlErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ошибки в SQL скрипте</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2">
                      {sqlErrors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {sqlPreview && (
                <div className="space-y-2">
                  <Label>Предпросмотр SQL</Label>
                  <div className="border border-border rounded-md p-4 bg-muted/50 font-mono text-sm overflow-auto max-h-40">
                    {sqlPreview}
                  </div>
                </div>
              )}

              <Button
                onClick={importSQL}
                disabled={!sqlContent.trim() || importing || sqlErrors.length > 0}
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Выполнение...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Выполнить SQL
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {importResult && (
        <Card className="p-6 bg-card/50 backdrop-blur">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Результат импорта</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Успешно: {importResult.success}</span>
              </div>
              {importResult.errors > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="font-medium">Ошибок: {importResult.errors}</span>
                </div>
              )}
            </div>
            {importResult.messages.length > 0 && (
              <Alert variant={importResult.errors > 0 ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Сообщения</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2">
                    {importResult.messages.map((message, index) => (
                      <li key={index} className="text-sm">{message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DataImport;

