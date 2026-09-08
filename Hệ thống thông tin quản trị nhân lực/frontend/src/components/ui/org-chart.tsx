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

const LEVEL_LABELS = [
  { label: 'Cấp 1: Ban Lãnh đạo', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { label: 'Cấp 2: Khối / Ban', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { label: 'Cấp 3: Trung tâm / Phòng', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  { label: 'Cấp 4: Tổ / Nhóm chuyên môn', color: 'bg-slate-50 text-slate-600 border-slate-200' },
];

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
  const levelBadge = LEVEL_LABELS[Math.min(level, LEVEL_LABELS.length - 1)];

  return (
    <li className="relative flex flex-col items-center list-none px-3 pt-6">
      {/* CSS Connector Lines from Parent to this Child */}
      {level > 0 && !isOnly && (
        <>
          {/* Left horizontal arm (draws if not the first child) */}
          {!isFirst && (
            <div className="absolute top-0 left-0 right-1/2 h-0 border-t-2 border-slate-300" />
          )}
          {/* Right horizontal arm (draws if not the last child) */}
          {!isLast && (
            <div className="absolute top-0 left-1/2 right-0 h-0 border-t-2 border-slate-300" />
          )}
        </>
      )}

      {/* Vertical drop stem from the horizontal bar down to this node's card */}
      {level > 0 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-slate-300" />
      )}

      {/* Node Card - 100% Pure White, Synchronized Style */}
      <div
        onClick={() => onSelectNode(node)}
        className={cn(
          'relative z-10 flex flex-col rounded-2xl border bg-white p-4 shadow-xs transition-all duration-150 cursor-pointer w-[255px] text-left hover:shadow-md hover:-translate-y-0.5 select-none',
          isSelected
            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
            : 'border-slate-200 hover:border-slate-400'
        )}
      >
        {/* Top Meta */}
        <div className="flex items-center justify-between gap-1.5 mb-2 pb-1.5 border-b border-slate-100">
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 uppercase tracking-wider">
            {node.code}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            <Users className="h-3.5 w-3.5 text-slate-600" />
            <span>{node.headcount} NS</span>
          </span>
        </div>

        {/* Level Indicator */}
        <div className="mb-1.5">
          <span className={cn('inline-block text-[9.5px] font-bold px-2 py-0.5 rounded-full border shadow-2xs', levelBadge.color)}>
            {levelBadge.label}
          </span>
        </div>

        {/* Department Name - High Contrast Slate-900 text */}
        <h4 className="font-bold text-sm text-slate-900 leading-snug break-words min-h-[2.5rem] flex items-center">
          {node.name}
        </h4>

        {/* Manager Block */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
            {node.headName ? node.headName.charAt(0) : <User className="h-3.5 w-3.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {node.headName ?? 'Chưa bổ nhiệm'}
            </p>
            <p className="text-[10.5px] font-medium text-slate-600 truncate">
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
            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-100 hover:text-blue-600 transition-all z-20"
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5 font-bold" /> : <ChevronRight className="h-3.5 w-3.5 font-bold" />}
          </button>
        ) : null}
      </div>

      {/* Children Branches */}
      {hasChildren && isExpanded ? (
        <div className="relative flex flex-col items-center w-full pt-4">
          {/* Vertical Drop Line from bottom of parent card/button down to children list */}
          <div className="w-0.5 h-6 bg-slate-300" />

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
    <div className="relative w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 overflow-hidden shadow-xs">
      {/* Zoom and Expand Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-bold text-slate-900">Thao tác cây:</span>
          <span>Click vào thẻ để xem danh sách nhân viên trực thuộc</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setForceExpand(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-slate-100 text-slate-800 hover:text-blue-700 transition-colors"
            title="Mở rộng tất cả các nhánh"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Mở rộng tất cả</span>
          </button>
          <button
            type="button"
            onClick={() => setForceExpand(false)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            title="Thu gọn các nhánh con"
          >
            <ChevronsDownUp className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Thu gọn</span>
          </button>
          <div className="h-4 w-px bg-slate-200 my-auto" />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors"
            title="Phóng to"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-mono font-bold px-1 text-slate-700 min-w-[2.5rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(1))))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors"
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
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors"
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
