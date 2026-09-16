'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Ảnh đại diện: fallback chữ cái đầu khi chưa có ảnh. */
export function Avatar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <AvatarPrimitive.Root className={cn('relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full', className)}>
      {children}
    </AvatarPrimitive.Root>
  );
}
export function AvatarFallback({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <AvatarPrimitive.Fallback className={cn('flex h-full w-full items-center justify-center bg-muted text-xs font-medium', className)}>
      {children}
    </AvatarPrimitive.Fallback>
  );
}
export function AvatarImage({ src, alt }: { src: string; alt: string }) {
  return <AvatarPrimitive.Image src={src} alt={alt} className="aspect-square h-full w-full object-cover" />;
}

/* ============================================================================
 * Bộ primitive theo phong cách shadcn/ui — dùng chung toàn ứng dụng.
 * Quy ước: chỉ dùng spacing scale Tailwind (p-*, gap-*, space-*) và token
 * z-index từ tailwind.config; không bao giờ giá trị tùy tiện.
 * ========================================================================== */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        outline: 'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
        success: 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-600',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props} />;
}

/**
 * Shadcn UI Card — chuẩn hóa Padding và Phân cấp:
 * Card: rounded-lg border bg-card text-card-foreground shadow-xs
 * CardHeader: p-6 pb-3 space-y-1.5
 * CardTitle: text-base font-semibold leading-none tracking-tight
 * CardDescription: text-sm text-muted-foreground
 * CardContent: p-6 pt-0
 * CardFooter: p-6 pt-0 flex items-center justify-end gap-2
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-border bg-card text-card-foreground shadow-xs', className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6 pb-3', className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold leading-none tracking-tight text-foreground', className)} {...props} />;
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'text-foreground border-border',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/80',
        success: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        warning: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
        info: 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export function Separator({ className }: { className?: string }) {
  return <div role="separator" className={cn('h-px w-full bg-border', className)} />;
}

function getNodeText(node: React.ReactNode): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (React.isValidElement(node) && (node.props as any)?.children) {
    return getNodeText((node.props as any).children);
  }
  return '';
}

function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export interface CustomSelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options?: CustomSelectOption[];
  searchable?: boolean;
  searchPlaceholder?: string;
  placeholder?: string;
  containerClassName?: string;
}

/**
 * Select hiện đại toàn hệ thống:
 * - Thay thế giao diện dropdown native bằng Popover Combobox bo góc sang trọng.
 * - Tự động trích xuất các thẻ <option> truyền vào hoặc nhận mảng `options`.
 * - Tự động kích hoạt thanh tìm kiếm tiếng Việt thông minh khi có từ 6 lựa chọn trở lên (hoặc khi searchable=true).
 * - Tương thích ngược 100% với form React onChange={(e) => ...} và validation HTML.
 * - Hỗ trợ phím mũi tên ↑ ↓, Enter để chọn, Escape để đóng.
 * - Tự động mở lật ngược lên trên khi dropdown gần đáy viewport / modal.
 */
