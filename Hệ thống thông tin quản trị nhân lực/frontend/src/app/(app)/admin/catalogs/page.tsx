'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Database,
  Search,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Download,
  Check,
  Building2,
  GraduationCap,
  Award,
  Shield,
  Layers,
  ChevronRight,
  Filter,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/primitives';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';
import rawCatalogsData from '@/data/master-catalogs.json';

interface CatalogItem {
  code: string;
  name: string;
  groupCode?: string;
  sector?: string;
  maxStep?: number;
  salarySteps?: string[];
  payTable?: string;
  yearsToStep?: number;
  type?: string;
  [key: string]: any;
}

interface CatalogMeta {
  id: string;
  name: string;
  count: number;
  items: CatalogItem[];
}

interface CatalogGroup {
  id: string;
  title: string;
  description: string;
  catalogs: CatalogMeta[];
}

const STORAGE_KEY = 'hrmis_master_catalogs_v1';

export default function MasterCatalogsPage() {
  // Load data from localStorage if user has made custom edits, otherwise use bundled JSON
  const [catalogsData, setCatalogsData] = useState<{ groups: CatalogGroup[] }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return rawCatalogsData as any;
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('dan_toc');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [itemSearch, setItemSearch] = useState<string>('');
  
  // Modal / Form state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formExtra, setFormExtra] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Pagination for large catalogs (e.g. 515 majors, 184 civil servant cadres)
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Flatten all catalogs with group reference
  const allCatalogs = useMemo(() => {
    const list: { groupTitle: string; groupId: string; catalog: CatalogMeta }[] = [];
    catalogsData.groups.forEach(g => {
      g.catalogs.forEach(c => {
        list.push({ groupTitle: g.title, groupId: g.id, catalog: c });
      });
    });
    return list;
  }, [catalogsData]);

  // Filtered catalog list for the left panel
  const filteredCatalogs = useMemo(() => {
    return allCatalogs.filter(item => {
      const matchGroup = selectedGroupId === 'all' || item.groupId === selectedGroupId;
      const matchSearch =
        !catalogSearch ||
        item.catalog.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.catalog.id.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [allCatalogs, selectedGroupId, catalogSearch]);

  // Currently active catalog
  const currentCatalog = useMemo(() => {
    for (const g of catalogsData.groups) {
      const found = g.catalogs.find(c => c.id === selectedCatalogId);
      if (found) return { catalog: found, group: g };
    }
    return { catalog: allCatalogs[0]?.catalog, group: catalogsData.groups[0] };
  }, [catalogsData, selectedCatalogId, allCatalogs]);

  // Filtered items in active catalog
  const filteredItems = useMemo(() => {
    if (!currentCatalog?.catalog?.items) return [];
    if (!itemSearch) return currentCatalog.catalog.items;
    const q = itemSearch.toLowerCase();
    return currentCatalog.catalog.items.filter(it =>
      (it.code && it.code.toLowerCase().includes(q)) ||
      (it.name && it.name.toLowerCase().includes(q)) ||
      (it.sector && it.sector.toLowerCase().includes(q)) ||
      (it.type && it.type.toLowerCase().includes(q))
    );
  }, [currentCatalog, itemSearch]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page]);

  // Reset page when catalog or item search changes
  useEffect(() => {
    setPage(1);
  }, [selectedCatalogId, itemSearch]);

  // Save to LocalStorage
  const saveState = (updated: typeof catalogsData) => {
    setCatalogsData(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormCode('');
    setFormName('');
    setFormExtra('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormExtra(item.sector || item.payTable || item.type || '');
    setIsModalOpen(true);
  };

  const handleDeleteItem = (code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa mã danh mục "${code}" không?`)) return;
    const newGroups = catalogsData.groups.map(g => ({
      ...g,
      catalogs: g.catalogs.map(c => {
        if (c.id === selectedCatalogId) {
          const newItems = c.items.filter(it => it.code !== code);
          return { ...c, items: newItems, count: newItems.length };
        }
        return c;
      })
    }));
    saveState({ groups: newGroups });
    setFeedbackMsg(`Đã xóa thành công mã "${code}"`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      alert('Vui lòng nhập đầy đủ Mã và Tên danh mục');
      return;
    }

    const newGroups = catalogsData.groups.map(g => ({
      ...g,
      catalogs: g.catalogs.map(c => {
        if (c.id === selectedCatalogId) {
          let newItems = [...c.items];
          if (editingItem) {
            // Update existing
            newItems = newItems.map(it =>
              it.code === editingItem.code
                ? { ...it, code: formCode.trim(), name: formName.trim(), sector: formExtra || it.sector }
                : it
            );
          } else {
            // Check code duplicate
            if (newItems.some(it => it.code.toLowerCase() === formCode.trim().toLowerCase())) {
              alert('Mã danh mục này đã tồn tại!');
              return c;
            }
            newItems.unshift({
              code: formCode.trim(),
              name: formName.trim(),
              sector: formExtra || undefined,
            });
          }
          return { ...c, items: newItems, count: newItems.length };
        }
        return c;
      })
    }));

    saveState({ groups: newGroups });
    setIsModalOpen(false);
    setFeedbackMsg(editingItem ? 'Cập nhật thành công!' : 'Thêm mới mục danh mục thành công!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleResetDefault = () => {
    if (confirm('Khôi phục toàn bộ 32 danh mục về dữ liệu gốc chuẩn nhà nước?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      setCatalogsData(rawCatalogsData as any);
      setFeedbackMsg('Đã khôi phục toàn bộ danh mục về mặc định');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(currentCatalog?.catalog, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DanhMuc_${currentCatalog?.catalog?.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!currentCatalog?.catalog?.items) return;
    const header = ['Mã', 'Tên mục', 'Lĩnh vực/Chi tiết'];
    const rows = currentCatalog.catalog.items.map(it => [
      `"${it.code}"`,
      `"${it.name.replace(/"/g, '""')}"`,
      `"${(it.sector || it.payTable || it.type || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DanhMuc_${currentCatalog?.catalog?.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!currentCatalog?.catalog?.items) return;
    const isNgach = selectedCatalogId === 'ngach_cong_chuc';
    let headers = ['STT', 'Mã mục', 'Tên mục chuẩn hóa', 'Lĩnh vực / Chi tiết'];
    let rows: (string | number)[][] = [];

    if (isNgach) {
      headers = ['STT', 'Mã ngạch', 'Tên ngạch công chức', 'Lĩnh vực', 'Bậc tối đa', 'Hệ số lương Bậc 1..12'];
      rows = currentCatalog.catalog.items.map((it, idx) => [
        idx + 1,
        it.code,
        it.name,
        it.sector || 'Hành chính',
        `Bậc ${it.maxStep || 9}`,
        it.salarySteps ? it.salarySteps.join(', ') : ''
      ]);
    } else {
      rows = currentCatalog.catalog.items.map((it, idx) => [
        idx + 1,
        it.code,
        it.name,
        it.sector || it.payTable || it.type || ''
      ]);
    }

    import('@/lib/export').then(({ exportRowsToExcel }) => {
      exportRowsToExcel(`DanhMuc_${currentCatalog.catalog.id}`, headers, rows);
    });
  };

  const totalAllRecords = useMemo(() => {
    return allCatalogs.reduce((acc, curr) => acc + curr.catalog.count, 0);
  }, [allCatalogs]);

  return (
    <div className="space-y-6">
      {/* Toast thông báo */}
      {feedbackMsg && (
        <div className="fixed top-16 right-6 z-toast flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg animate-in slide-in-from-top-2">
          <Check className="h-4 w-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ================= HEADER TRANG ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hệ thống Danh mục Quản trị (Master Catalogs)
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            32 danh mục nghiệp vụ chuẩn hóa toàn diện cho cả Cơ quan Nhà nước và Doanh nghiệp (Dân tộc, Ngạch công chức & Bậc lương, Ngành đào tạo, Chức vụ...)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <Button variant="outline" size="sm" onClick={handleResetDefault} title="Khôi phục danh mục gốc">
            <RefreshCw className="h-4 w-4" /> Khôi phục gốc
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} title="Xuất CSV">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Xuất CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} title="In biểu danh mục chuẩn NĐ 30">
            <Printer className="h-4 w-4" /> In danh mục
          </Button>
          <Button size="sm" onClick={handleOpenAdd} className="bg-primary text-primary-foreground shadow-xs">
            <Plus className="h-4 w-4" /> Thêm mục mới
          </Button>
        </div>
      </div>

      {/* ================= THẺ THỐNG KÊ 4 NHÓM DANH MỤC ================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 no-print">
        {catalogsData.groups.map(group => {
          const groupCount = group.catalogs.reduce((acc, c) => acc + c.count, 0);
          const isSelected = selectedGroupId === group.id;
          const Icon =
            group.id === 'personal_politics' ? Shield :
            group.id === 'training_education' ? GraduationCap :
            group.id === 'ranks_positions' ? Building2 : Award;

          return (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(isSelected ? 'all' : group.id)}
              className={`flex flex-col text-left rounded-xl border p-4 transition-all duration-150 ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  {group.title}
                </span>
                <span className="font-mono text-xs text-muted-foreground font-semibold">
                  {group.catalogs.length} bảng
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-foreground">{groupCount.toLocaleString('vi-VN')}</span>
                <span className="text-[11px] text-muted-foreground">bản ghi chuẩn</span>
              </div>
              <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{group.description}</p>
            </button>
          );
        })}
      </div>

      {/* ================= KHUNG BỐ CỤC 2 CỘT ================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 no-print">
        {/* CỘT TRÁI: DANH SÁCH 32 BẢNG DANH MỤC (4 cột) */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="p-3.5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Danh mục tham chiếu ({filteredCatalogs.length}/{allCatalogs.length})
                </CardTitle>
                {selectedGroupId !== 'all' && (
                  <button
                    onClick={() => setSelectedGroupId('all')}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Xem tất cả
                  </button>
                )}
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm danh mục (Dân tộc, Ngạch, Ngành...)"
                  className="pl-8 text-xs h-8"
                  value={catalogSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCatalogSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0 max-h-[600px] overflow-y-auto [scrollbar-width:thin]">
              <div className="space-y-1">
                {filteredCatalogs.map(({ catalog, groupTitle }) => {
                  const active = catalog.id === selectedCatalogId;
                  return (
                    <button
                      key={catalog.id}
                      onClick={() => setSelectedCatalogId(catalog.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                          : 'hover:bg-muted text-foreground/80'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate">{catalog.name}</span>
                        <span className={`text-[10px] truncate ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {groupTitle}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded-full text-[11px] font-mono font-extrabold shrink-0 shadow-2xs transition-colors ${
                          active
                            ? 'bg-white text-blue-700 ring-1 ring-blue-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {catalog.count}
                      </span>
                    </button>
                  );
                })}

                {filteredCatalogs.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Không tìm thấy danh mục phù hợp
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CỘT PHẢI: BẢNG CHI TIẾT BẢN GHI TRONG DANH MỤC (8 cột) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="p-4 border-b border-border/60">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-foreground">
                      {currentCatalog?.catalog?.name}
                    </CardTitle>
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      ({currentCatalog?.catalog?.count} bản ghi)
                    </span>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Thuộc nhóm: <strong>{currentCatalog?.group?.title}</strong> · Mã: <code className="text-primary font-mono">{currentCatalog?.catalog?.id}</code>
                  </CardDescription>
                </div>

                {/* Các thao tác: Tìm kiếm, In toàn bộ danh mục, Xuất Excel, Thêm mới */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-44">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={`Tìm trong ${currentCatalog?.catalog?.name}...`}
                      className="pl-8 text-xs h-8"
                      value={itemSearch}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemSearch(e.target.value)}
                    />
                  </div>

                  {/* NÚT IN TOÀN BỘ DANH MỤC */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-800 shadow-2xs"
                    onClick={() => window.print()}
                    title={`In toàn bộ ${currentCatalog?.catalog?.count} bản ghi của ${currentCatalog?.catalog?.name}`}
                  >
                    <Printer className="h-3.5 w-3.5 text-primary" />
                    <span>In toàn bộ danh mục</span>
                  </Button>

                  {/* NÚT XUẤT EXCEL DANH MỤC */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 border-slate-300 bg-white hover:bg-slate-50 font-medium text-slate-800 shadow-2xs"
                    onClick={handleExportExcel}
                    title="Xuất bảng tính Excel danh mục này"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Xuất Excel</span>
                  </Button>

                  {/* NÚT THÊM MỤC */}
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-medium shadow-2xs"
                    onClick={handleOpenAdd}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm mục</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            {selectedCatalogId === 'don_vi_quan_ly' && (
              <div className="mx-4 my-3 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <Building2 className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Thiết lập Tên Cơ quan, Đơn vị & Cơ cấu các Phòng ban trực thuộc</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Danh mục này phân loại cấp quản lý. Để cấu hình Tên đơn vị chính thức, cơ quan chủ quản và sơ đồ phòng ban in ấn, vui lòng truy cập phân hệ Cơ cấu tổ chức.
                    </p>
                  </div>
                </div>
                <a
                  href="/admin/org-units"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shrink-0 shadow-2xs"
                >
                  <span>Cấu hình tại /org-units</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground">
                      <th className="py-2.5 px-4 font-semibold w-24">Mã</th>
                      <th className="py-2.5 px-4 font-semibold">Tên mục chuẩn</th>
                      {/* Cột mở rộng tùy theo loại danh mục */}
                      {selectedCatalogId === 'ngach_cong_chuc' && (
                        <>
                          <th className="py-2.5 px-4 font-semibold w-36">Lĩnh vực</th>
                          <th className="py-2.5 px-4 font-semibold w-28">Bậc tối đa</th>
                          <th className="py-2.5 px-4 font-semibold">Hệ số Bậc 1..6</th>
                        </>
                      )}
                      {selectedCatalogId === 'nhom_ngach' && (
                        <>
                          <th className="py-2.5 px-4 font-semibold">Bảng lương</th>
                          <th className="py-2.5 px-4 font-semibold">Năm nâng bậc</th>
                        </>
                      )}
                      {selectedCatalogId === 'khen_thuong_ky_luat' && (
                        <th className="py-2.5 px-4 font-semibold w-32">Phân loại</th>
                      )}
                      <th className="py-2.5 px-4 font-semibold text-right w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {pagedItems.map((item, idx) => (
                      <tr key={item.code + idx} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2 px-4 font-mono font-bold text-foreground">
                          {item.code}
                        </td>
                        <td className="py-2 px-4 font-medium text-foreground">
                          {item.name}
                        </td>

                        {/* Chi tiết Ngạch công chức & Bậc lương */}
                        {selectedCatalogId === 'ngach_cong_chuc' && (
                          <>
                            <td className="py-2 px-4 text-muted-foreground">
                              {item.sector || 'Hành chính'}
                            </td>
                            <td className="py-2 px-4 font-semibold text-primary">
                              Bậc {item.maxStep || 9}
                            </td>
                            <td className="py-2 px-4 font-mono text-[11px] text-muted-foreground">
                              {item.salarySteps && item.salarySteps.length > 0
                                ? item.salarySteps.slice(0, 6).join(' · ') + (item.salarySteps.length > 6 ? '...' : '')
                                : '—'}
                            </td>
                          </>
                        )}

                        {/* Chi tiết Nhóm ngạch */}
                        {selectedCatalogId === 'nhom_ngach' && (
                          <>
                            <td className="py-2 px-4 font-medium text-muted-foreground">
                              {item.payTable || 'Bảng lương chuyên môn'}
                            </td>
                            <td className="py-2 px-4 text-muted-foreground">
                              {item.yearsToStep || 3} năm/bậc
                            </td>
                          </>
                        )}

                        {/* Phân loại Khen thưởng / Kỷ luật */}
                        {selectedCatalogId === 'khen_thuong_ky_luat' && (
                          <td className="py-2 px-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                              <span className={`h-1.5 w-1.5 rounded-full ${item.type === 'KHEN_THUONG' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                              {item.type === 'KHEN_THUONG' ? 'Khen thưởng' : 'Kỷ luật'}
                            </span>
                          </td>
                        )}

                        {/* Thao tác Sửa / Xóa */}
                        <td className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                              title="Sửa bản ghi"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.code)}
                              className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-muted"
                              title="Xóa bản ghi"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {pagedItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          Không có bản ghi nào phù hợp với bộ lọc tìm kiếm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border/60 bg-muted/10 text-xs">
                  <span className="text-muted-foreground">
                    Hiển thị <strong>{(page - 1) * pageSize + 1}</strong> –{' '}
                    <strong>{Math.min(page * pageSize, filteredItems.length)}</strong> trong{' '}
                    <strong>{filteredItems.length}</strong> bản ghi
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      className="h-7 text-xs px-2.5"
                    >
                      Trước
                    </Button>
                    <span className="px-2 font-mono text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="h-7 text-xs px-2.5"
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================= KHUNG IN ẤN CHUẨN NGHỊ ĐỊNH 30 ================= */}
      <div className="print-area font-times print-only">
        <PrintFrame
          title={`DANH MỤC: ${currentCatalog?.catalog?.name?.toUpperCase()}`}
          subtitle={`Hệ thống Danh mục Tham chiếu Quản trị Nhân lực Toàn diện · Nhóm: ${currentCatalog?.group?.title} · Tổng số ${currentCatalog?.catalog?.items?.length || 0} bản ghi chuẩn`}
        />
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>STT</th>
              <th style={{ width: '18%' }}>MÃ MỤC</th>
              <th style={{ width: '42%' }}>TÊN MỤC CHUẨN HÓA</th>
              <th style={{ width: '32%' }}>
                {selectedCatalogId === 'ngach_cong_chuc'
                  ? 'LĨNH VỰC / BẬC & HỆ SỐ LƯƠNG'
                  : selectedCatalogId === 'nhom_ngach'
                  ? 'BẢNG LƯƠNG / NĂM NÂNG BẬC'
                  : 'LĨNH VỰC / PHÂN LOẠI / GHI CHÚ'}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentCatalog?.catalog?.items?.map((it, i) => (
              <tr key={it.code + i}>
                <td className="text-center font-mono">{i + 1}</td>
                <td className="text-center font-bold font-mono">{it.code}</td>
                <td className="font-semibold">{it.name}</td>
                <td>
                  {selectedCatalogId === 'ngach_cong_chuc' ? (
                    <div>
                      <span>{it.sector || 'Hành chính'} · Bậc tối đa: {it.maxStep || 9}</span>
                      {it.salarySteps && it.salarySteps.length > 0 && (
                        <div className="text-[9pt] italic mt-0.5">
                          Hệ số (1..{it.salarySteps.length}): {it.salarySteps.join(' - ')}
                        </div>
                      )}
                    </div>
                  ) : selectedCatalogId === 'nhom_ngach' ? (
                    <span>
                      {it.payTable || ''} {it.yearsToStep ? `(Nâng bậc: ${it.yearsToStep} năm)` : ''}
                    </span>
                  ) : (
                    it.sector || it.payTable || it.type || '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <PrintSignatureBlock
          leftTitle="Người lập biểu"
          middleTitle="Trưởng phòng Tổ chức - Cán bộ"
          rightTitle="Thủ trưởng Cơ quan / Đơn vị"
        />
      </div>

      {/* ================= MODAL THÊM / SỬA BẢN GHI ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingItem ? 'Chỉnh sửa mục danh mục' : 'Thêm mới mục danh mục'}
              </h3>
              <Badge variant="outline" className="text-xs">
                {currentCatalog?.catalog?.name}
              </Badge>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Mã danh mục (*)</label>
                <Input
                  value={formCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormCode(e.target.value)}
                  placeholder="Ví dụ: 01001, KINH, TS, DH_QGHN..."
                  required
                  className="font-mono text-xs uppercase"
                  disabled={!!editingItem}
                />
                <span className="text-[11px] text-muted-foreground">Mã định danh duy nhất trong hệ thống</span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Tên mục chuẩn hóa (*)</label>
                <Input
                  value={formName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Dân tộc Kinh, Chuyên viên cao cấp..."
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Ghi chú / Lĩnh vực / Thuộc tính mở rộng</label>
                <Input
                  value={formExtra}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormExtra(e.target.value)}
                  placeholder="Ví dụ: Quản lý nhà nước, Bảng lương 204..."
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-primary-foreground">
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
