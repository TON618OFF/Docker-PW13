import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ImportDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

type ImportType = "csv" | "sql" | null;
type ImportStatus = "idle" | "parsing" | "preview" | "importing" | "success" | "error";

interface PreviewData {
  headers: string[];
  rows: any[][];
  totalRows: number;
}

const ImportDataDialog = ({ open, onOpenChange, onImportComplete }: ImportDataDialogProps) => {
  const { t } = useTranslation();
  const [importType, setImportType] = useState<ImportType>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setPreviewData(null);
    setStatus("parsing");

    // Определяем тип файла
    const fileName = selectedFile.name.toLowerCase();
    if (fileName.endsWith(".csv")) {
      setImportType("csv");
      await parseCSV(selectedFile);
    } else if (fileName.endsWith(".sql")) {
      setImportType("sql");
      await parseSQL(selectedFile);
    } else {
      setErrors([t('import.unsupportedFileType') || 'Unsupported file type. Please select a CSV or SQL file.']);
      setStatus("error");
      setFile(null);
    }
  };

  const parseCSV = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length === 0) {
        setErrors([t('import.emptyFile') || 'File is empty']);
        setStatus("error");
        return;
      }

      // Парсим CSV (простой парсер, поддерживает кавычки)
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++; // Пропускаем следующую кавычку
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1).map(line => parseCSVLine(line)).filter(row => row.some(cell => cell.trim()));

      // Показываем предпросмотр (первые 10 строк)
      setPreviewData({
        headers,
        rows: rows.slice(0, 10),
        totalRows: rows.length,
      });

      setStatus("preview");
    } catch (error) {
      console.error("Error parsing CSV:", error);
      setErrors([t('import.parseError') || 'Error parsing CSV file']);
      setStatus("error");
    }
  };

  const parseSQL = async (file: File) => {
    try {
      const text = await file.text();
      
      // Простая проверка SQL файла
      if (!text.trim()) {
        setErrors([t('import.emptyFile') || 'File is empty']);
        setStatus("error");
        return;
      }

      // Проверяем, что это SQL файл
      if (!text.toLowerCase().includes('insert') && !text.toLowerCase().includes('create') && !text.toLowerCase().includes('update')) {
        setErrors([t('import.invalidSQL') || 'Invalid SQL file format']);
        setStatus("error");
        return;
      }

      // Для SQL файлов показываем информацию о файле
      setPreviewData({
        headers: ['SQL Statement'],
        rows: text.split('\n').slice(0, 10).map(line => [line]),
        totalRows: text.split('\n').length,
      });

      setStatus("preview");
    } catch (error) {
      console.error("Error parsing SQL:", error);
      setErrors([t('import.parseError') || 'Error parsing SQL file']);
      setStatus("error");
    }
  };

  const handleImport = async () => {
    if (!file || !importType) return;

    setStatus("importing");
    setProgress(0);
    setErrors([]);
    setImportResults(null);

    try {
      if (importType === "csv") {
        await importCSV(file);
      } else if (importType === "sql") {
        await importSQL(file);
      }
    } catch (error) {
      console.error("Error importing data:", error);
      setErrors([t('import.importError') || 'Error importing data']);
      setStatus("error");
    }
  };

  const importCSV = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length === 0) {
        setErrors([t('import.emptyFile') || 'File is empty']);
        setStatus("error");
        return;
      }

      // Парсим CSV
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1).map(line => parseCSVLine(line)).filter(row => row.some(cell => cell.trim()));

      // Определяем таблицу для импорта на основе заголовков
      let tableName: string | null = null;
      if (headers.includes('track_title') || headers.includes('track_id')) {
        tableName = 'tracks';
      } else if (headers.includes('album_title') || headers.includes('album_id')) {
        tableName = 'albums';
      } else if (headers.includes('playlist_title') || headers.includes('playlist_id')) {
        tableName = 'playlists';
      } else if (headers.includes('artist_name') || headers.includes('artist_id')) {
        tableName = 'artists';
      } else if (headers.includes('genre_name') || headers.includes('genre_id')) {
        tableName = 'genres';
      }

      if (!tableName) {
        setErrors([t('import.unknownTable') || 'Cannot determine table from CSV headers']);
        setStatus("error");
        return;
      }

      // Преобразуем строки в объекты
      const data = rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || null;
        });
        return obj;
      });

      // Импортируем данные батчами
      const batchSize = 100;
      let successCount = 0;
      let failedCount = 0;
      const importErrors: string[] = [];

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        try {
          const { error } = await supabase
            .from(tableName)
            .insert(batch);

          if (error) {
            failedCount += batch.length;
            importErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          } else {
            successCount += batch.length;
          }
        } catch (error: any) {
          failedCount += batch.length;
          importErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        }

        setProgress(Math.round(((i + batch.length) / data.length) * 100));
      }

      setImportResults({
        success: successCount,
        failed: failedCount,
        errors: importErrors,
      });

      setStatus("success");
      toast.success(t('import.importSuccess') || `Successfully imported ${successCount} records`);

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      console.error("Error importing CSV:", error);
      setErrors([error.message || t('import.importError') || 'Error importing data']);
      setStatus("error");
    }
  };

  const importSQL = async (file: File) => {
    try {
      const text = await file.text();
      
      // Для SQL файлов мы не можем выполнить их напрямую через Supabase API
      // Показываем инструкцию пользователю
      setErrors([
        t('import.sqlNotSupported') || 'SQL files cannot be imported directly through the UI. Please use the Supabase CLI or database management tools.',
        t('import.sqlInstruction') || 'To import SQL file, use: psql -h [host] -U [user] -d [database] -f [file.sql]'
      ]);
      setStatus("error");
    } catch (error: any) {
      console.error("Error importing SQL:", error);
      setErrors([error.message || t('import.importError') || 'Error importing data']);
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportType(null);
    setStatus("idle");
    setProgress(0);
    setPreviewData(null);
    setErrors([]);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('import.title') || 'Import Data'}</DialogTitle>
          <DialogDescription>
            {t('import.description') || 'Import data from CSV or SQL files'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Выбор файла */}
          {status === "idle" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('import.selectFile') || 'Select File'}</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.sql"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  {t('import.supportedFormats') || 'Supported formats: CSV, SQL'}
                </p>
              </div>
            </div>
          )}

          {/* Парсинг */}
          {status === "parsing" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">{t('import.parsing') || 'Parsing file...'}</p>
            </div>
          )}

          {/* Предпросмотр */}
          {status === "preview" && previewData && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{t('import.preview') || 'Preview'}</h3>
                  <div className="text-sm text-muted-foreground">
                    {t('import.totalRows') || 'Total rows'}: {previewData.totalRows}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {previewData.headers.map((header, index) => (
                          <TableHead key={index}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex}>{cell || '-'}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {previewData.totalRows > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('import.showingFirstRows') || `Showing first 10 rows of ${previewData.totalRows}`}
                  </p>
                )}
              </Card>

              {/* Ошибки */}
              {errors.length > 0 && (
                <Card className="p-4 border-destructive">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-destructive mb-2">{t('import.errors') || 'Errors'}</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index} className="text-sm text-destructive">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Импорт */}
          {status === "importing" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('import.importing') || 'Importing...'}</Label>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </div>
          )}

          {/* Результаты */}
          {status === "success" && importResults && (
            <Card className="p-4 border-primary">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-primary mb-2">{t('import.importComplete') || 'Import Complete'}</h4>
                  <div className="space-y-1 text-sm">
                    <p>{t('import.successCount') || 'Success'}: {importResults.success}</p>
                    <p>{t('import.failedCount') || 'Failed'}: {importResults.failed}</p>
                  </div>
                  {importResults.errors.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-semibold text-destructive mb-2">{t('import.errors') || 'Errors'}</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {importResults.errors.slice(0, 10).map((error, index) => (
                          <li key={index} className="text-sm text-destructive">{error}</li>
                        ))}
                      </ul>
                      {importResults.errors.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {t('import.moreErrors') || `And ${importResults.errors.length - 10} more errors...`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Ошибки */}
          {status === "error" && errors.length > 0 && (
            <Card className="p-4 border-destructive">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-destructive mb-2">{t('import.errors') || 'Errors'}</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm text-destructive">{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          {status === "idle" && (
            <Button variant="outline" onClick={handleClose}>
              {t('common.cancel') || 'Cancel'}
            </Button>
          )}
          {status === "preview" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                {t('import.selectAnotherFile') || 'Select Another File'}
              </Button>
              <Button onClick={handleImport} disabled={errors.length > 0}>
                {t('import.import') || 'Import'}
              </Button>
            </>
          )}
          {(status === "success" || status === "error") && (
            <Button onClick={handleClose}>
              {t('common.close') || 'Close'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDataDialog;

