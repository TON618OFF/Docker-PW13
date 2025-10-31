import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface ImageUploadProps {
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  bucket: "covers" | "avatars";
  maxSizeMB?: number;
  aspectRatio?: string;
}

const ImageUpload = ({ 
  currentUrl, 
  onUploadComplete, 
  bucket,
  maxSizeMB = 5,
  aspectRatio
}: ImageUploadProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error(t('image.upload.selectImage'));
      return;
    }

    // Проверка размера
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(t('image.upload.maxSize').replace('{size}', maxSizeMB.toString()));
      return;
    }

    // Создаем превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Загружаем файл
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error(t('image.upload.loginRequired'));
        return;
      }

      // Buckets должны быть созданы через миграции или администратором
      // Не пытаемся создавать их здесь из-за ограничений RLS

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Загружаем файл в Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Если bucket не найден или нарушение RLS
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket not found')) {
          throw new Error(t('image.upload.bucketNotFound'));
        }
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS')) {
          throw new Error(t('image.upload.noPermission'));
        }
        throw uploadError;
      }

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error("Не удалось получить URL загруженного файла");
      }

      onUploadComplete(urlData.publicUrl);
      toast.success(t('image.upload.success'));
    } catch (error: any) {
      console.error("Ошибка загрузки:", error);
      toast.error(`${t('image.upload.error')}: ${error.message}`);
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{t('image.upload.label')}</Label>
      <div className="flex flex-col gap-4">
        {preview && (
          <div className="relative inline-block">
            <div className={`overflow-hidden rounded-lg border-2 border-border ${aspectRatio ? `aspect-${aspectRatio}` : 'w-48 h-48'}`}>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={`image-upload-${bucket}`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? t('common.upload') : preview ? t('image.upload.replace') : t('image.upload.selectFile')}
          </Button>
          {!preview && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
              <span>{t('image.upload.maxSize').replace('{size}', maxSizeMB.toString())}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;