export function Select({
  className,
  containerClassName,
  children,
  options,
  searchable,
  searchPlaceholder = 'Tìm kiếm...',
  placeholder = 'Chọn...',
  value,
  defaultValue,
  onChange,
  disabled,
  name,
  required,
  ...props
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [highlightIndex, setHighlightIndex] = React.useState(0);
  const [innerVal, setInnerVal] = React.useState<string | number>(
    Array.isArray(defaultValue) ? defaultValue[0] : (defaultValue ?? '')
  );
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number; openUpwards: boolean } | null>(null);
  const [mounted, setMounted] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const isControlled = value !== undefined;
  const currentVal = isControlled ? (Array.isArray(value) ? value[0] : (value as string | number)) : innerVal;

  // SSR guard
  React.useEffect(() => { setMounted(true); }, []);

  // Trích xuất danh sách options từ children hoặc props.options
  const allOptions = React.useMemo<CustomSelectOption[]>(() => {
    if (options && options.length > 0) return options;
    const extracted: CustomSelectOption[] = [];

    function processChildren(node: React.ReactNode) {
      React.Children.forEach(node, (child) => {
        if (!child) return;
        if (React.isValidElement(child)) {
          if (child.type === 'option') {
            const val = child.props.value !== undefined ? child.props.value : '';
            const lbl = child.props.children !== undefined ? getNodeText(child.props.children) : String(val);
            extracted.push({
              value: val,
              label: lbl,
              disabled: child.props.disabled,
            });
          } else if ((child.props as any)?.children) {
            processChildren((child.props as any).children);
          }
        }
      });
    }

    processChildren(children);
    return extracted;
  }, [children, options]);

  // Quyết định có hiển thị ô search hay không: tự động nếu >= 6 options hoặc searchable === true
  const isSearchActive = searchable ?? (allOptions.length >= 6);

  // Lọc theo từ khóa tìm kiếm tiếng Việt (có dấu & không dấu)
  const filteredOptions = React.useMemo(() => {
    const q = search.trim();
    if (!q) return allOptions;
    const cleanQ = removeAccents(q);
    return allOptions.filter((opt) => {
      const lbl = removeAccents(String(opt.label || ''));
      const val = removeAccents(String(opt.value || ''));
      const sub = removeAccents(String(opt.sublabel || ''));
      return lbl.includes(cleanQ) || val.includes(cleanQ) || sub.includes(cleanQ);
    });
  }, [allOptions, search]);

  // Tính toạ độ fixed cho portal popover khi mở
  const computeCoords = React.useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(Math.max(r.width, 220), 500);
    const spaceBelow = window.innerHeight - r.bottom;
    const shouldOpenUp = spaceBelow < 280 && r.top > spaceBelow;
    const leftPos = Math.min(r.left, window.innerWidth - popoverWidth - 12);
    setCoords({
      top: shouldOpenUp ? r.top - 6 : r.bottom + 6,
      left: Math.max(4, leftPos),
      width: popoverWidth,
      openUpwards: shouldOpenUp,
    });
  }, []);

  // Khi mở: tính toạ độ, focus ô tìm kiếm
  React.useEffect(() => {
    if (isOpen) {
      computeCoords();
      setSearch('');
      setHighlightIndex(0);
      if (isSearchActive) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setCoords(null);
    }
  }, [isOpen, isSearchActive, computeCoords]);

  // Cuộn tới mục đang highlight
  React.useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-select-item]');
      if (items[highlightIndex]) {
        (items[highlightIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex, isOpen]);

  // Bắt sự kiện click ra ngoài để đóng menu (kiểm tra cả portal popover)
  React.useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Đóng hoặc tái tính toạ độ khi cuộn/resize
  React.useEffect(() => {
    if (!isOpen) return;
    function handleScrollOrResize() {
      computeCoords();
    }
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, computeCoords]);

  // Xử lý chọn phần tử
  function handleSelect(optVal: string | number) {
    if (disabled) return;
    if (!isControlled) setInnerVal(optVal);
    setIsOpen(false);

    if (onChange) {
      const syntheticEvent = {
        target: { name, value: optVal },
        currentTarget: { name, value: optVal },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  }

  // Xử lý bàn phím
  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightIndex] && !filteredOptions[highlightIndex].disabled) {
        handleSelect(filteredOptions[highlightIndex].value);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  }

  // Nhãn hiển thị của option đang chọn
  const selectedOption = allOptions.find((o) => String(o.value) === String(currentVal));
  const displayLabel = selectedOption?.label || (currentVal ? String(currentVal) : placeholder);

  // Nhận diện kiểu inline và kích thước từ className
  const isInline = className?.includes('w-auto') || className?.includes('inline');
  const widthMatches = className?.match(/\b(w-\[\S+\]|w-\d+|min-w-\[\S+\]|max-w-\[\S+\]|flex-1)\b/g);

  // Nội dung popover (render qua portal)
  const popoverContent = isOpen && coords ? (
    <div
      ref={popoverRef}
      className="bg-popover border border-border rounded-md shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 flex flex-col font-sans"
      style={{
        position: 'fixed',
        left: coords.left,
        width: coords.width,
        top: coords.openUpwards ? undefined : coords.top,
        bottom: coords.openUpwards ? window.innerHeight - coords.top : undefined,
        zIndex: 99999,
      }}
    >
      {/* Ô tìm kiếm nếu danh sách >= 6 mục hoặc có cờ searchable */}
      {isSearchActive && (
        <div className="p-2 border-b border-border/70 bg-muted/20 shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full h-8 pl-8 pr-7 text-xs bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setHighlightIndex(0);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5 px-1 font-medium">
            <span>{filteredOptions.length} / {allOptions.length} lựa chọn</span>
            <span className="hidden sm:inline text-xs text-muted-foreground/80">Nhấn ↑ ↓ để chọn, Enter xác nhận</span>
          </div>
        </div>
      )}

      {/* Danh sách cuộn các lựa chọn */}
      <div ref={listRef} className="max-h-64 overflow-y-auto py-1 divide-y divide-border/20">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt, idx) => {
            const isSelected = String(opt.value) === String(currentVal);
            const isHighlighted = idx === highlightIndex;

            return (
              <button
                key={`${opt.value}-${idx}`}
                data-select-item
                type="button"
                disabled={opt.disabled}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={cn(
                  'w-full px-3 py-2 text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer text-xs sm:text-sm',
                  isHighlighted && 'bg-muted/70',
                  isSelected && 'bg-primary/10 text-primary font-semibold',
                  opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {opt.badge && (
                      <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded-md bg-muted text-foreground border border-border shrink-0">
                        {opt.badge}
                      </span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {opt.sublabel && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{opt.sublabel}</div>
                  )}
                </div>

                {isSelected && (
                  <div className="p-0.5 rounded-full bg-primary/20 text-primary shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="py-6 px-3 text-center text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Không tìm thấy kết quả</p>
            <p className="text-xs mt-1">Không có kết quả khớp với &ldquo;{search}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative font-sans',
        isInline ? 'inline-block' : 'w-full',
        widthMatches?.join(' '),
        containerClassName
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Nút trigger dropdown chuẩn hóa đồng bộ */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground',
          'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs text-left cursor-pointer',
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50',
          disabled && 'cursor-not-allowed opacity-50 bg-muted',
          className
        )}
      >
        <span className={cn('truncate flex-1', !selectedOption && !currentVal && 'text-muted-foreground')}>
          {displayLabel}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-150',
            isOpen && 'rotate-180 text-primary'
          )}
        />
      </button>

      {/* Popover menu qua portal - thoát khỏi modal overflow */}
      {mounted && popoverContent ? createPortal(popoverContent, document.body) : null}

      {/* Hidden native select để hỗ trợ HTML5 form submission và required check */}
      <select
        name={name}
        value={currentVal}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={() => {}}
        {...props}
      >
        {allOptions.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

