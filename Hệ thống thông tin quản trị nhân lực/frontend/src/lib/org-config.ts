/**
 * Quản lý tên tổ chức, địa danh và chữ ký hiển thị trên tài liệu nội bộ.
 */

import { useState, useEffect } from 'react';
import { api } from './api';

export type OrgSectorType = 'state' | 'enterprise';
export type PublicPersonnelType = 'CIVIL_SERVANT' | 'PUBLIC_EMPLOYEE';

export interface OrgPrintConfig {
  parentOrgName: string; // Tên cơ quan, tổ chức cấp trên trực tiếp (VD: UBND TỈNH LÂM ĐỒNG, BỘ NỘI VỤ, TẬP ĐOÀN...)
  orgName: string;       // Tên cơ quan, tổ chức ban hành văn bản (VD: SỞ NỘI VỤ, TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP, CÔNG TY CỔ PHẦN...)
  deptName: string;      // Tên phòng ban / bộ phận chuyên trách tham mưu nhân sự (VD: PHÒNG TỔ CHỨC - CÁN BỘ)
  orgLevel: string;      // Cấp quản lý: DV_TW | DV_TINH | DV_HUYEN | DV_XA | DV_SNCL | DV_DNTN
  orgSector?: OrgSectorType; // Phân hệ: 'state' (Cơ quan Nhà nước / Đơn vị SNCL) | 'enterprise' (Doanh nghiệp tư nhân)
  publicPersonnelType?: PublicPersonnelType | null;
  location: string;      // Địa danh ban hành văn bản (VD: Hà Nội, TP. Hồ Chí Minh, Đà Nẵng, Lâm Đồng...)
  signerTitle1: string;  // Tiêu đề người ký 1 (mặc định: Người lập biểu)
  signerTitle2: string;  // Tiêu đề người ký 2 (mặc định: Trưởng phòng Tổ chức - Cán bộ)
  signerTitle3: string;  // Tiêu đề người ký 3 (mặc định: Thủ trưởng Cơ quan / Đơn vị)
}

export const ORG_LEVEL_LABELS: Record<string, string> = {
  DV_TW: 'Cơ quan, Đơn vị cấp Trung ương / Tổng công ty',
  DV_TINH: 'Cơ quan, Đơn vị cấp Tỉnh / Thành phố trực thuộc TW',
  DV_HUYEN: 'Cơ quan, Đơn vị cấp Quận / Huyện / Thị xã',
  DV_XA: 'Cơ quan, Đơn vị cấp Xã / Phường / Thị trấn',
  DV_SNCL: 'Đơn vị sự nghiệp công lập',
  DV_DNTN: 'Doanh nghiệp / Tập đoàn kinh tế',
};

export const DEFAULT_ORG_CONFIG: OrgPrintConfig = {
  parentOrgName: '',
  orgName: 'CÔNG TY CỔ PHẦN SAIGON TECHNOLOGY',
  deptName: 'BAN TỔ CHỨC - HÀNH CHÍNH - NHÂN SỰ',
  orgLevel: 'DV_DNTN',
  orgSector: 'enterprise',
  publicPersonnelType: null,
  location: 'TP. Hồ Chí Minh',
  signerTitle1: 'Người lập biểu',
  signerTitle2: 'Trưởng phòng Nhân sự',
  signerTitle3: 'Tổng Giám đốc',
};

/**
 * Kiểm tra xem cấu hình tổ chức có phải là Doanh nghiệp tư nhân hay không
 */
export function isEnterpriseSector(config?: OrgPrintConfig | null): boolean {
  if (!config) return false;
  if (config.orgSector === 'enterprise') return true;
  if (config.orgSector === 'state') return false;
  return config.orgLevel === 'DV_DNTN';
}

const STORAGE_KEY = 'hrmis_org_print_config_v2';
const EVENT_NAME = 'hrmis:org-config-updated';

/**
 * Lấy cấu hình cơ quan hiện hành (đồng bộ từ LocalStorage)
 */
export function getOrgConfig(): OrgPrintConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_ORG_CONFIG;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.orgName === 'CƠ QUAN / ĐƠN VỊ QUẢN LÝ NHÂN LỰC') {
        parsed.orgName = DEFAULT_ORG_CONFIG.orgName;
      }
      return { ...DEFAULT_ORG_CONFIG, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_ORG_CONFIG;
}

/**
 * Lưu cấu hình cơ quan và phát thông điệp cập nhật toàn hệ thống
 */
export function saveOrgConfig(config: OrgPrintConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: config }));
  } catch (err) {
    console.error('Lỗi khi lưu cấu hình cơ quan:', err);
  }
}

/**
 * React hook tự động lắng nghe và cập nhật thông tin cơ quan in ấn
 */
export function useOrgConfig(): [OrgPrintConfig, (cfg: OrgPrintConfig) => Promise<void>] {
  const [config, setConfig] = useState<OrgPrintConfig>(DEFAULT_ORG_CONFIG);

  useEffect(() => {
    // Cache cục bộ chỉ là dữ liệu tạm; hồ sơ dùng chung trên máy chủ mới là cấu hình có thẩm quyền.
    setConfig(getOrgConfig());
    let cancelled = false;
    api.get<Record<string, unknown>>('/settings/effective').then(({ data }) => {
      const serverProfile = data.ORG_PROFILE;
      if (!cancelled && serverProfile && typeof serverProfile === 'object' && !Array.isArray(serverProfile)) {
        const next = { ...DEFAULT_ORG_CONFIG, ...(serverProfile as Partial<OrgPrintConfig>) };
        saveOrgConfig(next);
        setConfig(next);
      }
    }).catch(() => {
      // Dùng bản cache nếu máy chủ chưa có hồ sơ cấu hình.
    });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<OrgPrintConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(getOrgConfig());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const update = async (newConfig: OrgPrintConfig) => {
    const normalized = { ...DEFAULT_ORG_CONFIG, ...newConfig };
    await api.patch('/admin/settings', { values: { ORG_PROFILE: normalized } });
    saveOrgConfig(normalized);
    setConfig(normalized);
  };

  return [config, update];
}
