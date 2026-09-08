/**
 * Quản lý Cấu hình Thông tin Cơ quan, Đơn vị & Tiêu đề Văn bản In ấn
 * Tuân thủ Nghị định 30/2020/NĐ-CP về công tác văn thư
 */

import { useState, useEffect } from 'react';

export type OrgSectorType = 'state' | 'enterprise';

export interface OrgPrintConfig {
  parentOrgName: string; // Tên cơ quan, tổ chức cấp trên trực tiếp (VD: UBND TỈNH LÂM ĐỒNG, BỘ NỘI VỤ, TẬP ĐOÀN...)
  orgName: string;       // Tên cơ quan, tổ chức ban hành văn bản (VD: SỞ NỘI VỤ, TRƯỜNG ĐẠI HỌC CÔNG NGHIỆP, CÔNG TY CỔ PHẦN...)
  deptName: string;      // Tên phòng ban / bộ phận chuyên trách tham mưu nhân sự (VD: PHÒNG TỔ CHỨC - CÁN BỘ)
  orgLevel: string;      // Cấp quản lý: DV_TW | DV_TINH | DV_HUYEN | DV_XA | DV_SNCL | DV_DNTN
  orgSector?: OrgSectorType; // Phân hệ: 'state' (Cơ quan Nhà nước / Đơn vị SNCL) | 'enterprise' (Doanh nghiệp tư nhân)
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
  parentOrgName: 'ỦY BAN NHÂN DÂN TỈNH / BỘ CHỦ QUẢN',
  orgName: 'CƠ QUAN / ĐƠN VỊ QUẢN LÝ NHÂN LỰC',
  deptName: 'PHÒNG TỔ CHỨC - CÁN BỘ',
  orgLevel: 'DV_TINH',
  orgSector: 'state',
  location: 'TP. Hồ Chí Minh',
  signerTitle1: 'Người lập biểu',
  signerTitle2: 'Trưởng phòng Tổ chức - Cán bộ',
  signerTitle3: 'Thủ trưởng Cơ quan / Đơn vị',
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

const STORAGE_KEY = 'hrmis_org_print_config_v1';
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
export function useOrgConfig(): [OrgPrintConfig, (cfg: OrgPrintConfig) => void] {
  const [config, setConfig] = useState<OrgPrintConfig>(DEFAULT_ORG_CONFIG);

  useEffect(() => {
    // Đọc lần đầu sau khi mount
    setConfig(getOrgConfig());

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
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const update = (newConfig: OrgPrintConfig) => {
    saveOrgConfig(newConfig);
    setConfig(newConfig);
  };

  return [config, update];
}
