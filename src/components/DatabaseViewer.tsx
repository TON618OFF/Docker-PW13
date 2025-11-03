import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Search, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface TableData {
  [key: string]: any;
}

const DatabaseViewer = () => {
  const { t } = useTranslation();
  const [selectedTable, setSelectedTable] = useState<string>("tracks");
  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState(50);

  const tables = [
    { value: "tracks", label: t('admin.dbViewer.tables.tracks'), icon: "🎵" },
    { value: "playlists", label: t('admin.dbViewer.tables.playlists'), icon: "📋" },
    { value: "users", label: t('admin.dbViewer.tables.users'), icon: "👤" },
    { value: "listening_history", label: t('admin.dbViewer.tables.listeningHistory'), icon: "📊" },
    { value: "playlist_tracks", label: t('admin.dbViewer.tables.playlistTracks'), icon: "🔗" },
    { value: "artists", label: t('admin.dbViewer.tables.artists'), icon: "🎤" },
    { value: "albums", label: t('admin.dbViewer.tables.albums'), icon: "💿" },
    { value: "roles", label: t('admin.dbViewer.tables.roles'), icon: "👑" },
  ];

  useEffect(() => {
    fetchData();
  }, [selectedTable, limit]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: tableData, error } = await supabase
        .from(selectedTable)
        .select("*")
        .limit(limit)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData(tableData || []);
    } catch (error: any) {
      toast.error(`${t('admin.dbViewer.error')}: ${error.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((row) => {
    if (!searchQuery) return true;
    
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatValue = (value: any, key: string) => {
    if (value === null || value === undefined) {
      return <Badge variant="secondary">null</Badge>;
    }
    
    if (typeof value === "boolean") {
      return <Badge variant={value ? "default" : "secondary"}>{value ? t('common.yes') : t('common.no')}</Badge>;
    }
    
    if (key.includes("date") || key.includes("at")) {
      return new Date(value).toLocaleString("ru-RU");
    }
    
    if (key.includes("duration") && typeof value === "number") {
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    
    if (typeof value === "string" && value.length > 50) {
      return (
        <span title={value} className="cursor-help">
          {value.substring(0, 50)}...
        </span>
      );
    }
    
    return String(value);
  };

  const getColumns = () => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          {t('admin.dbViewer.title')}
        </h3>
        <Button onClick={fetchData} disabled={loading} size="sm">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Фильтры */}
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table.value} value={table.value}>
                  <span className="flex items-center gap-2">
                    <span>{table.icon}</span>
                    {table.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.dbViewer.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Статистика */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{t('admin.dbViewer.table')} <strong>{selectedTable}</strong></span>
          <span>{t('admin.dbViewer.totalRecords')} <strong>{data.length}</strong></span>
          <span>{t('admin.dbViewer.shown')} <strong>{filteredData.length}</strong></span>
        </div>

        {/* Таблица */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-muted-foreground">{t('admin.dbViewer.loading')}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {searchQuery ? t('admin.dbViewer.noResults') : t('admin.dbViewer.noData')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {getColumns().map((column) => (
                    <TableHead key={column} className="whitespace-nowrap">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row, index) => (
                  <TableRow key={index}>
                    {getColumns().map((column) => (
                      <TableCell key={column} className="max-w-xs">
                        {formatValue(row[column], column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DatabaseViewer;

