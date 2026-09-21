'use client';

import React, { useState } from 'react';
import {
  Building2, ChevronDown, ChevronRight, Users, User,
  ZoomIn, ZoomOut, RotateCcw, ChevronsDownUp, ChevronsUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OrgNode {
  id: string;
  name: string;
  code: string;
  headTitle?: string;
  headName?: string;
  headAvatar?: string;
  headcount: number;
  parentId?: string | null;
  sortOrder?: number;
  children?: OrgNode[];
}

export function getOrgNodeLevelLabel(node: OrgNode, level: number): string {
  if (node.code === 'SG-TECH') return 'Cấp 1: Ban Lãnh đạo Công ty';
  if (node.code === 'BGD') return 'Cấp 1: Ban Giám đốc Điều hành';
  if (node.code === 'ĐHCĐ') return 'Cấp 1: Quản trị Sở hữu (ĐHCĐ)';
  if (['DELIVERY', 'HR', 'OPS', 'BIZ', 'FIN'].includes(node.code)) return 'Cấp 2: Khối chức năng';
  if (node.code.startsWith('SQ-') || node.code.startsWith('QA-')) return 'Cấp 4: Tổ / Nhóm chuyên môn';
  if (level >= 3) return 'Cấp 3: Trung tâm / Phòng';
  if (level === 2) return 'Cấp 2: Khối / Ban';
  return 'Cấp 1: Ban Lãnh đạo';
}

export function OrgChartNode({
  node,
  level = 0,
  onSelectNode,
  selectedId,
  forceExpand,
  isFirst = false,
  isLast = false,
  isOnly = true,
}: {
  node: OrgNode;
  level?: number;
  onSelectNode: (node: OrgNode) => void;
  selectedId?: string;
  forceExpand?: boolean | null;
  isFirst?: boolean;
  isLast?: boolean;
  isOnly?: boolean;
}) {
  const [localExpanded, setLocalExpanded] = useState(true);
  const isExpanded = forceExpand !== null && forceExpand !== undefined ? forceExpand : localExpanded;

  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelected = selectedId === node.id;
  const levelLabelText = getOrgNodeLevelLabel(node, level);

  return (
    <li className="relative flex flex-col items-center list-none px-3 pt-6">
      {/* CSS Connector Lines from Parent to this Child */}
      {level > 0 && !isOnly && (
        <>
          {/* Left horizontal arm (draws if not the first child) */}
          {!isFirst && (
            <div className="absolute top-0 left-0 right-1/2 h-0 border-t-2 border-border" />
          )}
          {/* Right horizontal arm (draws if not the last child) */}
          {!isLast && (
            <div className="absolute top-0 left-1/2 right-0 h-0 border-t-2 border-border" />
          )}
        </>
      )}

      {/* Vertical drop stem from the horizontal bar down to this node's card */}
      {level > 0 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-border" />
      )}

      {/* Node Card - Synchronized Shadcn Style */}
      <div
        onClick={() => onSelectNode(node)}
        className={cn(
          'relative z-10 flex flex-col rounded-lg border bg-card p-4 shadow-xs transition-all duration-150 cursor-pointer w-[255px] text-left hover:shadow-md hover:-translate-y-0.5 select-none',
          isSelected
            ? 'border-primary ring-2 ring-primary/20 shadow-md'
            : 'border-border hover:border-foreground/40'
        )}
      >
        {/* Top Meta */}
        <div className="flex items-center justify-between gap-1.5 mb-2 pb-1.5 border-b border-border">
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border uppercase tracking-wider">
            {node.code}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{node.headcount} NS</span>
          </span>
        </div>

        {/* Level Indicator */}
        <div className="mb-1.5">
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-md border border-border bg-muted/40 text-muted-foreground">
            {levelLabelText}
          </span>
        </div>

        {/* Department Name */}
        <h4 className="font-bold text-sm text-foreground leading-snug break-words min-h-[2.5rem] flex items-center">
          {node.name}
        </h4>

        {/* Manager Block */}
        <div className="mt-2.5 pt-2.5 border-t border-border flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0 border border-border">
            {node.headName ? node.headName.charAt(0) : <User className="h-3.5 w-3.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">
              {node.headName ?? 'Chưa bổ nhiệm'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {node.headTitle ?? 'Trưởng đơn vị'}
            </p>
          </div>
        </div>

        {/* Expand / Collapse Button attached to bottom center */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLocalExpanded(!isExpanded);
            }}
            aria-label={isExpanded ? 'Thu gọn nhánh' : 'Mở rộng nhánh'}
            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-card text-foreground shadow-xs hover:bg-muted transition-all z-20"
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5 font-bold" /> : <ChevronRight className="h-3.5 w-3.5 font-bold" />}
          </button>
        ) : null}
      </div>

      {/* Children Branches */}
      {hasChildren && isExpanded ? (
        <div className="relative flex flex-col items-center w-full pt-4">
          {/* Vertical Drop Line from bottom of parent card/button down to children list */}
          <div className="w-0.5 h-6 bg-border" />

          {/* Children List */}
          <ul className="relative flex justify-center p-0 m-0 list-none">
            {node.children!.map((child, idx) => (
              <OrgChartNode
                key={child.id}
                node={child}
                level={level + 1}
                onSelectNode={onSelectNode}
                selectedId={selectedId}
                forceExpand={forceExpand}
                isFirst={idx === 0}
                isLast={idx === node.children!.length - 1}
                isOnly={node.children!.length === 1}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

export function InteractiveOrgChart({
  nodes,
  onSelectNode,
  selectedId,
}: {
  nodes: OrgNode[];
  onSelectNode: (node: OrgNode) => void;
  selectedId?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [forceExpand, setForceExpand] = useState<boolean | null>(null);

  // If there are multiple root nodes, create a virtual Company Root or display in row
  const rootNode: OrgNode =
    nodes.length === 1
      ? nodes[0]
      : {
          id: 'company-root',
          name: 'CƠ QUAN / TỔ CHỨC / DOANH NGHIỆP',
          code: 'ORGANIZATION',
          headName: 'Ban Lãnh Đạo / Ban Giám Đốc',
          headTitle: 'Cơ quan Quản lý & Điều hành',
          headcount: nodes.reduce((sum, n) => sum + (n.headcount || 0), 0),
          children: nodes,
        };

  return (
    <div className="relative w-full rounded-lg border border-border bg-card p-4 sm:p-6 overflow-hidden shadow-xs">
      {/* Zoom and Expand Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-bold text-foreground">Thao tác cây:</span>
          <span>Click vào thẻ để xem danh sách nhân viên trực thuộc</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-md border border-border bg-card p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setForceExpand(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-muted text-foreground transition-colors"
            title="Mở rộng tất cả các nhánh"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Mở rộng tất cả</span>
          </button>
          <button
            type="button"
            onClick={() => setForceExpand(false)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Thu gọn các nhánh con"
          >
            <ChevronsDownUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Thu gọn</span>
          </button>
          <div className="h-4 w-px bg-border my-auto" />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
            className="p-1.5 rounded-md hover:bg-muted text-foreground transition-colors"
            title="Phóng to"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-mono font-bold px-1 text-foreground min-w-[2.5rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(1))))}
            className="p-1.5 rounded-md hover:bg-muted text-foreground transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setForceExpand(null);
            }}
            className="p-1.5 rounded-md hover:bg-muted text-foreground transition-colors"
            title="Đặt lại góc nhìn"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Chart Canvas Area - Pure White Background */}
      <div
        className="w-full overflow-x-auto overflow-y-auto py-8 min-h-[620px] bg-white transition-transform duration-200 [scrollbar-width:thin]"
      >
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          className="inline-block min-w-full text-center pb-8 bg-white"
        >
          <ul className="flex justify-center p-0 m-0 list-none">
            <OrgChartNode
              node={rootNode}
              level={0}
              onSelectNode={onSelectNode}
              selectedId={selectedId}
              forceExpand={forceExpand}
              isOnly={true}
            />
          </ul>
        </div>
      </div>
    </div>
  );
}
