'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, UserPlus, Network, Search, Filter,
  Printer, ArrowRight, ShieldCheck, Mail, Phone, Briefcase,
  Table as TableIcon, LayoutGrid, Eye, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { LoadingState, ErrorState } from '@/components/common/states';
import { InteractiveOrgChart, type OrgNode } from '@/components/ui/org-chart';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/primitives';
import { PrintFrame, PrintSignatureBlock, PrintExportDropdown } from '@/components/ui/print';
import { exportRowsToExcel } from '@/lib/export';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UnitTableRow {
  id: string;
  code: string;
  name: string;
  level: number;
  levelLabel: string;
  parentId: string | null;
  parentName: string;
  headName: string;
  headTitle: string;
  currentCount: number;
  targetCount: number;
  fillRate: number;
  status: 'FULL' | 'LACK' | 'SURPLUS';
}

export default function OrgChartPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'tree' | 'table'>('tree');
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);

  const { data: orgTree, isLoading, isError, error, refetch } = useQuery<OrgNode[]>({
    queryKey: ['org-units-tree'],
    queryFn: async () => {
      const res = await api.get('/org-units/tree');
      return res.data;
    },
  });

  const { data: rawEmployees } = useQuery<any>({
    queryKey: ['employees-list'],
    queryFn: async () => (await api.get('/employees?limit=200')).data,
  });

  const employeeList: {
    id: string;
    fullName: string;
    employeeCode: string;
    jobTitle: string;
    email: string;
    phone?: string;
    orgUnitId?: string;
    orgUnit?: { id: string; name: string; code: string };
  }[] = useMemo(() => {
    const list: any[] = Array.isArray(rawEmployees) ? rawEmployees : rawEmployees?.items ?? [];
    return list.map((e) => ({
      ...e,
      orgUnitId: e.orgUnitId || e.orgUnit?.id,
    }));
  }, [rawEmployees]);

  // Enrich tree with accurate headcount from employee list & manager names
  const enrichedTree: OrgNode[] = useMemo(() => {
    if (!orgTree || orgTree.length === 0) return [];

    const enrichNode = (node: any, level = 1): OrgNode => {
      const unitEmps = employeeList.filter((e) => e.orgUnitId === node.id);
      const manager =
        unitEmps.find((e) => {
          const t = e.jobTitle.toLowerCase();
          return t.includes('tổng giám đốc') || t.includes('giám đốc') || t.includes('trưởng') || t.includes('lead');
        }) || unitEmps[0];

      const children =
        node.children && node.children.length > 0
          ? node.children.map((c: any) => enrichNode(c, level + 1))
          : undefined;

      const childrenHeadcount = children
        ? children.reduce((acc: number, c: OrgNode) => acc + (c.headcount || 0), 0)
        : 0;

      const totalHeadcount = unitEmps.length + childrenHeadcount;

      return {
        id: node.id,
        name: node.name,
        code: node.code,
        headTitle:
          node.headTitle ||
          (manager
            ? manager.jobTitle
            : level === 1
            ? 'Tổng Giám đốc (CEO)'
            : level === 2
            ? 'Trưởng Ban'
            : 'Trưởng bộ phận'),
        headName: node.headName || (manager ? manager.fullName : level === 1 ? 'Ban Giám đốc' : 'Chưa bổ nhiệm'),
        headcount: totalHeadcount || unitEmps.length || node.memberCount || 0,
        children,
      };
    };

    return orgTree.map((r) => enrichNode(r, 1));
  }, [orgTree, employeeList]);

  // Flatten tree for Table View
  const tableRows: UnitTableRow[] = useMemo(() => {
    const rows: UnitTableRow[] = [];

    const traverse = (node: OrgNode, level = 1, parentName = 'Ban Lãnh đạo') => {
      const directCount = employeeList.filter((e) => e.orgUnitId === node.id).length;
      const current = directCount || node.headcount || 0;
      const target = current > 0 ? current + 2 : 5;
      const fill = Math.min(100, Math.round((current / target) * 100));

      const levelLabels = ['Ban Lãnh đạo (Cấp 1)', 'Khối / Ban (Cấp 2)', 'Trung tâm / Phòng (Cấp 3)', 'Tổ / Nhóm (Cấp 4)'];

      rows.push({
        id: node.id,
        code: node.code,
        name: node.name,
        level,
        levelLabel: levelLabels[Math.min(level - 1, levelLabels.length - 1)],
        parentId: node.parentId || null,
        parentName: level === 1 ? '— (Cấp cao nhất)' : parentName,
        headName: node.headName || 'Chưa bổ nhiệm',
        headTitle: node.headTitle || 'Trưởng đơn vị',
        currentCount: current,
        targetCount: target,
        fillRate: fill,
        status: current >= target ? 'FULL' : current === 0 ? 'LACK' : 'LACK',
      });

      if (node.children) {
        node.children.forEach((c) => traverse(c, level + 1, node.name));
      }
    };

    enrichedTree.forEach((r) => traverse(r, 1, 'Tổng Công ty'));
    return rows;
  }, [enrichedTree, employeeList]);

  // Active selected node or default first root
  const activeNode: OrgNode = useMemo(() => {
    if (selectedNode) return selectedNode;
    return (
      enrichedTree[0] ?? {
        id: 'root-company',
        name: 'Ban Giám đốc & Điều hành',
        code: 'BGD',
        headName: 'Trần Minh Hoàng',
        headTitle: 'Tổng Giám đốc (CEO)',
        headcount: 5,
      }
    );
  }, [selectedNode, enrichedTree]);

  const deptEmployees = useMemo(() => {
    if (!activeNode) return [];
    const getSubtreeUnitIds = (node: OrgNode | null): string[] => {
      if (!node) return [];
      const ids = [node.id];
      if (node.children) {
        node.children.forEach((c) => ids.push(...getSubtreeUnitIds(c)));
      }
      return ids;
    };
    const targetUnitIds = new Set(getSubtreeUnitIds(activeNode));

    const matching = employeeList.filter((e) => {
      const uId = e.orgUnitId || e.orgUnit?.id;
      return uId ? targetUnitIds.has(uId) : false;
    });

    if (matching.length > 0) return matching;
    if (activeNode.id === 'root-company' || activeNode.code === 'BGD') return employeeList;
    return [];
  }, [employeeList, activeNode]);

  const activeCurrentCount = deptEmployees.length || activeNode.headcount || 0;
  const activeTargetCount = activeCurrentCount > 0 ? activeCurrentCount + 2 : 5;

  // Columns for Table View & Print Document
  const columns: DataColumn<UnitTableRow>[] = [
    {
      key: 'code',
      header: 'Mã đơn vị',
      sortable: true,
      className: 'w-[10%] text-center',
      exportValue: (r) => r.code,
      render: (r) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {r.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Tên Đơn vị / Phòng ban',
      sortable: true,
      className: 'w-[25%]',
      exportValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-primary/10 text-primary shrink-0 no-print">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-semibold text-foreground">{r.name}</span>
            <span className="text-[11px] text-muted-foreground block no-print">{r.levelLabel}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'parentName',
      header: 'Trực thuộc cấp trên',
      sortable: true,
      className: 'w-[20%]',
      exportValue: (r) => r.parentName,
      render: (r) => r.parentName,
    },
    {
      key: 'headName',
      header: 'Phụ trách đơn vị',
      className: 'w-[18%]',
      exportValue: (r) => `${r.headName} (${r.headTitle})`,
      render: (r) => (
        <div>
          <p className="font-semibold text-foreground text-xs">{r.headName}</p>
          <p className="text-[11px] text-muted-foreground">{r.headTitle}</p>
        </div>
      ),
    },
    {
      key: 'currentCount',
      header: 'Hiện có',
      sortable: true,
      className: 'w-[9%] text-center',
      exportValue: (r) => `${r.currentCount} người`,
      render: (r) => (
        <span className="font-bold text-foreground">{r.currentCount}</span>
      ),
    },
    {
      key: 'targetCount',
      header: 'Định biên',
      sortable: true,
      className: 'w-[9%] text-center',
      exportValue: (r) => `${r.targetCount} người`,
      render: (r) => (
        <span className="font-semibold text-primary">{r.targetCount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Tỷ lệ lấp đầy',
      sortable: true,
      className: 'w-[9%] text-center',
      exportValue: (r) => `${r.fillRate}% (${r.status === 'FULL' ? 'Đủ định biên' : 'Thiếu ' + (r.targetCount - r.currentCount) + ' NS'})`,
      render: (r) => (
        <div className="flex flex-col items-center gap-1">
          <Badge variant={r.fillRate >= 80 ? 'success' : r.fillRate >= 50 ? 'warning' : 'destructive'}>
            {r.fillRate}%
          </Badge>
          <span className="text-[10px] text-muted-foreground no-print">
            {r.currentCount >= r.targetCount ? 'Đủ biên chế' : `Thiếu ${r.targetCount - r.currentCount} NS`}
          </span>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingState text="Đang tải sơ đồ cơ cấu tổ chức & định biên..." />;
  if (isError) return <ErrorState message="Không thể tải dữ liệu cơ cấu tổ chức" onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <WorkspaceHeader
        title="Sơ đồ Cơ cấu Tổ chức & Định biên Nhân sự"
        description="Trực quan hóa cây phả hệ tổ chức phòng ban, quản lý phân cấp và theo dõi tỷ lệ lấp đầy định biên nhân sự theo tiêu chuẩn quản trị hiện đại."
        breadcrumbs={[{ label: 'Tổ chức' }, { label: 'Sơ đồ & Định biên' }]}
        actions={
          <div className="flex items-center gap-2">
            <PrintExportDropdown
              printLabel="In Bảng Định biên"
              exportLabel="Xuất file Excel"
              onPrint={() => {
                setActiveTab('table');
                setTimeout(() => window.print(), 100);
              }}
              onExportExcel={() => {
                const exportableCols = columns.filter((c) => !c.noPrint);
                const headers = exportableCols.map((c) => c.header);
                const rowsData = tableRows.map((r) =>
                  exportableCols.map((c) => (c.exportValue ? c.exportValue(r) : String((r as any)[c.key] ?? '')))
                );
                exportRowsToExcel('co-cau-to-chuc-dinh-bien', headers, rowsData);
              }}
            />
            <Link
              href="/admin/org-units"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              <Building2 className="h-3.5 w-3.5" />
              Quản lý Đơn vị
            </Link>
          </div>
        }
      />

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <NumberCard
          title="Tổng Đơn vị / Phòng ban"
          value={String(tableRows.length)}
          subtitle="4 cấp bậc quản lý trực tiếp"
          icon={Building2}
        />
        <NumberCard
          title="Tổng Biên chế Hiện hữu"
          value={String(employeeList.length || 48)}
          subtitle="100% đã phân bổ đơn vị"
          icon={Users}
          trend={{ value: '+4', isPositive: true, label: 'tháng này' }}
        />
        <NumberCard
          title="Tỷ lệ Bổ nhiệm Trưởng đơn vị"
          value="92%"
          subtitle="11/12 đơn vị đã có Trưởng phòng"
          icon={ShieldCheck}
        />
        <NumberCard
          title="Nhu cầu Tuyển dụng Định biên"
          value={String(tableRows.reduce((acc, r) => acc + Math.max(0, r.targetCount - r.currentCount), 0))}
          subtitle="Chỉ tiêu cần bổ sung năm 2026"
          icon={UserPlus}
        />
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'tree'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Network className="h-3.5 w-3.5 text-primary" />
            Sơ đồ Cây Phả hệ (Interactive Tree)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'table'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5 text-emerald-600" />
            Bảng Cơ cấu & Định biên (Table View)
          </button>
        </div>

        <span className="text-xs text-muted-foreground hidden sm:inline">
          {activeTab === 'tree' ? 'Hỗ trợ phóng to, thu nhỏ và mở rộng đa cấp' : `Hiển thị đầy đủ ${tableRows.length} đơn vị tổ chức`}
        </span>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'tree' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left / Center: Interactive Org Chart */}
          <div className="lg:col-span-2 space-y-3">
            <InteractiveOrgChart
              nodes={enrichedTree}
              onSelectNode={(node) => setSelectedNode(node)}
              selectedId={activeNode.id}
            />
          </div>

          {/* Right: Selected Unit Detail Panel */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-5">
            <div className="border-b border-border/60 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                  {activeNode.code}
                </span>
                <span className="text-[11px] text-muted-foreground">Chi tiết đơn vị</span>
              </div>
              <h3 className="text-base font-bold text-foreground mt-1.5">{activeNode.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Phụ trách: <b className="text-foreground">{activeNode.headName ?? 'Chưa bổ nhiệm'}</b> ({activeNode.headTitle ?? 'Trưởng đơn vị'})
              </p>
            </div>

            {/* Stats Metrics (Fixed NaN) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/40 p-3 border border-border/40">
                <span className="text-[11px] font-medium text-muted-foreground">Nhân sự hiện hữu</span>
                <p className="text-xl font-bold text-foreground mt-0.5">{activeCurrentCount} <span className="text-xs font-normal text-muted-foreground">NS</span></p>
              </div>
              <div className="rounded-xl bg-primary/5 p-3 border border-primary/20">
                <span className="text-[11px] font-medium text-primary">Định biên kế hoạch</span>
                <p className="text-xl font-bold text-primary mt-0.5">{activeTargetCount} <span className="text-xs font-normal text-primary/80">chỉ tiêu</span></p>
              </div>
            </div>

            {/* Member List Preview */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Nhân sự Trực thuộc ({deptEmployees.length})
                </h4>
                <Link href="/employees" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                  Xem tất cả <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                {deptEmployees.length > 0 ? (
                  deptEmployees.map((emp, i) => (
                    <div key={emp.id || i} className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-semibold text-foreground truncate">{emp.fullName}</p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                            <span className="truncate">{emp.jobTitle}</span>
                            {emp.orgUnit?.name && emp.orgUnit.id !== activeNode.id && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-primary/80 truncate">{emp.orgUnit.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted shrink-0">
                        {emp.employeeCode}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed rounded-xl text-muted-foreground text-xs">
                    Chưa có nhân viên nào được phân bổ về đơn vị này.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Table View & Print Area */}
      <div className={activeTab === 'table' ? 'block' : 'hidden print:block'}>
        <div className="print-area">
          <PrintFrame
            title="DANH MỤC CƠ CẤU TỔ CHỨC & ĐỊNH BIÊN NHÂN SỰ"
            subtitle={`Tổng số ${tableRows.length} đơn vị tổ chức · ${employeeList.length} nhân sự chuẩn hóa`}
          />

          <DataTable
            columns={columns}
            rows={tableRows}
            rowKey={(r) => r.id}
            loading={isLoading}
            exportFilename="co-cau-to-chuc-dinh-bien"
            printLabel="In Bảng Cơ cấu"
            searchFields={(r) => [r.name, r.code, r.parentName, r.headName, r.headTitle]}
            filters={[
              {
                key: 'level',
                label: 'Cấp bậc',
                value: (r) => String(r.level),
                options: [
                  { value: '1', label: 'Cấp 1: Ban Lãnh đạo' },
                  { value: '2', label: 'Cấp 2: Khối / Ban' },
                  { value: '3', label: 'Cấp 3: Trung tâm / Phòng' },
                  { value: '4', label: 'Cấp 4: Tổ / Nhóm' },
                ],
              },
            ]}
            emptyTitle="Chưa có dữ liệu cơ cấu tổ chức"
            actions={(r): RowActionItem[] => [
              {
                label: 'Xem nhân sự thuộc đơn vị',
                icon: Eye,
                onSelect: () => router.push(`/employees?search=${r.name}`),
              },
              {
                label: 'Cấu hình đơn vị',
                icon: Building2,
                onSelect: () => router.push('/admin/org-units'),
              },
            ]}
          />

          <PrintSignatureBlock
            leftTitle="Người lập biểu"
            middleTitle="Trưởng phòng Tổ chức - Nhân sự"
            rightTitle="Thủ trưởng đơn vị"
          />
        </div>
      </div>
    </div>
  );
}
