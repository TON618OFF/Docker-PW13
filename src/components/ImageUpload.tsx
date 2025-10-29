import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

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
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error("Пожалуйста, выберите изображение");
      return;
    }

    // Проверка размера
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`Размер файла не должен превышать ${maxSizeMB}MB`);
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
        toast.error("Необходимо войти в систему");
        return;
      }

      // Проверяем существование bucket и создаем его при необходимости
      let bucketExists = false;
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          console.warn("Не удалось проверить список bucket'ов:", listError);
          // Продолжаем попытку загрузки
        } else if (buckets) {
          bucketExists = buckets.some(b => b.name === bucket);
        }
      } catch (error) {
        console.warn("Ошибка при проверке bucket'ов:", error);
      }
      
      // Если bucket не существует, пробуем создать его
      if (!bucketExists) {
        const bucketConfig = {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
        };
        
        const { error: createError } = await supabase.storage.createBucket(bucket, bucketConfig);
        
        if (createError) {
          // Если bucket уже существует (кто-то создал его между проверкой и созданием), это нормально
          if (!createError.message.includes('already exists') && !createError.message.includes('duplicate')) {
            console.warn("Ошибка создания bucket:", createError);
            // Продолжаем попытку загрузки - возможно bucket уже существует
          }
        } else {
          // Даем время для синхронизации после создания
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

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
        // Если bucket всё ещё не найден, даем понятное сообщение
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket not found')) {
          throw new Error(`Bucket "${bucket}" не найден. Пожалуйста, создайте его вручную в Supabase Storage (Settings > Storage > New bucket) или обратитесь к администратору.`);
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
      toast.success("Изображение загружено успешно");
    } catch (error: any) {
      console.error("Ошибка загрузки:", error);
      toast.error(`Ошибка загрузки изображения: ${error.message}`);
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
      <Label>Загрузить изображение</Label>
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
            {uploading ? "Загрузка..." : preview ? "Заменить" : "Выбрать файл"}
          </Button>
          {!preview && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
              <span>Макс. {maxSizeMB}MB</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;

