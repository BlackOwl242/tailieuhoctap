'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, Network, Search, Filter,
  Printer, ArrowRight, Mail, Phone, Briefcase, ShieldCheck,
  Table as TableIcon, LayoutGrid, Eye, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { LoadingState, ErrorState } from '@/components/common/states';
import { InteractiveOrgChart, type OrgNode } from '@/components/ui/org-chart';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
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

  // The API count is the number of employees assigned directly to this unit.
  const enrichedTree: OrgNode[] = useMemo(() => {
    if (!orgTree || orgTree.length === 0) return [];

    const enrichNode = (node: any, level = 1): OrgNode => {
      const unitEmps = employeeList.filter((e) => e.orgUnitId === node.id);

      let headTitle = node.headTitle;
      let headName = node.headName;
      const manager = unitEmps.find((e) => {
        const title = e.jobTitle.toLowerCase();
        return title.includes('tổng giám đốc') || title.includes('giám đốc') || title.includes('trưởng') || title.includes('lead');
      });
      headTitle = headTitle || manager?.jobTitle || 'Chưa xác định';
      headName = headName || manager?.fullName || 'Chưa xác định';

      const children =
        node.children && node.children.length > 0
          ? node.children.map((c: any) => enrichNode(c, level + 1))
          : undefined;

      return {
        id: node.id,
        name: node.name,
        code: node.code,
        headTitle,
        headName,
        headcount: node.memberCount ?? unitEmps.length,
        children,
      };
    };

    return orgTree.map((r) => enrichNode(r, 1));
  }, [orgTree, employeeList]);

  // Flatten tree for Table View
  const tableRows: UnitTableRow[] = useMemo(() => {
    const rows: UnitTableRow[] = [];

    const traverse = (node: OrgNode, level = 1, parentName = 'Ban Lãnh đạo') => {
      const current = node.headcount;

      const levelLabel = level === 1
        ? 'Cấp 1: Doanh nghiệp'
        : level === 2
        ? 'Cấp 2: Quản trị / Ban Điều hành'
        : level === 3
        ? 'Cấp 3: Khối tổng hợp'
        : level === 4
        ? 'Cấp 4: Khối chức năng'
        : level === 5
        ? 'Cấp 5: Phòng / Trung tâm'
        : 'Cấp 6: Tổ / Nhóm chuyên môn';

      rows.push({
        id: node.id,
        code: node.code,
        name: node.name,
        level,
        levelLabel,
        parentId: node.parentId || null,
        parentName: level === 1 ? '— (Cấp cao nhất)' : parentName,
        headName: node.headName || 'Chưa xác định',
        headTitle: node.headTitle || 'Chưa xác định',
        currentCount: current,
      });

      if (node.children) {
        node.children.forEach((c) => traverse(c, level + 1, node.name));
      }
    };

    enrichedTree.forEach((r) => traverse(r, 1, 'Tổng Công ty'));
    return rows;
  }, [enrichedTree]);

  // Active selected node or default first root
  const activeNode: OrgNode = useMemo(() => {
    if (selectedNode) return selectedNode;
    return (
      enrichedTree[0] ?? {
        id: 'root-company',
        name: 'Saigon Technology',
        code: 'SG-TECH',
        headName: 'Chưa xác định',
        headTitle: 'Chưa xác định',
        headcount: 0,
      }
    );
  }, [selectedNode, enrichedTree]);

  const deptEmployees = useMemo(() => {
    if (!activeNode) return [];
    return employeeList.filter((e) => (e.orgUnitId || e.orgUnit?.id) === activeNode.id);
  }, [employeeList, activeNode]);

  const assignedDirectCount = tableRows.reduce((sum, row) => sum + row.currentCount, 0);
  const populatedUnitCount = tableRows.filter((row) => row.currentCount > 0).length;
  const orgUnitCount = tableRows.filter((row) => row.code !== 'SG-TECH').length;

  // Columns for Table View & Print Document
  const columns: DataColumn<UnitTableRow>[] = [
    {
      key: 'code',
      header: 'Mã đơn vị',
      sortable: true,
      className: 'w-[10%] text-center',
      exportValue: (r) => r.code,
      render: (r) => <span className="font-mono text-xs font-semibold text-muted-foreground">{r.code}</span>,
    },
    {
      key: 'name',
      header: 'Tên Đơn vị / Phòng ban',
      sortable: true,
      className: 'w-[25%]',
      exportValue: (r) => r.name,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10 text-primary shrink-0 no-print">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-semibold text-foreground">{r.name}</span>
            <span className="text-xs text-muted-foreground block no-print">{r.levelLabel}</span>
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
          <p className="text-xs text-muted-foreground">{r.headTitle}</p>
        </div>
      ),
    },
    {
      key: 'currentCount',
      header: 'Nhân sự trực tiếp',
      sortable: true,
      className: 'w-[12%] text-center',
      exportValue: (r) => `${r.currentCount} người`,
      render: (r) => (
        <span className="font-bold text-foreground">{r.currentCount}</span>
      ),
    },
  ];

  if (isLoading) return <LoadingState text="Đang tải sơ đồ cơ cấu tổ chức..." />;
  if (isError) return <ErrorState message="Không thể tải dữ liệu cơ cấu tổ chức" onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <WorkspaceHeader
        title="Sơ đồ tổ chức"
        description="Cơ cấu theo báo cáo. Số cạnh đơn vị là nhân sự được gán trực tiếp; nhân sự thuộc đơn vị con không bị cộng vào cấp cha."
        breadcrumbs={[{ label: 'Nhân sự' }, { label: 'Sơ đồ tổ chức' }]}
        actions={
          <div className="flex items-center gap-2">
            <PrintExportDropdown
              printLabel="In Cơ cấu tổ chức"
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
                exportRowsToExcel('co-cau-to-chuc', headers, rowsData);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <NumberCard
          title="Đơn vị trực thuộc doanh nghiệp"
          value={String(orgUnitCount)}
          subtitle={`${tableRows.length} nút nếu tính cả doanh nghiệp SG-TECH`}
          icon={Building2}
        />
        <NumberCard
          title="Nhân sự đã gán đơn vị"
          value={String(assignedDirectCount)}
          subtitle="Tổng số trực tiếp tại các đơn vị"
          icon={Users}
        />
        <NumberCard
          title="Đơn vị có nhân sự trực tiếp"
          value={String(populatedUnitCount)}
          subtitle="Đếm theo hồ sơ đang gán đơn vị"
          icon={ShieldCheck}
        />
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
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
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'table'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5 text-muted-foreground" />
            Bảng Cơ cấu tổ chức (Table View)
          </button>
        </div>

        <span className="text-xs text-muted-foreground hidden sm:inline">
          {activeTab === 'tree' ? 'Phóng to, thu nhỏ hoặc mở rộng các cấp' : `Hiển thị ${orgUnitCount} đơn vị và nút gốc doanh nghiệp`}
        </span>
      </div>

      {/* Main Tab Content - Chiếm trọn 100% chiều rộng để sơ đồ cơ cấu mở rộng tối đa khoảng nhìn */}
      {activeTab === 'tree' ? (
        <div className="w-full space-y-3">
          <InteractiveOrgChart
            nodes={enrichedTree}
            onSelectNode={(node) => setSelectedNode(node)}
            selectedId={selectedNode?.id}
          />
        </div>
      ) : null}

      {/* Table View & Print Area */}
      <div className={activeTab === 'table' ? 'block' : 'hidden print:block'}>
        <div className="print-area">
          <PrintFrame
            title="DANH MỤC CƠ CẤU TỔ CHỨC"
            subtitle={`${orgUnitCount} đơn vị trực thuộc · ${assignedDirectCount} nhân sự đã gán đơn vị`}
          />

          <DataTable
            columns={columns}
            rows={tableRows}
            rowKey={(r) => r.id}
            loading={isLoading}
            exportFilename="co-cau-to-chuc"
            printLabel="In Bảng Cơ cấu"
            searchFields={(r) => [r.name, r.code, r.parentName, r.headName, r.headTitle]}
            filters={[
              {
                key: 'level',
                label: 'Cấp bậc',
                value: (r) => String(r.level),
                options: [
                  { value: '1', label: 'Cấp 1: Doanh nghiệp' },
                  { value: '2', label: 'Cấp 2: Quản trị / Ban Điều hành' },
                  { value: '3', label: 'Cấp 3: Khối tổng hợp' },
                  { value: '4', label: 'Cấp 4: Khối chức năng' },
                  { value: '5', label: 'Cấp 5: Phòng / Trung tâm' },
                  { value: '6', label: 'Cấp 6: Tổ / Nhóm chuyên môn' },
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

      {/* Modal Chi tiết đơn vị & Danh sách nhân sự khi click vào thẻ cây */}
      <Modal
        open={!!selectedNode}
        onOpenChange={(o) => !o && setSelectedNode(null)}
        title={selectedNode?.name ?? ''}
        size="lg"
        description={selectedNode ? `Mã đơn vị: ${selectedNode.code} · ${activeNode.headcount} nhân sự trực thuộc trực tiếp` : undefined}
      >
        {selectedNode && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-md bg-muted/40 border border-border">
                <p className="text-xs uppercase text-muted-foreground font-semibold">Phụ trách đơn vị</p>
                <p className="font-bold text-foreground mt-0.5">{selectedNode.headName ?? 'Chưa bổ nhiệm'}</p>
                <p className="text-xs text-muted-foreground">{selectedNode.headTitle ?? 'Trưởng đơn vị'}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/40 border border-border">
                <p className="text-xs uppercase text-muted-foreground font-semibold">Nhân sự gán trực tiếp</p>
                <p className="font-bold text-primary font-mono mt-0.5">{activeNode.headcount} người</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Danh sách nhân sự gán trực tiếp ({deptEmployees.length})
                </p>
                <Link href="/employees" className="text-xs font-semibold text-primary hover:underline">
                  Xem tất cả
                </Link>
              </div>
              {deptEmployees.length === 0 ? (
                <div className="p-6 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                  Chưa có nhân viên nào được phân bổ về đơn vị này.
                </div>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border bg-card max-h-72 overflow-y-auto">
                  {deptEmployees.map((emp, i) => (
                    <li key={emp.id || i} className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/30">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-semibold text-foreground truncate">{emp.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{emp.jobTitle}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted shrink-0">
                        {emp.employeeCode}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
